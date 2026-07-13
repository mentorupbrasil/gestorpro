import { describe, expect, it } from "vitest";
import {
  assertHumanMedicalConclusion,
  computeConclusionBlockers,
  nextClinicalVersion,
  requireReopenJustification,
} from "@/features/clinical/workflow";

describe("clinical workflow", () => {
  it("increments clinical versions without replacing history", () => {
    expect(nextClinicalVersion(1)).toBe(2);
  });

  it("requires a clear justification before reopening closed records", () => {
    expect(() => requireReopenJustification("curto")).toThrow("Reabertura exige justificativa");
    expect(requireReopenJustification("Correção solicitada pelo médico")).toBe(
      "Correção solicitada pelo médico",
    );
  });

  it("blocks medical conclusion when mandatory steps are incomplete", () => {
    expect(
      computeConclusionBlockers({
        closedConsultation: false,
        closedTriage: false,
        flowPaused: true,
        pendingRequiredExams: 2,
        physicianRegistrationComplete: false,
      }).map((blocker) => blocker.code),
    ).toEqual([
      "TRIAGE_OPEN",
      "CONSULTATION_OPEN",
      "PENDING_REQUIRED_EXAMS",
      "FLOW_PAUSED",
      "MISSING_PHYSICIAN_REGISTRATION",
    ]);
  });

  it("keeps conclusion as explicit human input", () => {
    expect(assertHumanMedicalConclusion("fit_with_restrictions")).toBe("fit_with_restrictions");
  });
});
