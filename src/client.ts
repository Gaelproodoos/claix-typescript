import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import {
  ClaixAPIError,
  ClaixAuthenticationError,
  ClaixConnectionError,
  ClaixError,
  ClaixNotFoundError,
  ClaixRateLimitError,
  ClaixTimeoutError,
  ClaixValidationError,
} from "./errors.js";
import { QuestionInput, validateQuestions } from "./questions.js";
import type { FileInput, JsonRecord, SchemaBody, SchemaType } from "./types.js";

export const DEFAULT_API_BASE_URL = "https://claix.dev/api";
export const DEFAULT_ORIGIN = "https://claix.dev";
const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_RETRIES = 3;
const RETRYABLE = new Set([429, 502, 503, 504]);
const USER_AGENT = "claix-typescript/1.1.0";

export interface ClaixClientOptions {
  apiKey?: string;
  baseUrl?: string;
  origin?: string;
  timeout?: number;
  maxRetries?: number;
}

function originFromBase(baseUrl: string): string {
  const parsed = new URL(baseUrl);
  return `${parsed.protocol}//${parsed.host}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(attempt: number, retryAfter?: number): number {
  if (retryAfter != null) return Math.max(0, retryAfter) * 1000;
  return Math.min(8000, 2 ** attempt * 1000 + Math.random() * 1000);
}

async function raiseForStatus(response: Response): Promise<void> {
  if (response.status < 400) return;
  let payload: unknown;
  const text = await response.text();
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: text };
  }
  const body = (payload ?? {}) as { error?: string; detalle?: string };
  const errorText = body.error ?? "";
  const detalle = body.detalle ?? "";
  let message = errorText || detalle || `Claix API error (HTTP ${response.status})`;
  if (errorText && detalle && !errorText.includes(detalle)) {
    message = `${errorText} (${detalle})`;
  }
  const options = { statusCode: response.status, payload };
  if (response.status === 401) throw new ClaixAuthenticationError(message, options);
  if (response.status === 404) throw new ClaixNotFoundError(message, options);
  if ([400, 405, 413, 422].includes(response.status)) {
    throw new ClaixValidationError(message, options);
  }
  if (response.status === 429) {
    const header = response.headers.get("Retry-After");
    const retryAfter = header ? Number(header) : undefined;
    throw new ClaixRateLimitError(message, {
      ...options,
      retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
    });
  }
  throw new ClaixAPIError(message, options);
}

function schemaPayload(body: SchemaBody): SchemaBody {
  const payload: SchemaBody = {
    name: body.name,
    type: body.type,
    schema_definition: body.schema_definition,
  };
  if (body.is_agent_mode != null) payload.is_agent_mode = body.is_agent_mode;
  if (body.agent_definition != null) payload.agent_definition = body.agent_definition;
  if (body.resumen_agent != null) payload.resumen_agent = body.resumen_agent;
  if (body.window_context != null) payload.window_context = body.window_context;
  if (body.window_time != null) payload.window_time = body.window_time;
  if (body.cita_por_campo != null) payload.cita_por_campo = body.cita_por_campo;
  return payload;
}

async function toFilePart(
  file: FileInput,
  defaultName: string,
  contentType: string,
): Promise<{ filename: string; data: Blob; contentType: string }> {
  if (typeof file === "string") {
    const data = await readFile(file);
    return { filename: basename(file), data: new Blob([Buffer.from(data)]), contentType };
  }
  if (file instanceof Uint8Array) {
    return { filename: defaultName, data: new Blob([Buffer.from(file)]), contentType };
  }
  if (typeof Blob !== "undefined" && file instanceof Blob) {
    return { filename: defaultName, data: file, contentType };
  }
  const named = file as { filename: string; data: Uint8Array | Blob; contentType?: string };
  const data =
    named.data instanceof Blob ? named.data : new Blob([Buffer.from(named.data)]);
  return {
    filename: named.filename,
    data,
    contentType: named.contentType ?? contentType,
  };
}

export class ClaixClient {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly origin: string;
  readonly timeout: number;
  readonly maxRetries: number;

  constructor(options: ClaixClientOptions = {}) {
    const key = options.apiKey ?? process.env.CLAIX_API_KEY;
    if (!key) {
      throw new ClaixAuthenticationError(
        "Missing Claix API key. Pass apiKey or set CLAIX_API_KEY.",
      );
    }
    this.apiKey = key;
    this.baseUrl = (options.baseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
    this.origin = (options.origin ?? originFromBase(this.baseUrl)).replace(/\/$/, "");
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  private async request(
    method: string,
    url: string,
    init: { json?: unknown; form?: FormData; expectJson?: boolean } = {},
  ): Promise<unknown> {
    const expectJson = init.expectJson !== false;
    let lastError: ClaixError | undefined;
    const attempts = this.maxRetries + 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      try {
        const headers: Record<string, string> = {
          "x-api-key": this.apiKey,
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        };
        let body: BodyInit | undefined;
        if (init.form) {
          body = init.form;
        } else if (init.json !== undefined) {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify(init.json);
        }
        const response = await fetch(url, { method, headers, body, signal: controller.signal });
        clearTimeout(timer);
        if (RETRYABLE.has(response.status) && attempt < attempts - 1) {
          const header = response.headers.get("Retry-After");
          const retryAfter = header ? Number(header) : undefined;
          await response.arrayBuffer();
          await sleep(retryDelay(attempt, Number.isFinite(retryAfter) ? retryAfter : undefined));
          continue;
        }
        if (!expectJson) {
          await raiseForStatus(response.clone());
          return new Uint8Array(await response.arrayBuffer());
        }
        await raiseForStatus(response);
        if (response.status === 204) return {};
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("json")) {
          return new Uint8Array(await response.arrayBuffer());
        }
        return (await response.json()) as unknown;
      } catch (error) {
        clearTimeout(timer);
        if (error instanceof ClaixError) {
          if (error instanceof ClaixRateLimitError && attempt < attempts - 1) {
            await sleep(retryDelay(attempt, error.retryAfter));
            lastError = error;
            continue;
          }
          throw error;
        }
        const aborted = error instanceof Error && error.name === "AbortError";
        lastError = aborted
          ? new ClaixTimeoutError(`Request timed out after ${this.timeout}ms`)
          : new ClaixConnectionError(`Connection error: ${(error as Error).message}`);
        if (attempt >= attempts - 1) throw lastError;
        await sleep(retryDelay(attempt));
      }
    }
    throw lastError ?? new ClaixAPIError("Request failed after retries");
  }

  private async upload(
    slug: string,
    file: FileInput,
    schemaId: string,
    options: { spaceId?: string; isAgentMode?: boolean; defaultName: string; contentType: string },
  ): Promise<JsonRecord> {
    const part = await toFilePart(file, options.defaultName, options.contentType);
    const form = new FormData();
    form.set("schema_id", schemaId);
    if (options.spaceId) form.set("space_id", options.spaceId);
    form.set("file", part.data, part.filename);
    const url = options.isAgentMode
      ? `${this.origin}/agent/${slug}`
      : `${this.baseUrl}/${slug}`;
    return (await this.request("POST", url, { form })) as JsonRecord;
  }

  extract = {
    pdf: (file: FileInput, schemaId: string, options?: { spaceId?: string; isAgentMode?: boolean }) =>
      this.upload("pdf-json", file, schemaId, {
        ...options,
        defaultName: "document.pdf",
        contentType: "application/pdf",
      }),
    excel: (file: FileInput, schemaId: string, options?: { spaceId?: string; isAgentMode?: boolean }) =>
      this.upload("excel-json", file, schemaId, {
        ...options,
        defaultName: "workbook.xlsx",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    document: (file: FileInput, schemaId: string, options?: { spaceId?: string; isAgentMode?: boolean }) =>
      this.upload("doc-json", file, schemaId, {
        ...options,
        defaultName: "document.docx",
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    image: (file: FileInput, schemaId: string, options?: { spaceId?: string; isAgentMode?: boolean }) =>
      this.upload("img-json", file, schemaId, {
        ...options,
        defaultName: "image.jpg",
        contentType: "image/jpeg",
      }),
    audio: (file: FileInput, schemaId: string, options?: { spaceId?: string; isAgentMode?: boolean }) =>
      this.upload("audio-json", file, schemaId, {
        ...options,
        defaultName: "audio.mp3",
        contentType: "audio/mpeg",
      }),
    text: async (
      content: string,
      schemaId: string,
      options?: { spaceId?: string; isAgentMode?: boolean },
    ) => {
      const form = new FormData();
      form.set("content", content);
      form.set("schema_id", schemaId);
      if (options?.spaceId) form.set("space_id", options.spaceId);
      const url = options?.isAgentMode ? `${this.origin}/agent/txt-json` : `${this.baseUrl}/txt-json`;
      return (await this.request("POST", url, { form })) as JsonRecord;
    },
    jsonToExcel: async (input: { schemaId: string; data?: JsonRecord | JsonRecord[]; records?: JsonRecord[] }) => {
      const body: JsonRecord = { schema_id: input.schemaId };
      if (input.data != null) body.data = Array.isArray(input.data) ? input.data : [input.data];
      if (input.records != null) body.records = input.records;
      return (await this.request("POST", `${this.baseUrl}/json-excel`, {
        json: body,
        expectJson: false,
      })) as Uint8Array;
    },
  };

  context = {
    get: (documentId: string) =>
      this.request("GET", `${this.origin}/get-document/${documentId}`) as Promise<JsonRecord>,
    ask: (documentId: string, questions: QuestionInput[]) =>
      this.request("POST", `${this.origin}/document-context/${documentId}`, {
        json: { questions: validateQuestions(questions) },
      }) as Promise<JsonRecord>,
    delete: (documentId: string) =>
      this.request("DELETE", `${this.origin}/delete-document/${documentId}`) as Promise<JsonRecord>,
    replace: (documentId: string, newContentDocumentId: string) =>
      this.request("POST", `${this.origin}/replace-document`, {
        json: { document_id: documentId, new_content_document_id: newContentDocumentId },
      }) as Promise<JsonRecord>,
  };

  spaces = {
    create: (name: string) =>
      this.request("POST", `${this.origin}/create-space`, { json: { name } }) as Promise<JsonRecord>,
    add: (documentId: string, spaceId: string) =>
      this.request("POST", `${this.origin}/add-space`, {
        json: { document_id: documentId, space_id: spaceId },
      }) as Promise<JsonRecord>,
    ask: (spaceId: string, questions: QuestionInput[]) =>
      this.request("POST", `${this.origin}/space-context/${spaceId}`, {
        json: { questions: validateQuestions(questions) },
      }) as Promise<JsonRecord>,
    removeDocument: (documentId: string) =>
      this.request(
        "DELETE",
        `${this.origin}/remove-document-from-space/${documentId}`,
      ) as Promise<JsonRecord>,
    delete: (spaceId: string) =>
      this.request("DELETE", `${this.origin}/delete-space/${spaceId}`) as Promise<JsonRecord>,
  };

  schemas = {
    list: () => this.request("GET", `${this.baseUrl}/schemas`) as Promise<JsonRecord>,
    get: (schemaId: string) =>
      this.request("GET", `${this.baseUrl}/get-schema/${schemaId}`) as Promise<JsonRecord>,
    create: (body: SchemaBody) =>
      this.request("POST", `${this.baseUrl}/create-schema`, {
        json: schemaPayload(body),
      }) as Promise<JsonRecord>,
    update: (schemaId: string, body: SchemaBody) =>
      this.request("PUT", `${this.baseUrl}/update-schema/${schemaId}`, {
        json: schemaPayload(body),
      }) as Promise<JsonRecord>,
    delete: (schemaId: string) =>
      this.request("POST", `${this.baseUrl}/delete-schema`, {
        json: { schema_id: schemaId },
      }) as Promise<JsonRecord>,
  };
}

export type { SchemaType };
