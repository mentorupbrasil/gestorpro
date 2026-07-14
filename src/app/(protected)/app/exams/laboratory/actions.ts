"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import {
  recordLaboratorySampleEvent,
  saveLaboratoryResult,
} from "@/features/exams/service";
import { getRequestId } from "@/lib/http/request-id";

export type LaboratoryFormState = { error?: string; success?: string };

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA antes de registrar exame.";
  }
  if (error instanceof AppError && error.message) return error.message;
  return fallback;
}

export async function recordLaboratorySampleAction(
  _state: LaboratoryFormState,
  formData: FormData,
): Promise<LaboratoryFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      eventType: z.enum([
        "collected",
        "received",
        "processing_started",
        "disposed",
        "cancelled",
        "corrected",
      ]),
      sampleId: z.string().uuid(),
    })
    .safeParse({
      eventType: formData.get("eventType"),
      sampleId: formData.get("sampleId"),
    });
  if (!form.success) return { error: "Amostra ou evento inválidos." };

  try {
    await recordLaboratorySampleEvent(
      {
        eventType: form.data.eventType,
        payload: { at: new Date().toISOString() },
        sampleId: form.data.sampleId,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível registrar evento da amostra.") };
  }

  revalidatePath("/app/exams/laboratory");
  return { success: "Evento de cadeia registrado." };
}

export async function saveLaboratoryResultAction(
  _state: LaboratoryFormState,
  formData: FormData,
): Promise<LaboratoryFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      correctionReason: z.string().min(3),
      criticalConfirmed: z.coerce.boolean().default(false),
      criticalFlag: z.coerce.boolean().default(false),
      orderItemId: z.string().uuid(),
      resultValue: z.string().min(1),
      status: z.enum(["resulted", "reviewed", "released", "repeated", "cancelled"]),
    })
    .safeParse({
      correctionReason: formData.get("correctionReason"),
      criticalConfirmed: formData.get("criticalConfirmed") === "on",
      criticalFlag: formData.get("criticalFlag") === "on",
      orderItemId: formData.get("orderItemId"),
      resultValue: formData.get("resultValue"),
      status: formData.get("status"),
    });
  if (!form.success) return { error: "Revise item, valor e status." };

  try {
    await saveLaboratoryResult(
      {
        correctionReason: form.data.correctionReason,
        criticalConfirmed: form.data.criticalConfirmed,
        criticalFlag: form.data.criticalFlag,
        orderItemId: form.data.orderItemId,
        referenceRangeSnapshot: { unit: "unspecified", note: "checkpoint" },
        resultPayload: { value: form.data.resultValue },
        status: form.data.status,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível salvar resultado laboratorial.") };
  }

  revalidatePath("/app/exams/laboratory");
  return { success: "Resultado laboratorial registrado." };
}
