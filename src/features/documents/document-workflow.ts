import { createHash, randomUUID } from "node:crypto";
import { AppError } from "@/core/errors/app-error";

export type DocumentType = "aso" | "triage_form" | "exam_report" | "generic";

export const CLINICAL_PRIVATE_BUCKET = "clinical-private";

/** Minimal valid PDF with no PHI — placeholder until real template render exists. */
export function buildNonPhiDocumentStubPdf(meta: {
  documentType: DocumentType;
  versionId: string;
}) {
  const title = `GestorPro stub ${meta.documentType} ${meta.versionId.slice(0, 8)}`;
  const content = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 68 >>stream
BT /F1 12 Tf 72 720 Td (${title.replace(/[()\\]/g, "")}) Tj ET
endstream
endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000386 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
465
%%EOF
`;
  return Buffer.from(content, "utf8");
}

export function buildDocumentHash(snapshot: unknown) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

export function buildOpaqueDocumentStoragePath(input: {
  documentId: string;
  encounterId: string;
  tenantId: string;
  version: number;
}) {
  const path = [
    input.tenantId,
    input.encounterId,
    input.documentId,
    `v${input.version}`,
    `${randomUUID()}.pdf`,
  ].join("/");

  return assertPrivateDocumentPath({ bucket: CLINICAL_PRIVATE_BUCKET, path }).path;
}

export function assertPrivateDocumentPath(input: { bucket: string; path: string }) {
  if (input.bucket !== CLINICAL_PRIVATE_BUCKET || !input.path.trim()) {
    throw new AppError("VALIDATION_FAILED", "Documento clínico deve ficar em storage privado.", {
      status: 400,
    });
  }

  if (/diagn[oó]stico|inapto|doen[cç]a/i.test(input.path)) {
    throw new AppError("VALIDATION_FAILED", "Nome físico não pode revelar conteúdo clínico.", {
      status: 400,
    });
  }

  if (
    !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/v\d+\/[0-9a-f-]{36}\.pdf$/i.test(input.path)
  ) {
    // Soft shape check for server-built paths; RPC remains source of truth.
    if (input.path.includes("..") || input.path.startsWith("/")) {
      throw new AppError("VALIDATION_FAILED", "Caminho de storage inválido.", { status: 400 });
    }
  }

  return input;
}

export function assertAsoReadiness(input: {
  documentType: DocumentType;
  hasMedicalConclusion: boolean;
  pendingRequiredExams: number;
}) {
  if (input.documentType !== "aso") return;

  if (!input.hasMedicalConclusion || input.pendingRequiredExams > 0) {
    throw new AppError("VALIDATION_FAILED", "ASO não pode ser gerado incompleto.", {
      status: 409,
    });
  }
}

export function buildPrintConfig(copies: number) {
  return {
    copies: Math.max(1, Math.min(copies, 5)),
    paper: "A4" as const,
  };
}
