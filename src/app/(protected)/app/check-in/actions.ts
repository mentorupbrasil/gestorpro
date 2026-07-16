"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { stableCheckInIdempotencyKey } from "@/features/encounters/idempotency";
import { checkInAppointment } from "@/features/encounters/service";
import { getRequestId } from "@/lib/http/request-id";

export type CheckInFormState = { error?: string; success?: string };

const checkInFormSchema = z.object({
  appointmentId: z.string(),
});

export async function checkInAction(
  _state: CheckInFormState,
  formData: FormData,
): Promise<CheckInFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = checkInFormSchema.safeParse({ appointmentId: formData.get("appointmentId") });
  if (!form.success) return { error: "Selecione um agendamento." };

  const requestId = getRequestId(await headers());
  try {
    await checkInAppointment(
      {
        appointmentId: form.data.appointmentId,
        idempotencyKey: stableCheckInIdempotencyKey(form.data.appointmentId),
        tenantId: selectedTenantId,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof AppError && error.code === "MFA_REQUIRED") {
      return { error: "Confirme o MFA antes do check-in." };
    }
    if (error instanceof AppError && error.code === "VALIDATION_FAILED") {
      return { error: error.message };
    }
    return { error: "Não foi possível realizar check-in sem criar duplicidade." };
  }

  revalidatePath("/app/check-in");
  return {
    success:
      "Check-in realizado: snapshot imutável, etapas específicas, ticket de recepção, auditoria e outbox.",
  };
}
