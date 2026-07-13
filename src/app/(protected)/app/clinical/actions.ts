"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import {
  closeMedicalConsultation,
  createMedicalConclusion,
  saveTriageRecord,
} from "@/features/clinical/service";
import { getRequestId } from "@/lib/http/request-id";

export type ClinicalFormState = { error?: string; success?: string };

const triageFormSchema = z.object({
  closeRecord: z.coerce.boolean().default(false),
  encounterId: z.string(),
  formVersionId: z.string(),
  payload: z.string(),
  reason: z.string(),
});

const consultationFormSchema = z.object({
  assessment: z.string().optional(),
  encounterId: z.string(),
  objective: z.string(),
  physicianCredentialId: z.string(),
  plan: z.string().optional(),
  reason: z.string(),
  subjective: z.string(),
});

const conclusionFormSchema = z.object({
  conclusionCode: z.enum(["fit", "fit_with_restrictions", "unfit", "inconclusive"]),
  consultationId: z.string(),
  encounterId: z.string(),
  notes: z.string().optional(),
  physicianCredentialId: z.string(),
  restrictions: z.string().optional(),
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
    return "Confirme o MFA antes de registrar dado clínico.";
  }

  return fallback;
}

export async function saveTriageRecordAction(
  _state: ClinicalFormState,
  formData: FormData,
): Promise<ClinicalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = triageFormSchema.safeParse({
    closeRecord: formData.get("closeRecord") === "on",
    encounterId: formData.get("encounterId"),
    formVersionId: formData.get("formVersionId"),
    payload: formData.get("payload"),
    reason: formData.get("reason"),
  });
  if (!form.success) return { error: "Revise atendimento, formulário, payload e motivo." };

  try {
    await saveTriageRecord(
      {
        closeRecord: form.data.closeRecord,
        encounterId: form.data.encounterId,
        formVersionId: form.data.formVersionId,
        payload: parseJsonObject(form.data.payload),
        reason: form.data.reason,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível salvar a triagem.") };
  }

  revalidatePath("/app/clinical");
  return { success: "Triagem salva com versionamento." };
}

export async function closeMedicalConsultationAction(
  _state: ClinicalFormState,
  formData: FormData,
): Promise<ClinicalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = consultationFormSchema.safeParse({
    assessment: formData.get("assessment"),
    encounterId: formData.get("encounterId"),
    objective: formData.get("objective"),
    physicianCredentialId: formData.get("physicianCredentialId"),
    plan: formData.get("plan"),
    reason: formData.get("reason"),
    subjective: formData.get("subjective"),
  });
  if (!form.success) return { error: "Revise atendimento, médico, campos clínicos e motivo." };

  try {
    await closeMedicalConsultation(
      {
        assessment: form.data.assessment ?? "",
        encounterId: form.data.encounterId,
        objective: parseJsonObject(form.data.objective),
        physicianCredentialId: form.data.physicianCredentialId,
        plan: form.data.plan ?? "",
        reason: form.data.reason,
        subjective: parseJsonObject(form.data.subjective),
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível fechar a consulta.") };
  }

  revalidatePath("/app/clinical");
  return { success: "Consulta fechada com versão clínica." };
}

export async function createMedicalConclusionAction(
  _state: ClinicalFormState,
  formData: FormData,
): Promise<ClinicalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = conclusionFormSchema.safeParse({
    conclusionCode: formData.get("conclusionCode"),
    consultationId: formData.get("consultationId"),
    encounterId: formData.get("encounterId"),
    notes: formData.get("notes"),
    physicianCredentialId: formData.get("physicianCredentialId"),
    restrictions: formData.get("restrictions"),
  });
  if (!form.success) return { error: "Revise atendimento, consulta, médico e conclusão." };

  try {
    await createMedicalConclusion(
      {
        conclusionCode: form.data.conclusionCode,
        consultationId: form.data.consultationId,
        encounterId: form.data.encounterId,
        notes: form.data.notes ?? "",
        physicianCredentialId: form.data.physicianCredentialId,
        restrictions: (form.data.restrictions ?? "")
          .split("\n")
          .map((restriction) => restriction.trim())
          .filter(Boolean),
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Conclusão bloqueada ou não pôde ser preparada.") };
  }

  revalidatePath("/app/clinical");
  return { success: "Conclusão médica preparada para assinatura autenticada." };
}
