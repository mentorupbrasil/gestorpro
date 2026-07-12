export type AppErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "PERMISSION_DENIED"
  | "TENANT_CONTEXT_REQUIRED"
  | "TENANT_ACCESS_DENIED"
  | "VALIDATION_FAILED"
  | "VERSION_CONFLICT"
  | "INTERNAL_ERROR";

type AppErrorOptions = {
  cause?: unknown;
  details?: Readonly<Record<string, unknown>>;
  status: number;
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details: Readonly<Record<string, unknown>>;
  readonly status: number;

  constructor(code: AppErrorCode, message: string, options: AppErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.details = options.details ?? {};
    this.status = options.status;
  }
}

export function toPublicError(error: unknown, requestId: string) {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          requestId,
          details: error.details,
        },
      },
    } as const;
  }

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR" as const,
        message: "Não foi possível concluir a operação.",
        requestId,
        details: {},
      },
    },
  } as const;
}
