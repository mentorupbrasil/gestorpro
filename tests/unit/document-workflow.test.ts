import { describe, expect, it } from "vitest";
import {
  assertAsoReadiness,
  assertPrivateDocumentPath,
  buildAsoPdfFromSnapshot,
  buildDocumentHash,
  buildGenericDocumentPdf,
  buildNonPhiDocumentStubPdf,
  buildOpaqueDocumentStoragePath,
  buildPrintConfig,
} from "@/features/documents/document-workflow";
import { permissionForStepType } from "@/features/encounters/step-permissions";

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

  it("keeps stub pdf only for isolated unit tests", () => {
    const pdf = buildNonPhiDocumentStubPdf({
      documentType: "generic",
      versionId: "44444444-4444-4444-8444-444444444444",
    });
    expect(pdf.toString("utf8")).toContain("%PDF-1.4");
    expect(pdf.toString("utf8")).toContain("TEST ONLY");
  });

  it("builds an operational ASO pdf from snapshot fields", () => {
    const pdf = buildAsoPdfFromSnapshot({
      snapshot: {
        company: { legalName: "Empresa Ficticia LTDA", cnpjMasked: "12.***.***/****-99" },
        conclusion: { code: "fit", restrictions: [] },
        encounter: { id: "enc-1", examType: "periodic" },
        exams: [{ code: "EXAME_E2E", name: "Exame E2E", date: "2026-07-16" }],
        physician: { name: "Dra. Ficticia", councilNumber: "12345", councilRegion: "CE" },
        worker: { name: "Trabalhador Ficticio", cpfMasked: "***.***.***-00" },
      },
      versionId: "55555555-5555-4555-8555-555555555555",
    });
    const text = pdf.toString("utf8");
    expect(text).toContain("%PDF-1.4");
    expect(text).toContain("ATESTADO DE SAUDE OCUPACIONAL");
    expect(text).toContain("Empresa Ficticia LTDA");
    expect(text).toContain("Trabalhador Ficticio");
    expect(text).not.toContain("stub");
  });

  it("rejects incomplete ASO snapshots", () => {
    expect(() =>
      buildAsoPdfFromSnapshot({
        snapshot: { company: { legalName: "X" }, worker: { name: "Y" } },
        versionId: "55555555-5555-4555-8555-555555555555",
      }),
    ).toThrow("conclus");
  });

  it("builds generic operational pdf without stub marker", () => {
    const pdf = buildGenericDocumentPdf({
      documentType: "exam_report",
      versionId: "66666666-6666-4666-8666-666666666666",
    });
    expect(pdf.toString("utf8")).toContain("%PDF-1.4");
    expect(pdf.toString("utf8")).not.toContain("TEST ONLY");
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

describe("step permission matrix", () => {
  it("maps clinical steps to specific permissions", () => {
    expect(permissionForStepType("reception")).toBe("encounters.manage");
    expect(permissionForStepType("triage")).toBe("triage.manage");
    expect(permissionForStepType("consultation")).toBe("consultations.manage");
    expect(permissionForStepType("conclusion")).toBe("conclusions.manage");
    expect(permissionForStepType("document")).toBe("documents.manage");
    expect(permissionForStepType("delivery")).toBe("documents.deliver");
    expect(permissionForStepType("billing")).toBe("finance.manage");
    expect(permissionForStepType("audiometry")).toBe("exams.manage");
  });
});
