export type SchemaType = "excel-json" | "json-excel" | "pdf-json" | "doc-json" | "img-json" | "txt-json" | "audio-json";
export type WindowTime = number | "infinity";
export type FileInput = string | Uint8Array | Blob | {
    filename: string;
    data: Uint8Array | Blob;
    contentType?: string;
};
export interface SchemaBody {
    name: string;
    type: SchemaType;
    schema_definition: Record<string, unknown>;
    is_agent_mode?: boolean;
    agent_definition?: Record<string, unknown>;
    resumen_agent?: string;
    window_context?: boolean;
    window_time?: WindowTime;
    cita_por_campo?: boolean;
}
export interface JsonRecord {
    [key: string]: unknown;
}
