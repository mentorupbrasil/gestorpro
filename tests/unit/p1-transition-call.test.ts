import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/202607140032_p1_transition_and_call_hardening.sql",
  "utf8",
);

describe("P1 transition and call hardening", () => {
  it("defines a single transactional step transition RPC", () => {
    expect(migration).toContain("create or replace function public.transition_encounter_step");
    expect(migration).toContain("version conflict");
    expect(migration).toContain("encounter-step-transition");
    expect(migration).toContain("ensure_queue_for_step");
  });

  it("hardens create_call_event with privacy and room exclusivity", () => {
    expect(migration).toContain("patient already being called by another room");
    expect(migration).toContain("panel and ticket must share clinic unit");
    expect(migration).toContain("voiceText");
    expect(migration).toContain("ticketCode");
    expect(migration).not.toMatch(/payload_public[\s\S]{0,200}cpf/i);
  });

  it("moves display panel writes to RPC", () => {
    expect(migration).toContain("create or replace function public.upsert_display_panel");
  });
});
