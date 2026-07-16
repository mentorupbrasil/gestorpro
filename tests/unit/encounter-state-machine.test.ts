import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  assertEncounterStepTransition,
  computeCloseBlockers,
} from "@/features/encounters/state-machine";

const migration039 = readFileSync(
  "supabase/migrations/202607160039_p0_parallel_exam_dependencies.sql",
  "utf8",
);

describe("encounter state machine", () => {
  it("rejects invalid transitions and no_show after start", () => {
    expect(assertEncounterStepTransition({ action: "start", currentStatus: "available" })).toBe(
      "in_progress",
    );
    expect(() =>
      assertEncounterStepTransition({ action: "complete", currentStatus: "blocked" }),
    ).toThrow("Transição inválida");
    expect(() =>
      assertEncounterStepTransition({ action: "no_show", currentStatus: "in_progress" }),
    ).toThrow("no_show");
  });

  it("lists close blockers until prerequisites are met", () => {
    const blockers = computeCloseBlockers({
      flowPaused: false,
      hasConsolidatedInvoice: false,
      hasPriceSnapshot: true,
      openStepCount: 1,
      pendingRequiredExams: 0,
      signedAso: false,
      signedConclusion: true,
    });
    expect(blockers.map((item) => item.code)).toEqual(
      expect.arrayContaining(["OPEN_STEPS", "UNSIGNED_ASO", "MISSING_INVOICE"]),
    );
  });
});

describe("parallel exam dependencies migration", () => {
  it("creates M2M dependencies and parallel exam graph", () => {
    expect(migration039).toContain("create table public.encounter_step_dependencies");
    expect(migration039).toContain("'exams_parallel'");
    expect(migration039).toContain("'pre_consult'");
    expect(migration039).toContain("triage_step_id");
    expect(migration039).toContain("dep.depends_on_step_id = step_record.id");
  });
});
