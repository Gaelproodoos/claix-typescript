import { extractByPath, requireExtra } from "./shared.js";
const dynamicImport = new Function("specifier", "return import(specifier)");
function stringArg(description, required = true) {
    return { type: "string", description, required };
}
export async function createClaixCrewTools(client) {
    let StructuredTool;
    try {
        const crewai = await dynamicImport("@crewai-ts/core");
        StructuredTool = crewai.StructuredTool;
        if (typeof StructuredTool !== "function") {
            throw new Error("StructuredTool export missing");
        }
    }
    catch (error) {
        if (error instanceof Error && error.message === "StructuredTool export missing")
            throw error;
        requireExtra("crewai");
    }
    const specs = [
        {
            name: "claix_retrieve",
            description: "Ask a Claix Retrieve agent a question about the live database. The agent can read only the tables and columns you allowed. POST /retrieve/{agent_name}.",
            argsSchema: {
                agentName: stringArg("Retrieve agent slug, the last segment of POST /retrieve/{agent_name}."),
                questions: {
                    type: "array",
                    description: "1 to 5 questions. Each string is sent as format string.",
                    required: true,
                    items: { type: "string" },
                },
            },
            func: async (args) => JSON.stringify(await client.retrieve.ask(String(args.agentName), args.questions)),
        },
        {
            name: "claix_guard",
            description: "Check an INSERT, UPDATE, or DELETE before running it. Claix answers allow or deny with the reason and never executes the statement. POST /check-sql. Run the SQL yourself only when allowed is true.",
            argsSchema: {
                sql: stringArg("One INSERT, UPDATE, or DELETE the agent proposes. Claix does not run it."),
                params: {
                    type: "array",
                    description: "Placeholder values in order. PostgreSQL uses $1, MySQL and MariaDB use ?.",
                    required: false,
                    items: { type: "string" },
                },
                connectionId: stringArg("Required only when the account has more than one active connection.", false),
            },
            func: async (args) => JSON.stringify(await client.guard.check(String(args.sql), {
                params: Array.isArray(args.params) ? args.params : undefined,
                connectionId: args.connectionId ? String(args.connectionId) : undefined,
            })),
        },
        {
            name: "claix_document",
            description: "Read a PDF, Excel, Word, image, or audio file and extract schema-typed JSON with Claix.",
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
            func: async (args) => JSON.stringify(await extractByPath(client, String(args.filePath), String(args.schemaId), {
                spaceId: args.spaceId ? String(args.spaceId) : undefined,
                isAgentMode: Boolean(args.isAgentMode),
            })),
        },
        {
            name: "claix_knowledge_space",
            description: 'Ask up to 5 questions across every document in a Claix knowledge space. Strings are sent as format "string".',
            argsSchema: {
                spaceId: stringArg("Knowledge-space UUID to query."),
                questions: {
                    type: "array",
                    description: "Up to 5 questions, 400 characters each.",
                    required: true,
                    items: { type: "string" },
                },
            },
            func: async (args) => JSON.stringify(await client.spaces.ask(String(args.spaceId), args.questions)),
        },
        {
            name: "claix_add_to_space",
            description: "Add a persisted Claix document that has no space_id to a knowledge space.",
            argsSchema: {
                documentId: stringArg("Document UUID with no space."),
                spaceId: stringArg("Destination space UUID."),
            },
            func: async (args) => JSON.stringify(await client.spaces.add(String(args.documentId), String(args.spaceId))),
        },
        {
            name: "claix_remove_from_space",
            description: "Detach a document from its knowledge space without deleting the file.",
            argsSchema: {
                documentId: stringArg("Document UUID to detach."),
            },
            func: async (args) => JSON.stringify(await client.spaces.removeDocument(String(args.documentId))),
        },
        {
            name: "claix_replace_document",
            description: "Replace a document's content, keep document_id, and delete the source document.",
            argsSchema: {
                documentId: stringArg("Stable document UUID."),
                newContentDocumentId: stringArg("Source document UUID, deleted after the swap."),
            },
            func: async (args) => JSON.stringify(await client.context.replace(String(args.documentId), String(args.newContentDocumentId))),
        },
    ];
    return specs.map((spec) => new StructuredTool(spec));
}
