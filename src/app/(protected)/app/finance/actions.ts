"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import {
  createBillingFromSnapshot,
  createEncounterPriceSnapshot,
  issueInvoice,
  recordInvoicePayment,
} from "@/features/finance/service";
import { getRequestId } from "@/lib/http/request-id";

export type FinanceFormState = { error?: string; success?: string };

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA antes de operar o financeiro.";
  }
  if (error instanceof AppError && error.message) return error.message;
  return fallback;
}

export async function createPriceSnapshotAction(
  _state: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      amountCents: z.coerce.number().int().nonnegative(),
      contractId: z.string().uuid(),
      description: z.string().trim().min(1),
      encounterId: z.string().uuid(),
      priceTableId: z.string().uuid(),
      technicalRepeat: z.coerce.boolean().default(false),
    })
    .safeParse({
      amountCents: formData.get("amountCents"),
      contractId: formData.get("contractId"),
      description: formData.get("description"),
      encounterId: formData.get("encounterId"),
      priceTableId: formData.get("priceTableId"),
      technicalRepeat: formData.get("technicalRepeat") === "on",
    });
  if (!form.success) return { error: "Revise encontro, contrato, tabela e valor." };

  try {
    await createEncounterPriceSnapshot(
      {
        contractId: form.data.contractId,
        encounterId: form.data.encounterId,
        items: [
          {
            amountCents: form.data.amountCents,
            billable: !form.data.technicalRepeat,
            description: form.data.description,
            technicalRepeat: form.data.technicalRepeat,
          },
        ],
        priceTableId: form.data.priceTableId,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao criar snapshot.") };
  }

  revalidatePath("/app/finance");
  return { success: "Snapshot de preço criado (imutável)." };
}

export async function createBillingFromSnapshotAction(
  _state: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({ snapshotId: z.string().uuid() })
    .safeParse({ snapshotId: formData.get("snapshotId") });
  if (!form.success) return { error: "Snapshot inválido." };

  try {
    const count = await createBillingFromSnapshot(
      { snapshotId: form.data.snapshotId, tenantId: selectedTenantId },
      getRequestId(await headers()),
    );
    revalidatePath("/app/finance");
    return { success: `${count} item(ns) de faturamento criado(s).` };
  } catch (error) {
    return { error: publicError(error, "Falha ao gerar faturamento.") };
  }
}

export async function issueInvoiceAction(
  _state: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      billingPayload: z.string().min(1),
      dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .safeParse({
      billingPayload: formData.get("billingPayload"),
      dueOn: formData.get("dueOn"),
    });
  if (!form.success) return { error: "Revise item e vencimento." };

  const [billingItemId, companyId] = form.data.billingPayload.split("|");
  const ids = z
    .object({ billingItemId: z.string().uuid(), companyId: z.string().uuid() })
    .safeParse({ billingItemId, companyId });
  if (!ids.success) return { error: "Item de faturamento inválido." };

  try {
    await issueInvoice(
      {
        billingItemIds: [ids.data.billingItemId],
        companyId: ids.data.companyId,
        dueOn: form.data.dueOn,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao emitir fatura.") };
  }

  revalidatePath("/app/finance");
  return { success: "Fatura emitida." };
}

export async function recordPaymentAction(
  _state: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      amountCents: z.coerce.number().int().positive(),
      invoiceId: z.string().uuid(),
      method: z.string().trim().min(2),
      reference: z.string().optional(),
    })
    .safeParse({
      amountCents: formData.get("amountCents"),
      invoiceId: formData.get("invoiceId"),
      method: formData.get("method"),
      reference: formData.get("reference") ?? "",
    });
  if (!form.success) return { error: "Revise fatura, valor e método." };

  try {
    await recordInvoicePayment(
      {
        amountCents: form.data.amountCents,
        invoiceId: form.data.invoiceId,
        method: form.data.method,
        reference: form.data.reference ?? "",
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao registrar pagamento.") };
  }

  revalidatePath("/app/finance");
  return { success: "Pagamento registrado." };
}
