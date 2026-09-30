export declare class ClaixError extends Error {
    statusCode?: number;
    payload?: unknown;
    constructor(message: string, options?: {
        statusCode?: number;
        payload?: unknown;
    });
}
export declare class ClaixAuthenticationError extends ClaixError {
    constructor(message: string, options?: {
        statusCode?: number;
        payload?: unknown;
    });
}
export declare class ClaixNotFoundError extends ClaixError {
    constructor(message: string, options?: {
        statusCode?: number;
        payload?: unknown;
    });
}
export declare class ClaixValidationError extends ClaixError {
    constructor(message: string, options?: {
        statusCode?: number;
        payload?: unknown;
    });
}
export declare class ClaixRateLimitError extends ClaixError {
    retryAfter?: number;
    constructor(message: string, options?: {
        statusCode?: number;
        payload?: unknown;
        retryAfter?: number;
    });
}
export declare class ClaixTimeoutError extends ClaixError {
    constructor(message: string);
}
export declare class ClaixConnectionError extends ClaixError {
    constructor(message: string);
}
export declare class ClaixAPIError extends ClaixError {
    constructor(message: string, options?: {
        statusCode?: number;
        payload?: unknown;
    });
}
