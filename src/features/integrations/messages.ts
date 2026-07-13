import { createHash } from "node:crypto";
import { AppError } from "@/core/errors/app-error";

export type MessageChannel = "email" | "whatsapp_official" | "sms" | "internal" | "webhook";

const sensitivePatterns = [
  /cpf/i,
  /diagn/i,
  /resultado/i,
  /inapto/i,
  /doen[cç]a/i,
  /prontu[aá]rio/i,
];

export function hashMessageDestination(destination: string) {
  return createHash("sha256").update(destination.trim().toLowerCase()).digest("hex");
}

export function assertOpenMessageHasNoClinicalContent(content: string) {
  if (sensitivePatterns.some((pattern) => pattern.test(content))) {
    throw new AppError(
      "VALIDATION_FAILED",
      "Mensagem aberta não pode conter conteúdo clínico sensível.",
      { status: 400 },
    );
  }

  return content;
}

export function assertOfficialWhatsAppProvider(input: {
  channel: MessageChannel;
  providerAuthorized: boolean;
}) {
  if (input.channel === "whatsapp_official" && !input.providerAuthorized) {
    throw new AppError("VALIDATION_FAILED", "WhatsApp exige provedor oficial autorizado.", {
      status: 400,
    });
  }
}

export function buildMessageIdempotencyKey(input: {
  channel: MessageChannel;
  recipientHash: string;
  templateCode: string;
}) {
  return `${input.channel}:${input.templateCode}:${input.recipientHash.slice(0, 16)}`;
}
