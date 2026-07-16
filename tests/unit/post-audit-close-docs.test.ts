import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { computeCloseBlockers } from "@/features/encounters/state-machine";

const migration041 = readFileSync(
  "supabase/migrations/202607160041_post_audit_close_docs_rpc.sql",
  "utf8",
);

describe("post-audit close/docs/rpc hardening", () => {
  it("removes encounter auto-complete from transition and adds closure record", () => {
    expect(migration041).toContain("NEVER mark encounter completed here");
    expect(migration041).toContain("create table public.encounter_closures");
    expect(migration041).toContain("get_encounter_close_readiness");
    expect(migration041).toContain("service_role required for document finalize");
    expect(migration041).toContain("storage not verified");
    expect(migration041).toContain("encounter completed without closure record");
    expect(migration041).toContain("set status = 'checked_in'");
    expect(migration041).not.toMatch(
      /transition_encounter_step[\s\S]*set status = 'completed'[\s\S]*end;\s*\$\$;/,
    );
  });

  it("revokes authenticated execute on finalize and keeps sign/close grants", () => {
    expect(migration041).toContain(
      "grant execute on function public.finalize_document_version_render(\n  uuid, uuid, text, text, bigint, text, text, text, text\n) to service_role;",
    );
    expect(migration041).toContain(
      "grant execute on function public.sign_document_version(\n  uuid, uuid, text, text, inet, text, text, text\n) to authenticated;",
    );
    expect(migration041).toContain("alter default privileges in schema public");
  });

  it("still computes local blockers when readiness RPC is unavailable", () => {
    const blockers = computeCloseBlockers({
      flowPaused: false,
      hasConsolidatedInvoice: false,
      hasPriceSnapshot: false,
      openStepCount: 2,
      pendingRequiredExams: 1,
      signedAso: false,
      signedConclusion: false,
    });
    expect(blockers.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "OPEN_STEPS",
        "PENDING_EXAMS",
        "UNSIGNED_CONCLUSION",
        "UNSIGNED_ASO",
        "MISSING_SNAPSHOT",
        "MISSING_INVOICE",
      ]),
    );
  });
});
