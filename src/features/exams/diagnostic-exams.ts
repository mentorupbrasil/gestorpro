import { AppError } from "@/core/errors/app-error";

export type DiagnosticExamModality = "ecg" | "eeg" | "radiology";
export type DiagnosticExamStatus =
  "requested" | "prepared" | "executed" | "reported" | "validated" | "cancelled";

export function assertDiagnosticModality(modality: string): DiagnosticExamModality {
  if (!["ecg", "eeg", "radiology"].includes(modality)) {
    throw new AppError("VALIDATION_FAILED", "Modalidade diagnóstica inválida.", { status: 400 });
  }

  return modality as DiagnosticExamModality;
}

export function assertPrivateStorageRefs(refs: readonly { bucket?: string; path?: string }[]) {
  for (const ref of refs) {
    if (ref.bucket !== "clinical-private" || !ref.path?.trim()) {
      throw new AppError("VALIDATION_FAILED", "Arquivos clínicos devem usar storage privado.", {
        status: 400,
      });
    }
  }

  return refs;
}

export function assertReportWithoutInterpretationAutomation(input: {
  professionalConclusion?: string;
  report?: string;
  status: DiagnosticExamStatus;
}) {
  if (["reported", "validated"].includes(input.status)) {
    if (!input.report?.trim() || !input.professionalConclusion?.trim()) {
      throw new AppError("VALIDATION_FAILED", "Laudo e conclusão profissional são obrigatórios.", {
        status: 400,
      });
    }
  }
}
