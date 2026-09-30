export { ClaixClient, DEFAULT_API_BASE_URL, DEFAULT_ORIGIN } from "./client.js";
export type { ClaixClientOptions } from "./client.js";
export { ClaixAPIError, ClaixAuthenticationError, ClaixConnectionError, ClaixError, ClaixNotFoundError, ClaixRateLimitError, ClaixTimeoutError, ClaixValidationError, } from "./errors.js";
export { QUESTION_FORMATS, validateQuestions } from "./questions.js";
export type { QuestionFormat, QuestionInput } from "./questions.js";
export type { FileInput, JsonRecord, SchemaBody, SchemaType, WindowTime } from "./types.js";
export declare const VERSION = "1.1.0";
