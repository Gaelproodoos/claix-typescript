export declare const QUESTION_FORMATS: readonly ["string", "int", "boolean", "timestamp", "array"];
export type QuestionFormat = (typeof QUESTION_FORMATS)[number];
export type QuestionInput = string | {
    question: string;
    format?: QuestionFormat | string;
};
export declare function validateQuestions(questions: QuestionInput[]): {
    question: string;
    format: QuestionFormat;
}[];
