"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { closeOccupationalEncounter, signMedicalConclusion } from "@/features/clinical/closure";
import { completeEncounterStepByType } from "@/features/encounters/complete-step";
import { createGeneratedDocumentVersion, signDocumentVersion } from "@/features/documents/service";
import {
  createBillingFromSnapshot,
  createEncounterPriceSnapshot,
  issueInvoice,
} from "@/features/finance/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRequestId } from "@/lib/http/request-id";

export type ClosureFormState = { error?: string; success?: string };

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA antes de continuar.";
  }
  if (error instanceof AppError && error.code === "VALIDATION_FAILED") {
    return error.message;
  }
  if (error instanceof AppError && error.message) return error.message;
  return fallback;
}

export async function signConclusionAction(
  _state: ClosureFormState,
  formData: FormData,
): Promise<ClosureFormState> {
  const tenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!tenantId) return { error: "Selecione uma organização." };
  const form = z
    .object({
      conclusionId: z.string().uuid(),
      expectedVersion: z.coerce.number().int().positive(),
    })
    .safeParse({
      conclusionId: formData.get("conclusionId"),
      expectedVersion: formData.get("expectedVersion"),
    });
  if (!form.success) return { error: "Conclusão inválida." };

  try {
    await signMedicalConclusion({ ...form.data, tenantId }, getRequestId(await headers()));
  } catch (error) {
    return { error: publicError(error, "Não foi possível assinar a conclusão.") };
  }

  revalidatePath("/app/clinical/conclusion");
  return { success: "Conclusão assinada com AAL2." };
}

export async function prepareAndSignAsoAction(
  _state: ClosureFormState,
  formData: FormData,
): Promise<ClosureFormState> {
  const tenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!tenantId) return { error: "Selecione uma organização." };
  const form = z
    .object({
      encounterId: z.string().uuid(),
      templateVersionId: z.string().uuid(),
    })
    .safeParse({
      encounterId: formData.get("encounterId"),
      templateVersionId: formData.get("templateVersionId"),
    });
  if (!form.success) return { error: "ASO inválido: falta atendimento ou template." };

  const requestId = getRequestId(await headers());
  try {
    const created = await createGeneratedDocumentVersion(
      {
        documentType: "aso",
        encounterId: form.data.encounterId,
        hasMedicalConclusion: true,
        idempotencyKey: `aso:${form.data.encounterId}:${form.data.templateVersionId}`,
        pendingRequiredExams: 0,
        snapshot: {
          encounterId: form.data.encounterId,
          issuedAt: new Date().toISOString(),
          type: "aso",
        },
        templateVersionId: form.data.templateVersionId,
        tenantId,
      },
      requestId,
    );

    await signDocumentVersion(
      {
        contentHash: created.contentHash,
        documentVersionId: created.versionId,
        method: "totp",
        tenantId,
      },
      requestId,
    );

    await completeEncounterStepByType({
      encounterId: form.data.encounterId,
      requestId,
      stepType: "document",
      tenantId,
    });
  } catch (error) {
    return { error: publicError(error, "Não foi possível emitir/assinar o ASO.") };
  }

  revalidatePath("/app/clinical/conclusion");
  revalidatePath("/app/documents");
  return { success: "ASO gerado e assinado (stub não-PHI)." };
}

export async function prepareBillingAction(
  _state: ClosureFormState,
  formData: FormData,
): Promise<ClosureFormState> {
  const tenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!tenantId) return { error: "Selecione uma organização." };
  const form = z
    .object({
      companyId: z.string().uuid(),
      contractId: z.string().uuid(),
      encounterId: z.string().uuid(),
      priceTableId: z.string().uuid(),
    })
    .safeParse({
      companyId: formData.get("companyId"),
      contractId: formData.get("contractId"),
      encounterId: formData.get("encounterId"),
      priceTableId: formData.get("priceTableId"),
    });
  if (!form.success) {
    return { error: "Faturamento incompleto: contrato/tabela/empresa ausentes no seed." };
  }

  const requestId = getRequestId(await headers());
  try {
    const snapshotId = await createEncounterPriceSnapshot(
      {
        clinicalProtocolChanged: false,
        contractId: form.data.contractId,
        encounterId: form.data.encounterId,
        items: [{ billableCode: "E2E_EXAM", technicalRepeat: false }],
        priceTableId: form.data.priceTableId,
        tenantId,
      },
      requestId,
    );

    await createBillingFromSnapshot({ snapshotId, tenantId }, requestId);

    const supabase = await createServerSupabaseClient();
    const { data: items } = await supabase
      .from("billing_items")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("encounter_id", form.data.encounterId)
      .eq("status", "open");

    const billingItemIds = (items ?? []).map((item) => item.id).filter(Boolean) as string[];
    if (billingItemIds.length === 0) {
      return { error: "Nenhum item de faturamento gerado a partir do snapshot." };
    }

    const due = new Date();
    due.setDate(due.getDate() + 30);
    await issueInvoice(
      {
        billingItemIds,
        companyId: form.data.companyId,
        dueOn: due.toISOString().slice(0, 10),
        tenantId,
      },
      requestId,
    );

    await completeEncounterStepByType({
      encounterId: form.data.encounterId,
      requestId,
      stepType: "billing",
      tenantId,
    });
  } catch (error) {
    return { error: publicError(error, "Não foi possível preparar o faturamento.") };
  }

  revalidatePath("/app/clinical/conclusion");
  revalidatePath("/app/finance");
  return { success: "Snapshot, itens e fatura consolidados." };
}

export async function closeEncounterAction(
  _state: ClosureFormState,
  formData: FormData,
): Promise<ClosureFormState> {
  const tenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!tenantId) return { error: "Selecione uma organização." };
  const form = z
    .object({
      encounterId: z.string().uuid(),
      expectedVersion: z.coerce.number().int().positive(),
    })
    .safeParse({
      encounterId: formData.get("encounterId"),
      expectedVersion: formData.get("expectedVersion"),
    });
  if (!form.success) return { error: "Atendimento inválido." };

  try {
    await closeOccupationalEncounter(
      {
        ...form.data,
        idempotencyKey: `close:encounter:${form.data.encounterId}`,
        tenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível encerrar o atendimento.") };
  }

  revalidatePath("/app/clinical/conclusion");
  revalidatePath("/app/check-in");
  return { success: "Atendimento encerrado com auditoria e outbox." };
}
