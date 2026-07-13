"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { visualAcuityPayloadSchema } from "@/features/exams/schemas";
import { saveVisualAcuityResult, startVisualAcuityExam } from "@/features/exams/service";
import { getRequestId } from "@/lib/http/request-id";

export type VisualAcuityFormState = { error?: string; success?: string };

const startFormSchema = z.object({
  examOrderId: z.string(),
});

const saveFormSchema = z.object({
  chartType: z.string(),
  completeResult: z.coerce.boolean().default(false),
  correctionReason: z.string(),
  equipmentName: z.string(),
  observations: z.string().optional(),
  payload: z.string(),
  professionalConclusion: z.string(),
  resultId: z.string(),
  testConditions: z.string(),
});

function parseJsonObject(value: string) {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("Payload precisa ser objeto JSON.");
  }

  return parsed as Record<string, unknown>;
}

function parseVisualAcuityPayload(value: string) {
  return visualAcuityPayloadSchema.parse(parseJsonObject(value));
}

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA antes de registrar exame.";
  }

  return fallback;
}

export async function startVisualAcuityExamAction(
  _state: VisualAcuityFormState,
  formData: FormData,
): Promise<VisualAcuityFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = startFormSchema.safeParse({ examOrderId: formData.get("examOrderId") });
  if (!form.success) return { error: "Selecione uma ordem de exame." };

  try {
    await startVisualAcuityExam(
      { examOrderId: form.data.examOrderId, tenantId: selectedTenantId },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível iniciar o exame.") };
  }

  revalidatePath("/app/exams/visual-acuity");
  return { success: "Exame iniciado sem apagar histórico anterior." };
}

export async function saveVisualAcuityResultAction(
  _state: VisualAcuityFormState,
  formData: FormData,
): Promise<VisualAcuityFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = saveFormSchema.safeParse({
    chartType: formData.get("chartType"),
    completeResult: formData.get("completeResult") === "on",
    correctionReason: formData.get("correctionReason"),
    equipmentName: formData.get("equipmentName"),
    observations: formData.get("observations"),
    payload: formData.get("payload"),
    professionalConclusion: formData.get("professionalConclusion"),
    resultId: formData.get("resultId"),
    testConditions: formData.get("testConditions"),
  });
  if (!form.success) return { error: "Revise resultado, equipamento, tabela e conclusão." };

  try {
    await saveVisualAcuityResult(
      {
        chartType: form.data.chartType,
        completeResult: form.data.completeResult,
        correctionReason: form.data.correctionReason,
        equipmentName: form.data.equipmentName,
        observations: form.data.observations ?? "",
        payload: parseVisualAcuityPayload(form.data.payload),
        professionalConclusion: form.data.professionalConclusion,
        resultId: form.data.resultId,
        tenantId: selectedTenantId,
        testConditions: parseJsonObject(form.data.testConditions),
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível salvar o resultado.") };
  }

  revalidatePath("/app/exams/visual-acuity");
  return { success: "Resultado salvo com nova versão." };
}
