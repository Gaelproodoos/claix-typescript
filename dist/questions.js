import { ClaixValidationError } from "./errors.js";
export const QUESTION_FORMATS = ["string", "int", "boolean", "timestamp", "array"];
export function validateQuestions(questions) {
    const cleaned = [];
    for (const raw of questions) {
        const question = (typeof raw === "string" ? raw : raw.question).trim();
        const format = (typeof raw === "string" ? "string" : raw.format ?? "string").trim();
        if (!question)
            continue;
        if (!QUESTION_FORMATS.includes(format)) {
            throw new ClaixValidationError(`format must be one of: ${QUESTION_FORMATS.join(", ")} (got ${format}).`);
        }
        cleaned.push({ question, format: format });
    }
    if (cleaned.length === 0) {
        throw new ClaixValidationError("At least one question is required.");
    }
    if (cleaned.length > 5) {
        throw new ClaixValidationError("A maximum of 5 questions is allowed per call.");
    }
    for (const item of cleaned) {
        if (item.question.length > 400) {
            throw new ClaixValidationError(`Each question must be at most 400 characters (got ${item.question.length}).`);
        }
    }
    return cleaned;
}
