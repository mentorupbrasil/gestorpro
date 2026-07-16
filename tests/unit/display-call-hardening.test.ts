import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createCallEventSchema } from "@/features/display/schemas";

const migration040 = readFileSync(
  "supabase/migrations/202607160040_p1_display_call_hardening.sql",
  "utf8",
);

describe("display call hardening", () => {
  it("requires redirect destination and version for start", () => {
    expect(() =>
      createCallEventSchema.parse({
        action: "redirect",
        displayPanelId: "11111111-1111-4111-8111-111111111111",
        queueTicketId: "22222222-2222-4222-8222-222222222222",
        tenantId: "33333333-3333-4333-8333-333333333333",
      }),
    ).toThrow();

    expect(() =>
      createCallEventSchema.parse({
        action: "start",
        displayPanelId: "11111111-1111-4111-8111-111111111111",
        queueTicketId: "22222222-2222-4222-8222-222222222222",
        tenantId: "33333333-3333-4333-8333-333333333333",
      }),
    ).toThrow();

    expect(
      createCallEventSchema.parse({
        action: "start",
        displayPanelId: "11111111-1111-4111-8111-111111111111",
        expectedVersion: 1,
        queueTicketId: "22222222-2222-4222-8222-222222222222",
        tenantId: "33333333-3333-4333-8333-333333333333",
      }).expectedVersion,
    ).toBe(1);
  });

  it("hardens ACK and revoke in migration 040", () => {
    expect(migration040).toContain("call delivery not found");
    expect(migration040).toContain("revoke_display_panel");
    expect(migration040).toContain("device_token_hash = null");
    expect(migration040).toContain("redirect destination required");
    expect(migration040).toContain("no_show not allowed after clinical start");
    expect(migration040).toContain("expected version required");
  });
});
