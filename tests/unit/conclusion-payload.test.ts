import { describe, expect, it } from "vitest";
import {
  buildConclusionBlockers,
  conclusionInputSchema,
  countPendingRequiredExams,
  parseRestrictionsText,
} from "@/features/clinical/conclusion-payload";

describe("conclusion payload", () => {
  it("requires restrictions for fit_with_restrictions", () => {
    const result = conclusionInputSchema.safeParse({
      conclusionCode: "fit_with_restrictions",
      notes: "",
      restrictionsText: "",
    });
    expect(result.success).toBe(false);
  });

  it("parses restrictions from textarea lines", () => {
    expect(parseRestrictionsText("  Altura máxima 1,80m\n\nRuído > 85dB ")).toEqual([
      "Altura máxima 1,80m",
      "Ruído > 85dB",
    ]);
  });

  it("counts pending required exams", () => {
    expect(
      countPendingRequiredExams([
        { status: "ordered" },
        { status: "collected" },
        { status: "resulted" },
      ]),
    ).toBe(2);
  });

  it("builds blockers from encounter state", () => {
    const blockers = buildConclusionBlockers({
      consultationStatus: "draft",
      flowPaused: false,
      pendingRequiredExams: 0,
      physicianCredential: {
        councilCode: "CRM",
        councilRegion: "SP",
        registrationNumber: "123",
      },
      triageStatus: "closed",
    });
    expect(blockers.some((blocker) => blocker.code === "CONSULTATION_OPEN")).toBe(true);
  });
});
