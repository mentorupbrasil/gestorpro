import { describe, expect, it } from "vitest";
import { AppError, toPublicError } from "@/core/errors/app-error";

describe("public errors", () => {
  it("serializes known errors without a stack or cause", () => {
    const result = toPublicError(
      new AppError("VERSION_CONFLICT", "O registro foi alterado por outra pessoa.", {
        cause: new Error("sensitive"),
        details: { currentVersion: 3 },
        status: 409,
      }),
      "request-1",
    );

    expect(result).toEqual({
      status: 409,
      body: {
        error: {
          code: "VERSION_CONFLICT",
          message: "O registro foi alterado por outra pessoa.",
          requestId: "request-1",
          details: { currentVersion: 3 },
        },
      },
    });
  });

  it("redacts unknown internal errors", () => {
    expect(toPublicError(new Error("database secret"), "request-2").body.error).toEqual({
      code: "INTERNAL_ERROR",
      message: "Não foi possível concluir a operação.",
      requestId: "request-2",
      details: {},
    });
  });
});
