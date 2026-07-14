"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { closeOccupationalEncounter, signMedicalConclusion } from "@/features/clinical/closure";
import { getRequestId } from "@/lib/http/request-id";

export type ClosureFormState = { error?: string; success?: string };

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
    if (error instanceof AppError && error.code === "MFA_REQUIRED") {
      return { error: "Confirme o MFA antes de assinar." };
    }
    return { error: "Não foi possível assinar a conclusão." };
  }

  revalidatePath("/app/clinical/conclusion");
  return { success: "Conclusão assinada com AAL2." };
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
    if (error instanceof AppError && error.code === "VALIDATION_FAILED") {
      return { error: error.message };
    }
    if (error instanceof AppError && error.code === "MFA_REQUIRED") {
      return { error: "Confirme o MFA antes de encerrar." };
    }
    return { error: "Não foi possível encerrar o atendimento." };
  }

  revalidatePath("/app/clinical/conclusion");
  revalidatePath("/app/check-in");
  return { success: "Atendimento encerrado com auditoria e outbox." };
}
