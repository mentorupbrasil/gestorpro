import { describe, expect, it } from "vitest";
import {
  buildConsultationStoredPayload,
  consultationStructuredInputSchema,
  hasConsultationClinicalData,
  normalizeLegacyConsultationPayload,
  parseConsultationVersionPayload,
} from "@/features/clinical/consultation-payload";

const sampleInput = consultationStructuredInputSchema.parse({
  assessment: "Quadro estável para função administrativa.",
  objective: {
    generalAppearance: "Bom estado geral",
    physicalExam: "Ausculta cardíaca sem alterações.",
    vitalSignsReview: "Conforme triagem",
  },
  plan: "Manter acompanhamento periódico.",
  subjective: {
    chiefComplaint: "Sem queixas atuais",
    historyOfPresentIllness: "Nega sintomas respiratórios",
    occupationalHistory: "Escritório",
    reviewOfSystems: "",
  },
});

describe("consultation payload", () => {
  it("requires at least one clinical field", () => {
    expect(
      hasConsultationClinicalData(
        consultationStructuredInputSchema.parse({
          assessment: "",
          objective: {
            generalAppearance: "",
            physicalExam: "",
            vitalSignsReview: "",
          },
          plan: "",
          subjective: {
            chiefComplaint: "",
            historyOfPresentIllness: "",
            occupationalHistory: "",
            reviewOfSystems: "",
          },
        }),
      ),
    ).toBe(false);
    expect(hasConsultationClinicalData(sampleInput)).toBe(true);
  });

  it("builds versioned stored payload", () => {
    const stored = buildConsultationStoredPayload(sampleInput);
    expect(stored.schemaVersion).toBe(1);
    expect(stored.subjective.chiefComplaint).toBe("Sem queixas atuais");
    expect(stored.plan).toBe("Manter acompanhamento periódico.");
  });

  it("normalizes legacy subjective/objective keys", () => {
    const stored = normalizeLegacyConsultationPayload(
      { queixa: "Cefaleia leve" },
      { exameFisico: "Normal" },
      "Estável",
      "Retorno em 6 meses",
    );
    expect(stored.subjective.chiefComplaint).toBe("Cefaleia leve");
    expect(stored.objective.physicalExam).toBe("Normal");
    expect(stored.assessment).toBe("Estável");
  });

  it("parses stored version payload", () => {
    const stored = buildConsultationStoredPayload(sampleInput);
    const parsed = parseConsultationVersionPayload(
      { ...stored.subjective, schemaVersion: 1 },
      { ...stored.objective, schemaVersion: 1 },
      stored.assessment,
      stored.plan,
    );
    expect(parsed.subjective.chiefComplaint).toBe("Sem queixas atuais");
  });
});
