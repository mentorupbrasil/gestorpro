import { describe, expect, it } from "vitest";
import {
  assertOfficialWhatsAppProvider,
  assertOpenMessageHasNoClinicalContent,
  buildMessageIdempotencyKey,
  hashMessageDestination,
} from "@/features/integrations/messages";

describe("message workflow", () => {
  it("hashes destinations before persistence", () => {
    expect(hashMessageDestination("Pessoa@Email.com")).toHaveLength(64);
  });

  it("blocks sensitive clinical content in open messages", () => {
    expect(() => assertOpenMessageHasNoClinicalContent("Seu resultado está pronto")).toThrow(
      "conteúdo clínico",
    );
  });

  it("requires official WhatsApp provider", () => {
    expect(() =>
      assertOfficialWhatsAppProvider({ channel: "whatsapp_official", providerAuthorized: false }),
    ).toThrow("WhatsApp");
  });

  it("builds stable idempotency key", () => {
    expect(
      buildMessageIdempotencyKey({
        channel: "email",
        recipientHash: "1234567890abcdefzz",
        templateCode: "AGENDAMENTO",
      }),
    ).toBe("email:AGENDAMENTO:1234567890abcdef");
  });
});
