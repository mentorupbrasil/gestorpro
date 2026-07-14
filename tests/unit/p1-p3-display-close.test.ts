import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertPublicPayload, buildPublicCallPayload } from "@/features/display/call-panel";

const portalMigration = readFileSync(
  "supabase/migrations/202607140025_stabilization_portal_idor_hardening.sql",
  "utf8",
);
const closeMigration = readFileSync(
  "supabase/migrations/202607140033_p1_p3_display_aso_close.sql",
  "utf8",
);

describe("portal IDOR hardening contract", () => {
  it("requires company membership scoped RPCs and denies cross-company", () => {
    expect(portalMigration).toContain("is_company_portal_member");
    expect(portalMigration).toContain("permission denied");
    expect(portalMigration).toContain("get_company_portal_overview");
    expect(portalMigration).toMatch(/company_id[\s\S]{0,120}tenant_id/);
  });
});

describe("display + ASO close contract", () => {
  it("exposes device token RPCs and close orchestration gates", () => {
    expect(closeMigration).toContain("register_display_panel_session");
    expect(closeMigration).toContain("heartbeat_display_panel_session");
    expect(closeMigration).toContain("get_display_panel_public_state");
    expect(closeMigration).toContain("sign_medical_conclusion");
    expect(closeMigration).toContain("close_occupational_encounter");
    expect(closeMigration).toContain("signed ASO document required");
    expect(closeMigration).toContain("consolidated invoice required before close");
  });

  it("keeps call payload free of clinical identifiers", () => {
    const payload = buildPublicCallPayload({
      queueName: "Recepção",
      roomName: "Sala 1",
      ticketCode: "A-1234",
    });
    expect(() => assertPublicPayload(payload as unknown as Record<string, unknown>)).not.toThrow();
    expect(JSON.stringify(payload).toLowerCase()).not.toContain("cpf");
  });
});
