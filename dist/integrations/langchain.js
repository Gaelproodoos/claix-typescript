import { extractByPath, requireExtra } from "./shared.js";
const dynamicImport = new Function("specifier", "return import(specifier)");
export async function createClaixLangChainTools(client) {
    let DynamicStructuredTool;
    let z;
    try {
        const tools = await dynamicImport("@langchain/core/tools");
        const zod = await dynamicImport("zod");
        DynamicStructuredTool = tools.DynamicStructuredTool;
        z = (zod.z ?? zod);
    }
    catch {
        requireExtra("langchain");
    }
    const specs = [
        {
            name: "claix_extract",
            description: "Extract structured JSON from a PDF, Excel/CSV, Word, image, or audio file using a Claix schema_id.",
            schema: z.object({
                filePath: z.string().describe("Local path to the file."),
                schemaId: z.string().describe("Claix schema UUID."),
                spaceId: z.string().optional().describe("Optional knowledge-space UUID."),
                isAgentMode: z.boolean().optional().describe("Use POST /agent/*-json."),
            }),
            run: async (input) => JSON.stringify(await extractByPath(client, String(input.filePath), String(input.schemaId), {
                spaceId: input.spaceId ? String(input.spaceId) : undefined,
                isAgentMode: Boolean(input.isAgentMode),
            })),
        },
        {
            name: "claix_document_context",
            description: 'Ask up to 5 questions about a persisted document. Strings are sent as format "string".',
            schema: z.object({
                documentId: z.string().describe("document_id from an extraction with window_context."),
                questions: z.array(z.string()).describe("1 to 5 questions, max 400 characters."),
            }),
            run: async (input) => JSON.stringify(await client.context.ask(String(input.documentId), input.questions)),
        },
        {
            name: "claix_space_context",
            description: "Ask up to 5 questions across every document in a knowledge space.",
            schema: z.object({
                spaceId: z.string().describe("Knowledge-space UUID."),
                questions: z.array(z.string()).describe("1 to 5 questions, max 400 characters."),
            }),
            run: async (input) => JSON.stringify(await client.spaces.ask(String(input.spaceId), input.questions)),
        },
        {
            name: "claix_add_to_space",
            description: "Add a persisted document that has no space_id to a knowledge space.",
            schema: z.object({
                documentId: z.string().describe("Document UUID with no space."),
                spaceId: z.string().describe("Destination space UUID."),
            }),
            run: async (input) => JSON.stringify(await client.spaces.add(String(input.documentId), String(input.spaceId))),
        },
        {
            name: "claix_remove_from_space",
            description: "Detach a document from its knowledge space without deleting the file.",
            schema: z.object({
                documentId: z.string().describe("Document UUID to detach."),
            }),
            run: async (input) => JSON.stringify(await client.spaces.removeDocument(String(input.documentId))),
        },
        {
            name: "claix_replace_document",
            description: "Replace a document's content, keep document_id, and delete the source document.",
            schema: z.object({
                documentId: z.string().describe("Stable document UUID."),
                newContentDocumentId: z.string().describe("Source document UUID, deleted after the swap."),
            }),
            run: async (input) => JSON.stringify(await client.context.replace(String(input.documentId), String(input.newContentDocumentId))),
        },
    ];
    return specs.map((spec) => new DynamicStructuredTool({
        name: spec.name,
        description: spec.description,
        schema: spec.schema,
        func: spec.run,
    }));
}
