import { QuestionInput } from "./questions.js";
import type { CheckSqlResponse, FileInput, JsonRecord, RetrieveSuccessResponse, SchemaBody, SchemaType, SqlParam } from "./types.js";
export declare const DEFAULT_API_BASE_URL = "https://claix.dev/api";
export declare const DEFAULT_ORIGIN = "https://claix.dev";
export interface ClaixClientOptions {
    apiKey?: string;
    baseUrl?: string;
    origin?: string;
    timeout?: number;
    maxRetries?: number;
}
export declare class ClaixClient {
    readonly apiKey: string;
    readonly baseUrl: string;
    readonly origin: string;
    readonly timeout: number;
    readonly maxRetries: number;
    constructor(options?: ClaixClientOptions);
    private request;
    private upload;
    /** Ask a Retrieve agent. The agent reads only the tables and columns you allowed. */
    retrieve: {
        ask: (agentName: string, questions: QuestionInput[]) => Promise<RetrieveSuccessResponse>;
    };
    /**
     * Check an INSERT, UPDATE, or DELETE. Claix does not run the statement.
     * A denial is still HTTP 200. Read `allowed`.
     * `connectionId` is required only when the account has more than one active connection.
     */
    guard: {
        check: (sql: string, options?: {
            params?: SqlParam[];
            connectionId?: string;
        }) => Promise<CheckSqlResponse>;
    };
    extract: {
        pdf: (file: FileInput, schemaId: string, options?: {
            spaceId?: string;
            isAgentMode?: boolean;
        }) => Promise<JsonRecord>;
        excel: (file: FileInput, schemaId: string, options?: {
            spaceId?: string;
            isAgentMode?: boolean;
        }) => Promise<JsonRecord>;
        document: (file: FileInput, schemaId: string, options?: {
            spaceId?: string;
            isAgentMode?: boolean;
        }) => Promise<JsonRecord>;
        image: (file: FileInput, schemaId: string, options?: {
            spaceId?: string;
            isAgentMode?: boolean;
        }) => Promise<JsonRecord>;
        audio: (file: FileInput, schemaId: string, options?: {
            spaceId?: string;
            isAgentMode?: boolean;
        }) => Promise<JsonRecord>;
        text: (content: string, schemaId: string, options?: {
            spaceId?: string;
            isAgentMode?: boolean;
        }) => Promise<JsonRecord>;
        jsonToExcel: (input: {
            schemaId: string;
            data?: JsonRecord | JsonRecord[];
            records?: JsonRecord[];
        }) => Promise<Uint8Array<ArrayBufferLike>>;
    };
    context: {
        get: (documentId: string) => Promise<JsonRecord>;
        ask: (documentId: string, questions: QuestionInput[]) => Promise<JsonRecord>;
        delete: (documentId: string) => Promise<JsonRecord>;
        replace: (documentId: string, newContentDocumentId: string) => Promise<JsonRecord>;
    };
    spaces: {
        create: (name: string) => Promise<JsonRecord>;
        add: (documentId: string, spaceId: string) => Promise<JsonRecord>;
        ask: (spaceId: string, questions: QuestionInput[]) => Promise<JsonRecord>;
        removeDocument: (documentId: string) => Promise<JsonRecord>;
        delete: (spaceId: string) => Promise<JsonRecord>;
    };
    schemas: {
        list: () => Promise<JsonRecord>;
        get: (schemaId: string) => Promise<JsonRecord>;
        create: (body: SchemaBody) => Promise<JsonRecord>;
        update: (schemaId: string, body: SchemaBody) => Promise<JsonRecord>;
        delete: (schemaId: string) => Promise<JsonRecord>;
    };
}
export type { SchemaType };
