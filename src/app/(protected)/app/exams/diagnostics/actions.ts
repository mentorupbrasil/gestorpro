"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { saveDiagnosticExamResult } from "@/features/exams/service";
import { getRequestId } from "@/lib/http/request-id";

export type DiagnosticFormState = { error?: string; success?: string };

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA antes de registrar exame.";
  }
  if (error instanceof AppError && error.message) return error.message;
  return fallback;
}

export async function saveDiagnosticExamAction(
  _state: DiagnosticFormState,
  formData: FormData,
): Promise<DiagnosticFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      correctionReason: z.string().min(3),
      examOrderId: z.string().uuid(),
      modality: z.enum(["ecg", "eeg", "radiology"]),
      professionalConclusion: z.string().optional().default(""),
      report: z.string().optional().default(""),
      status: z.enum(["requested", "prepared", "executed", "reported", "validated", "cancelled"]),
    })
    .safeParse({
      correctionReason: formData.get("correctionReason"),
      examOrderId: formData.get("examOrderId"),
      modality: formData.get("modality"),
      professionalConclusion: formData.get("professionalConclusion") ?? "",
      report: formData.get("report") ?? "",
      status: formData.get("status"),
    });
  if (!form.success) return { error: "Revise modalidade, pedido e status." };

  try {
    await saveDiagnosticExamResult(
      {
        correctionReason: form.data.correctionReason,
        examOrderId: form.data.examOrderId,
        modality: form.data.modality,
        professionalConclusion: form.data.professionalConclusion,
        report: form.data.report,
        status: form.data.status,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível salvar exame diagnóstico.") };
  }

  revalidatePath("/app/exams/diagnostics");
  return { success: "Resultado diagnóstico registrado (laudo humano)." };
}
