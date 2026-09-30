import { extname } from "node:path";
import type { ClaixClient } from "../client.js";
import { ClaixValidationError } from "../errors.js";
import type { FileInput, JsonRecord } from "../types.js";

export function inferExtractKind(filePath: string): "pdf" | "excel" | "document" | "image" | "audio" {
  const suffix = extname(filePath).toLowerCase();
  if (suffix === ".pdf") return "pdf";
  if ([".xlsx", ".xls", ".csv"].includes(suffix)) return "excel";
  if ([".jpeg", ".jpg", ".png", ".webp", ".heic", ".heif"].includes(suffix)) return "image";
  if ([".mp3", ".wav", ".m4a", ".ogg"].includes(suffix)) return "audio";
  if ([".docx", ".txt", ".md", ".rtf"].includes(suffix)) return "document";
  throw new ClaixValidationError(
    `Cannot infer Claix extractor from extension ${suffix || "(none)"}.`,
  );
}

export async function extractByPath(
  client: ClaixClient,
  file: FileInput,
  schemaId: string,
  options: { spaceId?: string; isAgentMode?: boolean } = {},
): Promise<JsonRecord> {
  const path = typeof file === "string" ? file : "";
  const kind = path ? inferExtractKind(path) : "document";
  if (kind === "pdf") return client.extract.pdf(file, schemaId, options);
  if (kind === "excel") return client.extract.excel(file, schemaId, options);
  if (kind === "image") return client.extract.image(file, schemaId, options);
  if (kind === "audio") return client.extract.audio(file, schemaId, options);
  return client.extract.document(file, schemaId, options);
}

export function requireExtra(extra: string): never {
  throw new Error(
    `Optional peer dependency for '${extra}' is not installed. ` +
      `Install it alongside claix-ai before importing this integration.`,
  );
}
