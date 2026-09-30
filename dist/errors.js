export class ClaixError extends Error {
    statusCode;
    payload;
    constructor(message, options) {
        super(message);
        this.name = "ClaixError";
        this.statusCode = options?.statusCode;
        this.payload = options?.payload;
    }
}
export class ClaixAuthenticationError extends ClaixError {
    constructor(message, options) {
        super(message, options);
        this.name = "ClaixAuthenticationError";
    }
}
export class ClaixNotFoundError extends ClaixError {
    constructor(message, options) {
        super(message, options);
        this.name = "ClaixNotFoundError";
    }
}
export class ClaixValidationError extends ClaixError {
    constructor(message, options) {
        super(message, options);
        this.name = "ClaixValidationError";
    }
}
export class ClaixRateLimitError extends ClaixError {
    retryAfter;
    constructor(message, options) {
        super(message, options);
        this.name = "ClaixRateLimitError";
        this.retryAfter = options?.retryAfter;
    }
}
export class ClaixTimeoutError extends ClaixError {
    constructor(message) {
        super(message);
        this.name = "ClaixTimeoutError";
    }
}
export class ClaixConnectionError extends ClaixError {
    constructor(message) {
        super(message);
        this.name = "ClaixConnectionError";
    }
}
export class ClaixAPIError extends ClaixError {
    constructor(message, options) {
        super(message, options);
        this.name = "ClaixAPIError";
    }
}
