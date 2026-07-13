import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "@/core/errors/app-error";

export function redactIntegrationPayload(payload: Record<string, unknown>) {
  const forbidden = [/password/i, /secret/i, /token/i, /cpf/i, /diagn/i, /result/i];
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (forbidden.some((pattern) => pattern.test(key))) return [key, "[redacted]"];
      if (typeof value === "string" && forbidden.some((pattern) => pattern.test(value))) {
        return [key, "[redacted]"];
      }
      return [key, value];
    }),
  );
}

export function computeBackoffMinutes(attempt: number) {
  if (!Number.isInteger(attempt) || attempt < 0) {
    throw new AppError("VALIDATION_FAILED", "Tentativa inválida.", { status: 400 });
  }

  return Math.min(2 ** attempt, 480);
}

export function signWebhookPayload(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyWebhookSignature(secret: string, payload: string, signature: string) {
  const expected = Buffer.from(signWebhookPayload(secret, payload), "hex");
  const received = Buffer.from(signature, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function assertIdempotencyKey(value: string) {
  if (!/^[A-Za-z0-9:_-]{8,160}$/.test(value)) {
    throw new AppError("VALIDATION_FAILED", "Chave de idempotência inválida.", { status: 400 });
  }

  return value;
}
