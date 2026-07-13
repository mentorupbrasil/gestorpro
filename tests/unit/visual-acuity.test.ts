import { describe, expect, it } from "vitest";
import {
  assertProfessionalConclusion,
  buildVisualAcuitySummary,
  validateVisualAcuityPayload,
} from "@/features/exams/visual-acuity";

const validPayload = {
  binocular: { farWithCorrection: "20/20", nearWithCorrection: "20/25" },
  leftEye: { farWithCorrection: "20/30", nearWithCorrection: "20/25" },
  rightEye: { farWithCorrection: "20/20", nearWithCorrection: "20/20" },
};

describe("visual acuity workflow", () => {
  it("accepts complete eye and binocular measurements", () => {
    expect(validateVisualAcuityPayload(validPayload)).toEqual(validPayload);
  });

  it("rejects invalid acuity notation", () => {
    expect(() =>
      validateVisualAcuityPayload({
        ...validPayload,
        leftEye: { farWithCorrection: "texto livre" },
      }),
    ).toThrow("medida de acuidade inválida");
  });

  it("summarizes far acuity without deriving occupational fitness", () => {
    expect(buildVisualAcuitySummary(validPayload)).toEqual({
      binocular: "20/20",
      left: "20/30",
      right: "20/20",
    });
  });

  it("requires professional exam conclusion", () => {
    expect(() => assertProfessionalConclusion("ok")).toThrow("Conclusão profissional");
    expect(assertProfessionalConclusion("Resultado compatível com registro informado")).toBe(
      "Resultado compatível com registro informado",
    );
  });
});
