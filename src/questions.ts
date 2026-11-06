import { ClaixValidationError } from "./errors.js";

export const QUESTION_FORMATS = ["string", "int", "boolean", "timestamp", "array"] as const;
export type QuestionFormat = (typeof QUESTION_FORMATS)[number];

export const RETRIEVE_QUESTION_FORMATS = [
  "string",
  "int",
  "boolean",
  "timestamp",
  "timestamptz",
  "timestampz",
  "date",
  "json",
  "array",
  "array:string",
  "array:int",
] as const;
export type RetrieveQuestionFormat = (typeof RETRIEVE_QUESTION_FORMATS)[number];

export type QuestionInput = string | { question: string; format?: string };

export function validateQuestions(questions: QuestionInput[]): { question: string; format: QuestionFormat }[] {
  const cleaned: { question: string; format: QuestionFormat }[] = [];
  for (const raw of questions) {
    const question = (typeof raw === "string" ? raw : raw.question).trim();
    const format = (typeof raw === "string" ? "string" : raw.format ?? "string").trim();
    if (!question) continue;
    if (!QUESTION_FORMATS.includes(format as QuestionFormat)) {
      throw new ClaixValidationError(
        `format must be one of: ${QUESTION_FORMATS.join(", ")} (got ${format}).`,
      );
    }
    cleaned.push({ question, format: format as QuestionFormat });
  }
  if (cleaned.length === 0) {
    throw new ClaixValidationError("At least one question is required.");
  }
  if (cleaned.length > 5) {
    throw new ClaixValidationError("A maximum of 5 questions is allowed per call.");
  }
  for (const item of cleaned) {
    if (item.question.length > 400) {
      throw new ClaixValidationError(
        `Each question must be at most 400 characters (got ${item.question.length}).`,
      );
    }
  }
  return cleaned;
}

export function validateRetrieveQuestions(
  questions: QuestionInput[],
): { question: string; format: RetrieveQuestionFormat }[] {
  const cleaned: { question: string; format: RetrieveQuestionFormat }[] = [];
  for (const raw of questions) {
    const question = (typeof raw === "string" ? raw : raw.question).trim();
    const format = (typeof raw === "string" ? "string" : raw.format ?? "string").trim();
    if (!question) continue;
    if (!RETRIEVE_QUESTION_FORMATS.includes(format as RetrieveQuestionFormat)) {
      throw new ClaixValidationError(
        `format must be one of: ${RETRIEVE_QUESTION_FORMATS.join(", ")} (got ${format}).`,
      );
    }
    cleaned.push({ question, format: format as RetrieveQuestionFormat });
  }
  if (cleaned.length === 0) {
    throw new ClaixValidationError("At least one question is required.");
  }
  if (cleaned.length > 5) {
    throw new ClaixValidationError("A maximum of 5 questions is allowed per call.");
  }
  for (const item of cleaned) {
    if (item.question.length > 400) {
      throw new ClaixValidationError(
        `Each question must be at most 400 characters (got ${item.question.length}).`,
      );
    }
  }
  return cleaned;
}
