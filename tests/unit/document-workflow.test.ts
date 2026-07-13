import { describe, expect, it } from "vitest";
import {
  assertAsoReadiness,
  assertPrivateDocumentPath,
  buildDocumentHash,
  buildPrintConfig,
} from "@/features/documents/document-workflow";

describe("document workflow", () => {
  it("hashes document snapshots deterministically", () => {
    expect(buildDocumentHash({ id: "1", value: "ASO" })).toHaveLength(64);
  });

  it("blocks public or revealing document paths", () => {
    expect(() => assertPrivateDocumentPath({ bucket: "public", path: "aso.pdf" })).toThrow(
      "storage privado",
    );
    expect(() =>
      assertPrivateDocumentPath({ bucket: "clinical-private", path: "diagnostico-x.pdf" }),
    ).toThrow("Nome físico");
  });

  it("does not generate incomplete ASO", () => {
    expect(() =>
      assertAsoReadiness({
        documentType: "aso",
        hasMedicalConclusion: false,
        pendingRequiredExams: 0,
      }),
    ).toThrow("ASO");
  });

  it("caps browser print copies", () => {
    expect(buildPrintConfig(99)).toEqual({ copies: 5, paper: "A4" });
  });
});
