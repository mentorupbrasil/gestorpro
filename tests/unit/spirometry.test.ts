import { describe, expect, it } from "vitest";
import {
  assertAcceptedManeuver,
  assertSpirometryCatalogType,
  computeSpirometryPercentages,
  validateSpirometryQuality,
} from "@/features/exams/spirometry";

describe("spirometry workflow", () => {
  it("computes percentages from configured predicted values", () => {
    expect(computeSpirometryPercentages({ fev1: 3, fvc: 4 }, { fev1: 4, fvc: 5 })).toEqual({
      fev1: 75,
      fev1Fvc: 75,
      fvc: 80,
      pef: undefined,
    });
  });

  it("validates technical quality grade", () => {
    expect(validateSpirometryQuality("A")).toBe("A");
    expect(() => validateSpirometryQuality("clínico")).toThrow("Qualidade técnica");
  });

  it("requires accepted maneuver before completion", () => {
    expect(() => assertAcceptedManeuver({ acceptManeuver: false, completeResult: true })).toThrow(
      "tentativa aceita",
    );
  });

  it("rejects a non-spirometry exam order before calling the workflow", () => {
    expect(() => assertSpirometryCatalogType("laboratory")).toThrow(
      "A ordem informada não é de espirometria",
    );
    expect(() => assertSpirometryCatalogType(undefined)).toThrow(
      "A ordem informada não é de espirometria",
    );
    expect(assertSpirometryCatalogType("spirometry")).toBeUndefined();
  });
});
