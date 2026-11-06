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
export type SqlParam = string | number | boolean | null;
export interface RetrieveSuccessResponse {
    user_ask: unknown[];
    ia_response: unknown[];
    log_id?: string | null;
    [key: string]: unknown;
}
export interface GuardViolation {
    guard_id?: string | null;
    guard_name?: string | null;
    rule_id?: string | null;
    rule_title?: string | null;
    code?: string | null;
    message?: string | null;
    [key: string]: unknown;
}
export interface CheckSqlResponse {
    allowed: boolean;
    decision_id?: string | null;
    code?: string | null;
    reason?: string | null;
    operation?: string | null;
    table?: string | null;
    affected_rows?: number | null;
    violations?: GuardViolation[];
    rules_checked?: number | null;
    latency_ms?: number | null;
    [key: string]: unknown;
}
