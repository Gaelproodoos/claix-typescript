export declare const QUESTION_FORMATS: readonly ["string", "int", "boolean", "timestamp", "array"];
export type QuestionFormat = (typeof QUESTION_FORMATS)[number];
export declare const RETRIEVE_QUESTION_FORMATS: readonly ["string", "int", "boolean", "timestamp", "timestamptz", "timestampz", "date", "json", "array", "array:string", "array:int"];
export type RetrieveQuestionFormat = (typeof RETRIEVE_QUESTION_FORMATS)[number];
export type QuestionInput = string | {
    question: string;
    format?: string;
};
export declare function validateQuestions(questions: QuestionInput[]): {
    question: string;
    format: QuestionFormat;
}[];
export declare function validateRetrieveQuestions(questions: QuestionInput[]): {
    question: string;
    format: RetrieveQuestionFormat;
}[];
