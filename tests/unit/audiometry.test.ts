import { describe, expect, it } from "vitest";
import {
  assertAuditoryRest,
  assertCalibrationValid,
  validateAudiometryThresholds,
} from "@/features/exams/audiometry";

describe("audiometry workflow", () => {
  it("validates thresholds for both ears", () => {
    expect(
      validateAudiometryThresholds({
        left: { "500": 10, "1000": 15, "2000": 10 },
        right: { "500": 5, "1000": 10, "2000": 10 },
      }),
    ).toBeTruthy();
  });

  it("blocks incomplete threshold payloads", () => {
    expect(() =>
      validateAudiometryThresholds({
        left: { "500": 10 },
        right: { "500": 5, "1000": 10, "2000": 10 },
      }),
    ).toThrow("três frequências");
  });

  it("requires auditory rest", () => {
    expect(() => assertAuditoryRest(8)).toThrow("Repouso auditivo");
    expect(assertAuditoryRest(14)).toBe(14);
  });

  it("requires valid calibration", () => {
    expect(() =>
      assertCalibrationValid(
        { status: "expired", validUntil: "2026-12-31" },
        new Date("2026-07-12"),
      ),
    ).toThrow("Calibração vigente");
  });
});
