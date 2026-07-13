import { describe, expect, it } from "vitest";
import {
  buildTriageStoredPayload,
  computeBmi,
  formatWaitDuration,
  hasTriageClinicalData,
  normalizeLegacyTriagePayload,
  parseTriageStoredPayload,
  triageStructuredInputSchema,
} from "@/features/clinical/triage-payload";

const sampleInput = triageStructuredInputSchema.parse({
  anthropometry: {
    abdominalCircumference: "",
    heightCm: "170",
    weightKg: "70",
  },
  clinical: {
    alcoholConsumption: "Não informado",
    allergies: "Nenhuma",
    currentComplaint: "Dor leve",
    medications: "",
    observations: "Sem intercorrências",
    painScale: "2",
    pregnancyStatus: "",
    relevantHistory: "",
    smoking: "Não fumante",
  },
  operational: {
    equipmentUsed: "Esfigmomanômetro",
  },
  vitals: {
    capillaryGlucose: "",
    diastolicBp: "80",
    heartRate: "72",
    oxygenSaturation: "98",
    respiratoryRate: "16",
    systolicBp: "120",
    temperature: "36.5",
  },
});

describe("triage payload", () => {
  it("calculates BMI on the backend model", () => {
    expect(computeBmi(70, 170)).toBe(24.2);
    expect(computeBmi(null, 170)).toBeNull();
  });

  it("validates impossible vital signs", () => {
    expect(() =>
      triageStructuredInputSchema.parse({
        ...sampleInput,
        vitals: { ...sampleInput.vitals, systolicBp: "900" },
      }),
    ).toThrow();
  });

  it("rejects diastolic pressure greater than systolic", () => {
    const result = triageStructuredInputSchema.safeParse({
      ...sampleInput,
      vitals: { ...sampleInput.vitals, diastolicBp: 140, systolicBp: 110 },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("Pressão sistólica"))).toBe(
        true,
      );
    }
  });

  it("requires at least one clinical value before saving", () => {
    expect(
      hasTriageClinicalData(
        triageStructuredInputSchema.parse({
          anthropometry: { abdominalCircumference: "", heightCm: "", weightKg: "" },
          clinical: {
            alcoholConsumption: "",
            allergies: "",
            currentComplaint: "",
            medications: "",
            observations: "",
            painScale: "",
            pregnancyStatus: "",
            relevantHistory: "",
            smoking: "",
          },
          operational: { equipmentUsed: "" },
          vitals: {
            capillaryGlucose: "",
            diastolicBp: "",
            heartRate: "",
            oxygenSaturation: "",
            respiratoryRate: "",
            systolicBp: "",
            temperature: "",
          },
        }),
      ),
    ).toBe(false);
  });

  it("builds a versioned structured payload", () => {
    const payload = buildTriageStoredPayload(sampleInput, {
      professionalId: "00000000-0000-4000-8000-000000000001",
      professionalName: "Profissional autorizado",
      startedAt: "2026-07-13T12:00:00.000Z",
    });

    expect(payload.schemaVersion).toBe(2);
    expect(payload.anthropometry.bmi).toBe(24.2);
    expect(payload.anthropometry.bmiClassification).toBeNull();
    expect(payload.operational.responsibleProfessionalName).toBe("Profissional autorizado");
  });

  it("normalizes legacy payloads without losing unknown fields", () => {
    const normalized = normalizeLegacyTriagePayload({
      observações: "Registro antigo",
      peso: "68",
      pressão: "118",
      campoLegado: "preservado",
    });

    expect(normalized.clinical.observations).toBe("Registro antigo");
    expect(normalized.anthropometry.weightKg).toBe(68);
    expect(normalized._legacy?.campoLegado).toBe("preservado");
  });

  it("reads structured payloads and keeps stored BMI when present", () => {
    const parsed = parseTriageStoredPayload(
      buildTriageStoredPayload(sampleInput) as unknown as Record<string, unknown>,
    );

    expect(parsed.vitals.systolicBp).toBe(120);
    expect(parsed.anthropometry.bmi).toBe(24.2);
  });

  it("formats waiting time for queue presentation", () => {
    const now = new Date("2026-07-13T13:30:00.000Z").getTime();
    expect(formatWaitDuration("2026-07-13T13:00:00.000Z", now)).toBe("30 min");
  });
});
