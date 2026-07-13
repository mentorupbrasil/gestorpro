import { createHash } from "node:crypto";
import { AppError } from "@/core/errors/app-error";

export type DocumentType = "aso" | "triage_form" | "exam_report" | "generic";

export function buildDocumentHash(snapshot: unknown) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

export function assertPrivateDocumentPath(input: { bucket: string; path: string }) {
  if (input.bucket !== "clinical-private" || !input.path.trim()) {
    throw new AppError("VALIDATION_FAILED", "Documento clínico deve ficar em storage privado.", {
      status: 400,
    });
  }

  if (/diagn[oó]stico|inapto|doen[cç]a/i.test(input.path)) {
    throw new AppError("VALIDATION_FAILED", "Nome físico não pode revelar conteúdo clínico.", {
      status: 400,
    });
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
