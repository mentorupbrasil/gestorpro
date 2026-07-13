import { describe, expect, it } from "vitest";
import { AppError } from "@/core/errors/app-error";
import {
  calculateRequiredExams,
  type ExamCatalogSnapshot,
  type ExamProtocolSnapshot,
} from "@/features/occupational/exam-engine";

const baseVersion = {
  id: "pcmso-v1",
  status: "approved" as const,
  validFrom: "2026-01-01",
  validUntil: "2027-01-01",
};

const clinicalExam: ExamCatalogSnapshot = {
  code: "CLINICO",
  id: "exam-clinical",
  name: "Exame clínico ocupacional",
};

const audiometryExam: ExamCatalogSnapshot = {
  code: "AUD",
  id: "exam-aud",
  name: "Audiometria",
};

const spirometryExam: ExamCatalogSnapshot = {
  code: "ESP",
  id: "exam-esp",
  name: "Espirometria",
};

function protocol(overrides: Partial<ExamProtocolSnapshot> = {}): ExamProtocolSnapshot {
  return {
    id: "protocol-1",
    items: [
      { exam: clinicalExam, required: true },
      { exam: audiometryExam, required: true, riskCodes: ["NOISE"] },
    ],
    occupationalExamType: "admission",
    pcmsoVersion: baseVersion,
    status: "approved",
    ...overrides,
  };
}

describe("calculateRequiredExams", () => {
  it("calculates exams by occupational exam type and risk", () => {
    const result = calculateRequiredExams({
      asOf: "2026-07-12",
      occupationalExamType: "admission",
      protocols: [protocol()],
      riskCodes: ["NOISE"],
    });

    expect(result.exams.map((exam) => exam.code)).toEqual(["AUD", "CLINICO"]);
    expect(result.exams.find((exam) => exam.code === "AUD")?.reason).toBe("risk");
  });

  it("respects PCMSO effective dates", () => {
    const result = calculateRequiredExams({
      asOf: "2026-07-12",
      occupationalExamType: "admission",
      protocols: [
        protocol({
          id: "expired",
          pcmsoVersion: { ...baseVersion, id: "expired-v", validUntil: "2026-01-31" },
        }),
        protocol(),
      ],
      riskCodes: [],
    });

    expect(result.protocolId).toBe("protocol-1");
    expect(result.exams.map((exam) => exam.code)).toEqual(["CLINICO"]);
  });

  it("raises explicit error when protocol is missing", () => {
    expect(() =>
      calculateRequiredExams({
        asOf: "2026-07-12",
        occupationalExamType: "periodic",
        protocols: [protocol()],
        riskCodes: [],
      }),
    ).toThrow(AppError);
  });

  it("raises conflict instead of choosing silently", () => {
    expect(() =>
      calculateRequiredExams({
        asOf: "2026-07-12",
        occupationalExamType: "admission",
        protocols: [protocol(), protocol({ id: "protocol-2" })],
        riskCodes: [],
      }),
    ).toThrow(/Mais de um protocolo/);
  });

  it("applies manual add and remove overrides with justification", () => {
    const result = calculateRequiredExams({
      asOf: "2026-07-12",
      occupationalExamType: "admission",
      overrides: [
        {
          action: "add",
          exam: spirometryExam,
          justification: "Inclusão manual por avaliação do médico responsável.",
        },
        {
          action: "remove",
          exam: clinicalExam,
          justification: "Remoção manual justificada por protocolo complementar.",
        },
      ],
      protocols: [protocol()],
      riskCodes: [],
    });

    expect(result.exams.map((exam) => exam.code)).toEqual(["ESP"]);
    expect(result.exams[0]?.reason).toBe("manual_override");
  });

  it("rejects manual override without enough justification", () => {
    expect(() =>
      calculateRequiredExams({
        asOf: "2026-07-12",
        occupationalExamType: "admission",
        overrides: [{ action: "add", exam: spirometryExam, justification: "curto" }],
        protocols: [protocol()],
        riskCodes: [],
      }),
    ).toThrow(/justificativa/);
  });
});
