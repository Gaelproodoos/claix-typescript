import type { ClaixClient } from "../client.js";
import { extractByPath, requireExtra } from "./shared.js";

const dynamicImport = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<Record<string, unknown>>;

type ArgSpec = {
  type: "string" | "boolean" | "array";
  description: string;
  required: boolean;
  items?: { type: "string" };
};

interface StructuredToolCtor {
  new (options: {
    name: string;
    description: string;
    argsSchema: Record<string, ArgSpec>;
    func: (args: Record<string, unknown>) => Promise<string>;
  }): unknown;
}

function stringArg(description: string, required = true): ArgSpec {
  return { type: "string", description, required };
}

export async function createClaixCrewTools(client: ClaixClient): Promise<unknown[]> {
  let StructuredTool: StructuredToolCtor;
  try {
    const crewai = await dynamicImport("@crewai-ts/core");
    StructuredTool = crewai.StructuredTool as StructuredToolCtor;
    if (typeof StructuredTool !== "function") {
      throw new Error("StructuredTool export missing");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "StructuredTool export missing") throw error;
    requireExtra("crewai");
  }

  const specs: ConstructorParameters<StructuredToolCtor>[0][] = [
    {
      name: "claix_document",
      description:
        "Read a PDF, Excel, Word, image, or audio file and extract schema-typed JSON with Claix.",
      argsSchema: {
        filePath: stringArg("Local path to the file the agent should extract."),
        schemaId: stringArg("Claix schema UUID for the expected JSON shape."),
        spaceId: stringArg("Optional knowledge-space UUID.", false),
        isAgentMode: {
          type: "boolean",
          description: "Use /agent/*-json for Agent mode.",
          required: false,
        },
      },
      func: async (args) =>
        JSON.stringify(
          await extractByPath(client, String(args.filePath), String(args.schemaId), {
            spaceId: args.spaceId ? String(args.spaceId) : undefined,
            isAgentMode: Boolean(args.isAgentMode),
          }),
        ),
    },
    {
      name: "claix_knowledge_space",
      description:
        'Ask up to 5 questions across every document in a Claix knowledge space. Strings are sent as format "string".',
      argsSchema: {
        spaceId: stringArg("Knowledge-space UUID to query."),
        questions: {
          type: "array",
          description: "Up to 5 questions, 400 characters each.",
          required: true,
          items: { type: "string" },
        },
      },
      func: async (args) =>
        JSON.stringify(await client.spaces.ask(String(args.spaceId), args.questions as string[])),
    },
    {
      name: "claix_add_to_space",
      description: "Add a persisted Claix document that has no space_id to a knowledge space.",
      argsSchema: {
        documentId: stringArg("Document UUID with no space."),
        spaceId: stringArg("Destination space UUID."),
      },
      func: async (args) =>
        JSON.stringify(await client.spaces.add(String(args.documentId), String(args.spaceId))),
    },
    {
      name: "claix_remove_from_space",
      description: "Detach a document from its knowledge space without deleting the file.",
      argsSchema: {
        documentId: stringArg("Document UUID to detach."),
      },
      func: async (args) =>
        JSON.stringify(await client.spaces.removeDocument(String(args.documentId))),
    },
    {
      name: "claix_replace_document",
      description: "Replace a document's content, keep document_id, and delete the source document.",
      argsSchema: {
        documentId: stringArg("Stable document UUID."),
        newContentDocumentId: stringArg("Source document UUID, deleted after the swap."),
      },
      func: async (args) =>
        JSON.stringify(
          await client.context.replace(String(args.documentId), String(args.newContentDocumentId)),
        ),
    },
  ];

  return specs.map((spec) => new StructuredTool(spec));
}
