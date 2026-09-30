import type { ClaixClient } from "../client.js";
import type { FileInput, JsonRecord } from "../types.js";
export declare function inferExtractKind(filePath: string): "pdf" | "excel" | "document" | "image" | "audio";
export declare function extractByPath(client: ClaixClient, file: FileInput, schemaId: string, options?: {
    spaceId?: string;
    isAgentMode?: boolean;
}): Promise<JsonRecord>;
export declare function requireExtra(extra: string): never;
