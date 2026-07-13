"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { audiometryThresholdsSchema } from "@/features/exams/schemas";
import { saveAudiometryResult, startAudiometryExam } from "@/features/exams/service";
import { getRequestId } from "@/lib/http/request-id";

export type AudiometryFormState = { error?: string; success?: string };

const startFormSchema = z.object({ examOrderId: z.string() });

const saveFormSchema = z.object({
  booth: z.string(),
  calibrationId: z.string(),
  completeResult: z.coerce.boolean().default(false),
  correctionReason: z.string(),
  equipment: z.string(),
  inconclusiveResult: z.coerce.boolean().default(false),
  occupationalData: z.string(),
  professionalConclusion: z.string(),
  report: z.string().optional(),
  restHours: z.coerce.number(),
  resultId: z.string(),
  thresholds: z.string(),
});

function parseJsonObject(value: string) {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("Payload precisa ser objeto JSON.");
  }

  return parsed as Record<string, unknown>;
}

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA antes de registrar exame.";
  }

  return fallback;
}

export async function startAudiometryExamAction(
  _state: AudiometryFormState,
  formData: FormData,
): Promise<AudiometryFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = startFormSchema.safeParse({ examOrderId: formData.get("examOrderId") });
  if (!form.success) return { error: "Selecione uma ordem de exame." };

  try {
    await startAudiometryExam(
      { examOrderId: form.data.examOrderId, tenantId: selectedTenantId },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível iniciar audiometria.") };
  }

  revalidatePath("/app/exams/audiometry");
  return { success: "Audiometria iniciada sem apagar histórico anterior." };
}

export async function saveAudiometryResultAction(
  _state: AudiometryFormState,
  formData: FormData,
): Promise<AudiometryFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = saveFormSchema.safeParse({
    booth: formData.get("booth"),
    calibrationId: formData.get("calibrationId"),
    completeResult: formData.get("completeResult") === "on",
    correctionReason: formData.get("correctionReason"),
    equipment: formData.get("equipment"),
    inconclusiveResult: formData.get("inconclusiveResult") === "on",
    occupationalData: formData.get("occupationalData"),
    professionalConclusion: formData.get("professionalConclusion"),
    report: formData.get("report"),
    restHours: formData.get("restHours"),
    resultId: formData.get("resultId"),
    thresholds: formData.get("thresholds"),
  });
  if (!form.success) return { error: "Revise dados ocupacionais, limiares e conclusão." };

  try {
    await saveAudiometryResult(
      {
        booth: parseJsonObject(form.data.booth),
        calibrationId: form.data.calibrationId,
        comparison: {},
        complaints: [],
        completeResult: form.data.completeResult,
        correctionReason: form.data.correctionReason,
        equipment: parseJsonObject(form.data.equipment),
        inconclusiveResult: form.data.inconclusiveResult,
        masking: {},
        normalizedPayload: {},
        occupationalData: parseJsonObject(form.data.occupationalData),
        originalImportPayload: null,
        otoscopy: {},
        professionalConclusion: form.data.professionalConclusion,
        report: form.data.report ?? "",
        restReported: { hours: form.data.restHours, informedAt: new Date().toISOString() },
        resultId: form.data.resultId,
        tenantId: selectedTenantId,
        thresholds: audiometryThresholdsSchema.parse(parseJsonObject(form.data.thresholds)),
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível salvar audiometria.") };
  }

  revalidatePath("/app/exams/audiometry");
  return { success: "Audiometria salva com nova versão." };
}
