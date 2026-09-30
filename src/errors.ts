export class ClaixError extends Error {
  statusCode?: number;
  payload?: unknown;

  constructor(message: string, options?: { statusCode?: number; payload?: unknown }) {
    super(message);
    this.name = "ClaixError";
    this.statusCode = options?.statusCode;
    this.payload = options?.payload;
  }
}

export class ClaixAuthenticationError extends ClaixError {
  constructor(message: string, options?: { statusCode?: number; payload?: unknown }) {
    super(message, options);
    this.name = "ClaixAuthenticationError";
  }
}

export class ClaixNotFoundError extends ClaixError {
  constructor(message: string, options?: { statusCode?: number; payload?: unknown }) {
    super(message, options);
    this.name = "ClaixNotFoundError";
  }
}

export class ClaixValidationError extends ClaixError {
  constructor(message: string, options?: { statusCode?: number; payload?: unknown }) {
    super(message, options);
    this.name = "ClaixValidationError";
  }
}

export class ClaixRateLimitError extends ClaixError {
  retryAfter?: number;

  constructor(
    message: string,
    options?: { statusCode?: number; payload?: unknown; retryAfter?: number },
  ) {
    super(message, options);
    this.name = "ClaixRateLimitError";
    this.retryAfter = options?.retryAfter;
  }
}

export class ClaixTimeoutError extends ClaixError {
  constructor(message: string) {
    super(message);
    this.name = "ClaixTimeoutError";
  }
}

export class ClaixConnectionError extends ClaixError {
  constructor(message: string) {
    super(message);
    this.name = "ClaixConnectionError";
  }
}

export class ClaixAPIError extends ClaixError {
  constructor(message: string, options?: { statusCode?: number; payload?: unknown }) {
    super(message, options);
    this.name = "ClaixAPIError";
  }
}
