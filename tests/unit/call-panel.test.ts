import { describe, expect, it } from "vitest";
import {
  assertPublicPayload,
  buildPublicCallPayload,
  recoverPanelStatus,
} from "@/features/display/call-panel";

describe("call panel", () => {
  it("builds minimal pt-BR public payload", () => {
    const payload = buildPublicCallPayload({
      queueName: "Recepção",
      roomName: "Sala 1",
      ticketCode: "A012",
    });

    expect(payload.voice.lang).toBe("pt-BR");
    expect(payload.ticketCode).toBe("A012");
    expect(() => assertPublicPayload(payload)).not.toThrow();
  });

  it("rejects forbidden data in TV payload", () => {
    expect(() => assertPublicPayload({ cpf: "123", ticketCode: "A012" })).toThrow(/proibido/);
  });

  it("recovers panel online/offline status from heartbeat", () => {
    const now = new Date("2026-07-12T10:00:40.000Z");

    expect(recoverPanelStatus("2026-07-12T10:00:20.000Z", now)).toBe("online");
    expect(recoverPanelStatus("2026-07-12T10:00:00.000Z", now)).toBe("offline");
  });
});
