import { describe, expect, it } from "vitest";
import {
  assertIdempotencyKey,
  computeBackoffMinutes,
  redactIntegrationPayload,
  signWebhookPayload,
  verifyWebhookSignature,
} from "@/features/integrations/integration-workflow";

describe("integration workflow", () => {
  it("redacts secrets and clinical terms from logs", () => {
    expect(redactIntegrationPayload({ cpf: "123", ok: "valor", token: "abc" })).toEqual({
      cpf: "[redacted]",
      ok: "valor",
      token: "[redacted]",
    });
  });

  it("computes capped exponential backoff", () => {
    expect(computeBackoffMinutes(3)).toBe(8);
    expect(computeBackoffMinutes(99)).toBe(480);
  });

  it("signs and verifies webhook payloads", () => {
    const signature = signWebhookPayload("segredo", JSON.stringify({ ok: true }));
    expect(verifyWebhookSignature("segredo", JSON.stringify({ ok: true }), signature)).toBe(true);
  });

  it("validates idempotency keys", () => {
    expect(assertIdempotencyKey("job:abc-123")).toBe("job:abc-123");
    expect(() => assertIdempotencyKey("x")).toThrow("idempotência");
  });
});
