"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import {
  createAppointment,
  createReferral,
  createScheduleResource,
} from "@/features/scheduling/service";
import { getRequestId } from "@/lib/http/request-id";

export type SchedulingFormState = { error?: string; success?: string };

const referralFormSchema = z.object({
  companyId: z.string(),
  occupationalExamType: z.enum([
    "admission",
    "periodic",
    "dismissal",
    "return_to_work",
    "change_of_risk",
  ]),
  validUntil: z.string().optional(),
  workerId: z.string(),
});

const resourceFormSchema = z.object({
  clinicUnitId: z.string(),
  code: z.string(),
  name: z.string(),
  resourceType: z.enum(["room", "professional", "equipment", "procedure"]),
});

const appointmentFormSchema = z.object({
  clinicUnitId: z.string(),
  endsAt: z.string(),
  preparationInstructions: z.string().optional(),
  referralId: z.string().nullable(),
  resourceId: z.string(),
  startsAt: z.string(),
});

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA em Segurança da conta antes de alterar agenda/encaminhamentos.";
  }

  return fallback;
}

export async function createReferralAction(
  _state: SchedulingFormState,
  formData: FormData,
): Promise<SchedulingFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };
  const form = referralFormSchema.safeParse({
    companyId: formData.get("companyId"),
    occupationalExamType: formData.get("occupationalExamType"),
    validUntil: formData.get("validUntil"),
    workerId: formData.get("workerId"),
  });
  if (!form.success) return { error: "Revise empresa, trabalhador e tipo ocupacional." };

  try {
    await createReferral({ ...form.data, tenantId: selectedTenantId });
  } catch (error) {
    return { error: publicError(error, "Não foi possível criar o encaminhamento.") };
  }

  revalidatePath("/app/scheduling");
  return { success: "Encaminhamento pronto para agenda." };
}

export async function createScheduleResourceAction(
  _state: SchedulingFormState,
  formData: FormData,
): Promise<SchedulingFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };
  const form = resourceFormSchema.safeParse({
    clinicUnitId: formData.get("clinicUnitId"),
    code: formData.get("code"),
    name: formData.get("name"),
    resourceType: formData.get("resourceType"),
  });
  if (!form.success) return { error: "Revise unidade, tipo e código do recurso." };

  try {
    await createScheduleResource({ ...form.data, tenantId: selectedTenantId });
  } catch (error) {
    return { error: publicError(error, "Não foi possível criar o recurso.") };
  }

  revalidatePath("/app/scheduling");
  return { success: "Recurso de agenda criado." };
}

export async function createAppointmentAction(
  _state: SchedulingFormState,
  formData: FormData,
): Promise<SchedulingFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };
  const form = appointmentFormSchema.safeParse({
    clinicUnitId: formData.get("clinicUnitId"),
    endsAt: formData.get("endsAt"),
    preparationInstructions: formData.get("preparationInstructions"),
    referralId: formData.get("referralId") || null,
    resourceId: formData.get("resourceId"),
    startsAt: formData.get("startsAt"),
  });
  if (!form.success) return { error: "Revise recurso, início e fim do agendamento." };

  const requestId = getRequestId(await headers());
  try {
    await createAppointment(
      {
        ...form.data,
        endsAt: new Date(form.data.endsAt).toISOString(),
        startsAt: new Date(form.data.startsAt).toISOString(),
        tenantId: selectedTenantId,
      },
      requestId,
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível agendar; verifique conflitos.") };
  }

  revalidatePath("/app/scheduling");
  return { success: "Agendamento criado sem gerar atendimento clínico." };
}
