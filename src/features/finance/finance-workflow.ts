import { createHash } from "node:crypto";
import { AppError } from "@/core/errors/app-error";

export type BillingItem = {
  amountCents: number;
  billable: boolean;
  technicalRepeat?: boolean;
};

export function buildPriceSnapshotHash(snapshot: unknown) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

export function assertCommercialDoesNotChangeClinicalProtocol(input: {
  clinicalProtocolChanged: boolean;
}) {
  if (input.clinicalProtocolChanged) {
    throw new AppError("VALIDATION_FAILED", "Preço comercial não altera protocolo clínico.", {
      status: 409,
    });
  }
}

export function computeInvoiceTotal(items: readonly BillingItem[]) {
  return items.reduce((total, item) => {
    if (!item.billable || item.technicalRepeat) return total;
    return total + item.amountCents;
  }, 0);
}

export function requireAdjustmentJustification(justification: string) {
  if (justification.trim().length < 10) {
    throw new AppError("VALIDATION_FAILED", "Ajuste exige justificativa.", { status: 400 });
  }

  return justification.trim();
}

export function toSafeCompanyPortalStatus(status: string) {
  const allowed: Record<string, string> = {
    checked_in: "Em atendimento",
    completed: "Concluído",
    confirmed: "Agendado",
    scheduled: "Agendado",
    waiting: "Aguardando",
  };

  return allowed[status] ?? "Em processamento";
}
