import { extname } from "node:path";
import { ClaixValidationError } from "../errors.js";
export function inferExtractKind(filePath) {
    const suffix = extname(filePath).toLowerCase();
    if (suffix === ".pdf")
        return "pdf";
    if ([".xlsx", ".xls", ".csv"].includes(suffix))
        return "excel";
    if ([".jpeg", ".jpg", ".png", ".webp", ".heic", ".heif"].includes(suffix))
        return "image";
    if ([".mp3", ".wav", ".m4a", ".ogg"].includes(suffix))
        return "audio";
    if ([".docx", ".txt", ".md", ".rtf"].includes(suffix))
        return "document";
    throw new ClaixValidationError(`Cannot infer Claix extractor from extension ${suffix || "(none)"}.`);
}
export async function extractByPath(client, file, schemaId, options = {}) {
    const path = typeof file === "string" ? file : "";
    const kind = path ? inferExtractKind(path) : "document";
    if (kind === "pdf")
        return client.extract.pdf(file, schemaId, options);
    if (kind === "excel")
        return client.extract.excel(file, schemaId, options);
    if (kind === "image")
        return client.extract.image(file, schemaId, options);
    if (kind === "audio")
        return client.extract.audio(file, schemaId, options);
    return client.extract.document(file, schemaId, options);
}
export function requireExtra(extra) {
    throw new Error(`Optional peer dependency for '${extra}' is not installed. ` +
        `Install it alongside claix-ai before importing this integration.`);
}
