import { describe, expect, it } from "vitest";
import {
  assertDiagnosticModality,
  assertPrivateStorageRefs,
  assertReportWithoutInterpretationAutomation,
} from "@/features/exams/diagnostic-exams";

describe("diagnostic exam workflow", () => {
  it("accepts only supported modalities", () => {
    expect(assertDiagnosticModality("ecg")).toBe("ecg");
    expect(() => assertDiagnosticModality("automatic-ai-xray")).toThrow("Modalidade");
  });

  it("requires private storage references for clinical files", () => {
    expect(() => assertPrivateStorageRefs([{ bucket: "public", path: "x.pdf" }])).toThrow(
      "storage privado",
    );
  });

  it("requires human report before reported status", () => {
    expect(() =>
      assertReportWithoutInterpretationAutomation({ report: "", status: "reported" }),
    ).toThrow("Laudo");
  });
});
