"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { spirometryMeasuredValuesSchema } from "@/features/exams/schemas";
import { saveSpirometryManeuver, startSpirometryExam } from "@/features/exams/service";
import { getRequestId } from "@/lib/http/request-id";

export type SpirometryFormState = { error?: string; success?: string };

const startFormSchema = z.object({ examOrderId: z.string().uuid() });

const saveFormSchema = z.object({
  acceptManeuver: z.boolean(),
  attemptNumber: z.coerce.number().int().positive(),
  calibrationId: z.string().uuid(),
  completeResult: z.boolean(),
  correctionReason: z.string().min(3).max(500),
  inconclusiveReason: z.string().max(1000),
  inconclusiveResult: z.boolean(),
  measuredValues: z.string(),
  predictedValueSetId: z.string().uuid(),
  predictedValues: z.string(),
  professionalConclusion: z.string().max(5000),
  qualityGrade: z.enum(["A", "B", "C", "D", "E", "F", "unacceptable"]),
  requiredInputs: z.string(),
  resultId: z.string().uuid(),
  technicalNotes: z.string().max(5000),
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
    return "Confirme o MFA antes de registrar espirometria.";
  }

  return fallback;
}

export async function startSpirometryExamAction(
  _state: SpirometryFormState,
  formData: FormData,
): Promise<SpirometryFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = startFormSchema.safeParse({ examOrderId: formData.get("examOrderId") });
  if (!form.success) return { error: "Selecione uma ordem de espirometria válida." };

  try {
    await startSpirometryExam(
      { examOrderId: form.data.examOrderId, tenantId: selectedTenantId },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível iniciar espirometria.") };
  }

  revalidatePath("/app/exams/spirometry");
  return { success: "Espirometria iniciada sem apagar histórico anterior." };
}

export async function saveSpirometryManeuverAction(
  _state: SpirometryFormState,
  formData: FormData,
): Promise<SpirometryFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = saveFormSchema.safeParse({
    acceptManeuver: formData.get("acceptManeuver") === "on",
    attemptNumber: formData.get("attemptNumber"),
    calibrationId: formData.get("calibrationId"),
    completeResult: formData.get("completeResult") === "on",
    correctionReason: formData.get("correctionReason"),
    inconclusiveReason: formData.get("inconclusiveReason"),
    inconclusiveResult: formData.get("inconclusiveResult") === "on",
    measuredValues: formData.get("measuredValues"),
    predictedValueSetId: formData.get("predictedValueSetId"),
    predictedValues: formData.get("predictedValues"),
    professionalConclusion: formData.get("professionalConclusion"),
    qualityGrade: formData.get("qualityGrade"),
    requiredInputs: formData.get("requiredInputs"),
    resultId: formData.get("resultId"),
    technicalNotes: formData.get("technicalNotes"),
  });
  if (!form.success) return { error: "Revise os campos técnicos e a justificativa da versão." };

  try {
    await saveSpirometryManeuver(
      {
        acceptManeuver: form.data.acceptManeuver,
        attemptNumber: form.data.attemptNumber,
        bronchodilator: {},
        calibrationId: form.data.calibrationId,
        completeResult: form.data.completeResult,
        correctionReason: form.data.correctionReason,
        curveAttachmentRefs: [],
        inconclusiveReason: form.data.inconclusiveReason,
        inconclusiveResult: form.data.inconclusiveResult,
        measuredValues: spirometryMeasuredValuesSchema.parse(
          parseJsonObject(form.data.measuredValues),
        ),
        predictedValueSetId: form.data.predictedValueSetId,
        predictedValues: spirometryMeasuredValuesSchema.parse(
          parseJsonObject(form.data.predictedValues),
        ),
        professionalConclusion: form.data.professionalConclusion,
        qualityGrade: form.data.qualityGrade,
        requiredInputs: parseJsonObject(form.data.requiredInputs),
        resultId: form.data.resultId,
        technicalNotes: form.data.technicalNotes,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível salvar a manobra de espirometria.") };
  }

  revalidatePath("/app/exams/spirometry");
  return { success: "Manobra salva em nova versão auditável." };
}
