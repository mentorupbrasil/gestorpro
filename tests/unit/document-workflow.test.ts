import { describe, expect, it } from "vitest";
import {
  assertAsoReadiness,
  assertPrivateDocumentPath,
  buildDocumentHash,
  buildNonPhiDocumentStubPdf,
  buildOpaqueDocumentStoragePath,
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

  it("builds opaque private pdf paths without clinical words", () => {
    const path = buildOpaqueDocumentStoragePath({
      documentId: "11111111-1111-4111-8111-111111111111",
      encounterId: "22222222-2222-4222-8222-222222222222",
      tenantId: "33333333-3333-4333-8333-333333333333",
      version: 1,
    });
    expect(path).toMatch(/\.pdf$/);
    expect(path).not.toMatch(/diagn|inapto|doen/i);
  });

  it("builds a non-PHI stub pdf", () => {
    const pdf = buildNonPhiDocumentStubPdf({
      documentType: "generic",
      versionId: "44444444-4444-4444-8444-444444444444",
    });
    expect(pdf.toString("utf8")).toContain("%PDF-1.4");
    expect(pdf.toString("utf8")).not.toMatch(/inapto|diagn[oó]stico/i);
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
