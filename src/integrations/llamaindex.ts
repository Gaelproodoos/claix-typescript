import type { ClaixClient } from "../client.js";
import { extractByPath, requireExtra } from "./shared.js";

interface LlamaToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  fn: (args: Record<string, unknown>) => Promise<string>;
}

function specs(client: ClaixClient): LlamaToolSpec[] {
  return [
    {
      name: "extract_document",
      description: "Extract typed JSON from a local file using a Claix schema.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string" },
          schemaId: { type: "string" },
          spaceId: { type: "string" },
          isAgentMode: { type: "boolean" },
        },
        required: ["filePath", "schemaId"],
      },
      fn: async (args) =>
        JSON.stringify(
          await extractByPath(client, String(args.filePath), String(args.schemaId), {
            spaceId: args.spaceId ? String(args.spaceId) : undefined,
            isAgentMode: Boolean(args.isAgentMode),
          }),
        ),
    },
    {
      name: "ask_document",
      description: 'Ask up to 5 questions about a persisted document. Strings use format "string".',
      parameters: {
        type: "object",
        properties: {
          documentId: { type: "string" },
          questions: { type: "array", items: { type: "string" } },
        },
        required: ["documentId", "questions"],
      },
      fn: async (args) =>
        JSON.stringify(await client.context.ask(String(args.documentId), args.questions as string[])),
    },
    {
      name: "ask_knowledge_space",
      description: "Ask up to 5 cross-document questions over a knowledge space.",
      parameters: {
        type: "object",
        properties: {
          spaceId: { type: "string" },
          questions: { type: "array", items: { type: "string" } },
        },
        required: ["spaceId", "questions"],
      },
      fn: async (args) =>
        JSON.stringify(await client.spaces.ask(String(args.spaceId), args.questions as string[])),
    },
    {
      name: "add_to_space",
      description: "Assign a persisted document with no space_id to a knowledge space.",
      parameters: {
        type: "object",
        properties: { documentId: { type: "string" }, spaceId: { type: "string" } },
        required: ["documentId", "spaceId"],
      },
      fn: async (args) =>
        JSON.stringify(await client.spaces.add(String(args.documentId), String(args.spaceId))),
    },
    {
      name: "remove_from_space",
      description: "Detach a document from its knowledge space without deleting the file.",
      parameters: {
        type: "object",
        properties: { documentId: { type: "string" } },
        required: ["documentId"],
      },
      fn: async (args) => JSON.stringify(await client.spaces.removeDocument(String(args.documentId))),
    },
    {
      name: "replace_document",
      description: "Replace a document's content, keep document_id, and delete the source.",
      parameters: {
        type: "object",
        properties: {
          documentId: { type: "string" },
          newContentDocumentId: { type: "string" },
        },
        required: ["documentId", "newContentDocumentId"],
      },
      fn: async (args) =>
        JSON.stringify(
          await client.context.replace(String(args.documentId), String(args.newContentDocumentId)),
        ),
    },
  ];
}

const dynamicImport = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<Record<string, unknown>>;

export async function createClaixLlamaIndexTools(client: ClaixClient): Promise<unknown[]> {
  let FunctionTool: { from: (fn: unknown, metadata: unknown) => unknown };
  try {
    const llamaindex = await dynamicImport("llamaindex");
    FunctionTool = llamaindex.FunctionTool as typeof FunctionTool;
  } catch {
    requireExtra("llamaindex");
  }
  return specs(client).map((spec) =>
    FunctionTool.from(spec.fn, {
      name: spec.name,
      description: spec.description,
      parameters: spec.parameters,
    }),
  );
}
