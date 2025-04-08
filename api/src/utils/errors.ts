import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AuthError extends Error {
  constructor(
    message: string,
    public status: ContentfulStatusCode = 500,
    public code:
      | "INVALID_CREDENTIALS"
      | "USER_NOT_FOUND"
      | "USERNAME_TAKEN"
      | "REGISTRATION_FAILED" = "INVALID_CREDENTIALS"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class StorageError extends Error {
    constructor(
        message: string,
        public status?: string,
        public code?: number
    ) {
    super(message);
    this.name = "StorageError";
  }
}

export class KeyError extends Error {
  constructor(
    message: string,
    public status: ContentfulStatusCode = 500,
    public code: "KEY_NOT_FOUND" | "INVALID_KEY" = "KEY_NOT_FOUND"
  ) {
    super(message);
    this.name = "KeyError";
  }
}
