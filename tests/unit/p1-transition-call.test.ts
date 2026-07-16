import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration032 = readFileSync(
  "supabase/migrations/202607140032_p1_transition_and_call_hardening.sql",
  "utf8",
);
const migration037 = readFileSync(
  "supabase/migrations/202607160037_p0_strict_step_permissions.sql",
  "utf8",
);
const migration038 = readFileSync(
  "supabase/migrations/202607160038_p0_bootstrap_admin_only.sql",
  "utf8",
);

describe("P1 transition and call hardening", () => {
  it("defines a single transactional step transition RPC", () => {
    expect(migration032).toContain("create or replace function public.transition_encounter_step");
    expect(migration032).toContain("version conflict");
    expect(migration032).toContain("encounter-step-transition");
    expect(migration032).toContain("ensure_queue_for_step");
  });

  it("hardens create_call_event with privacy and room exclusivity", () => {
    expect(migration032).toContain("patient already being called by another room");
    expect(migration032).toContain("panel and ticket must share clinic unit");
    expect(migration032).toContain("voiceText");
    expect(migration032).toContain("ticketCode");
    expect(migration032).not.toMatch(/payload_public[\s\S]{0,200}cpf/i);
  });

  it("moves display panel writes to RPC", () => {
    expect(migration032).toContain("create or replace function public.upsert_display_panel");
  });
});

describe("P0 strict step permissions", () => {
  it("removes encounters.manage fallback for clinical steps", () => {
    expect(migration037).toContain("Sem fallback encounters.manage");
    expect(migration037).toContain("when target_action = 'reopen' then 'clinical.reopen'");
    expect(migration037).toContain("when step_record.step_type = 'triage' then 'triage.manage'");
    expect(migration037).not.toContain(
      "and not public.has_unit_permission(encounter_record.clinic_unit_id, 'encounters.manage')",
    );
  });

  it("requires justification for waive/cancel/reopen and blocks no_show after start", () => {
    expect(migration037).toContain("justification required");
    expect(migration037).toContain("no_show not allowed after clinical start");
  });
});

describe("P0 bootstrap admin-only", () => {
  it("does not self-grant clinical or finance roles", () => {
    expect(migration038).toContain("'rolesAssigned', '[]'::jsonb");
    expect(migration038).toContain("'self_grant_clinical', false");
    expect(migration038).not.toContain("occupational_physician");
    expect(migration038).not.toContain("nursing");
    expect(migration038).not.toContain("'finance'");
  });

  it("creates clinical templates as draft only", () => {
    expect(migration038).toContain("'draft'");
    expect(migration038).not.toContain("approved_by");
    expect(migration038).not.toContain("approved_at");
  });
});
