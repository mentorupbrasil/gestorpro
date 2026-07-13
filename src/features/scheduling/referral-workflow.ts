import { AppError } from "@/core/errors/app-error";

export type ReferralStatus =
  "draft" | "pending_review" | "ready_to_schedule" | "scheduled" | "cancelled" | "expired";

const transitions: Record<ReferralStatus, readonly ReferralStatus[]> = {
  cancelled: [],
  draft: ["pending_review", "ready_to_schedule", "cancelled", "expired"],
  expired: [],
  pending_review: ["ready_to_schedule", "cancelled", "expired"],
  ready_to_schedule: ["scheduled", "cancelled", "expired"],
  scheduled: ["cancelled"],
};

export function transitionReferralStatus(current: ReferralStatus, next: ReferralStatus) {
  if (!transitions[current].includes(next)) {
    throw new AppError("VALIDATION_FAILED", "Transição de encaminhamento inválida.", {
      details: { current, next },
      status: 409,
    });
  }

  return next;
}

export type ImportLineInput = Readonly<{
  companyTaxId?: string;
  occupationalExamType?: string;
  scheduledHint?: string;
  workerCpf?: string;
  workerName?: string;
}>;

export type ReferralImportPreviewLine = Readonly<{
  errors: readonly string[];
  normalized: Readonly<Record<string, string>>;
  rowNumber: number;
  status: "valid" | "invalid";
}>;

export function previewReferralImport(lines: readonly ImportLineInput[]) {
  return lines.map((line, index): ReferralImportPreviewLine => {
    const errors: string[] = [];
    const normalized = {
      companyTaxId: (line.companyTaxId ?? "").replace(/\D/g, ""),
      occupationalExamType: line.occupationalExamType ?? "",
      scheduledHint: line.scheduledHint ?? "",
      workerCpf: (line.workerCpf ?? "").replace(/\D/g, ""),
      workerName: (line.workerName ?? "").trim(),
    };

    if (!/^[0-9]{14}$/.test(normalized.companyTaxId)) errors.push("CNPJ inválido.");
    if (!/^[0-9]{11}$/.test(normalized.workerCpf)) errors.push("CPF inválido.");
    if (normalized.workerName.length < 2) errors.push("Nome do trabalhador obrigatório.");
    if (
      !["admission", "periodic", "dismissal", "return_to_work", "change_of_risk"].includes(
        normalized.occupationalExamType,
      )
    ) {
      errors.push("Tipo ocupacional inválido.");
    }

    return {
      errors,
      normalized,
      rowNumber: index + 1,
      status: errors.length === 0 ? "valid" : "invalid",
    };
  });
}

export function summarizeImportPreview(lines: readonly ReferralImportPreviewLine[]) {
  return {
    invalidCount: lines.filter((line) => line.status === "invalid").length,
    rowCount: lines.length,
    validCount: lines.filter((line) => line.status === "valid").length,
  };
}
