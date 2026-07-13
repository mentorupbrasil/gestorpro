"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import {
  closeMedicalConsultation,
  createMedicalConclusion,
  saveMedicalConsultation,
  saveTriageRecord,
} from "@/features/clinical/service";
import { consultationStructuredInputSchema } from "@/features/clinical/consultation-payload";
import {
  conclusionInputSchema,
  parseRestrictionsText,
} from "@/features/clinical/conclusion-payload";
import { triageStructuredInputSchema } from "@/features/clinical/triage-payload";
import { getRequestId } from "@/lib/http/request-id";

export type ClinicalFormState = {
  error?: string;
  encounterId?: string;
  status?: "draft" | "completed" | "saved";
  success?: string;
};

const triageActionSchema = z.object({
  changeReason: z.string().trim().optional(),
  closeRecord: z.coerce.boolean().default(false),
  encounterId: z.string().uuid(),
  formVersionId: z.string().uuid(),
  intent: z.enum(["draft", "complete"]),
  reason: z.string().trim().optional(),
});

const consultationActionSchema = z.object({
  changeReason: z.string().trim().optional(),
  closeRecord: z.coerce.boolean().default(false),
  encounterId: z.string().uuid(),
  intent: z.enum(["draft", "complete"]),
  physicianCredentialId: z.string().uuid(),
  reason: z.string().trim().optional(),
});

const consultationLegacyFormSchema = z.object({
  assessment: z.string().optional(),
  encounterId: z.string().uuid(),
  objective: z.string(),
  physicianCredentialId: z.string().uuid(),
  plan: z.string().optional(),
  reason: z.string().min(3),
  subjective: z.string(),
});

function parseJsonObject(value: string) {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("Payload precisa ser objeto JSON.");
  }

  return parsed as Record<string, unknown>;
}

const conclusionFormSchema = z.object({
  conclusionCode: z.enum(["fit", "fit_with_restrictions", "unfit", "inconclusive"]),
  consultationId: z.string().uuid(),
  encounterId: z.string().uuid(),
  notes: z.string().optional(),
  physicianCredentialId: z.string().uuid(),
  restrictions: z.string().optional(),
});

function parseConsultationFormData(formData: FormData) {
  const read = (name: string) => {
    const value = formData.get(name);
    return value === null ? "" : String(value);
  };

  return consultationStructuredInputSchema.parse({
    assessment: read("assessment"),
    objective: {
      generalAppearance: read("generalAppearance"),
      physicalExam: read("physicalExam"),
      vitalSignsReview: read("vitalSignsReview"),
    },
    plan: read("plan"),
    subjective: {
      chiefComplaint: read("chiefComplaint"),
      historyOfPresentIllness: read("historyOfPresentIllness"),
      occupationalHistory: read("occupationalHistory"),
      reviewOfSystems: read("reviewOfSystems"),
    },
  });
}

function parseTriageFormData(formData: FormData) {
  const read = (name: string) => {
    const value = formData.get(name);
    return value === null ? "" : String(value);
  };

  return triageStructuredInputSchema.parse({
    anthropometry: {
      abdominalCircumference: read("abdominalCircumference"),
      heightCm: read("heightCm"),
      weightKg: read("weightKg"),
    },
    clinical: {
      alcoholConsumption: read("alcoholConsumption"),
      allergies: read("allergies"),
      currentComplaint: read("currentComplaint"),
      medications: read("medications"),
      observations: read("observations"),
      painScale: read("painScale"),
      pregnancyStatus: read("pregnancyStatus"),
      relevantHistory: read("relevantHistory"),
      smoking: read("smoking"),
    },
    operational: {
      equipmentUsed: read("equipmentUsed"),
    },
    vitals: {
      capillaryGlucose: read("capillaryGlucose"),
      diastolicBp: read("diastolicBp"),
      heartRate: read("heartRate"),
      oxygenSaturation: read("oxygenSaturation"),
      respiratoryRate: read("respiratoryRate"),
      systolicBp: read("systolicBp"),
      temperature: read("temperature"),
    },
  });
}

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError) {
    if (error.code === "MFA_REQUIRED") {
      return "Confirme o MFA antes de registrar dado clínico.";
    }
    if (error.code === "PERMISSION_DENIED") {
      return "Você não possui permissão para esta ação.";
    }
    if (error.code === "VALIDATION_FAILED" && error.message) {
      return error.message;
    }
  }

  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  return fallback;
}

export async function saveTriageRecordAction(
  _state: ClinicalFormState,
  formData: FormData,
): Promise<ClinicalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const action = triageActionSchema.safeParse({
    changeReason: formData.get("changeReason"),
    closeRecord: formData.get("intent") === "complete",
    encounterId: formData.get("encounterId"),
    formVersionId: formData.get("formVersionId"),
    intent: formData.get("intent"),
    reason: formData.get("reason"),
  });

  if (!action.success) {
    return { error: "Revise o atendimento e tente novamente." };
  }

  let input;
  try {
    input = parseTriageFormData(formData);
  } catch (error) {
    return { error: publicError(error, "Revise os campos da triagem.") };
  }

  const reason =
    action.data.intent === "complete"
      ? action.data.reason?.trim() || "Conclusão da triagem"
      : action.data.changeReason?.trim() || action.data.reason?.trim() || "Rascunho de triagem";

  if (action.data.intent === "complete" && reason.length < 3) {
    return { error: "Informe o motivo da conclusão." };
  }

  try {
    await saveTriageRecord(
      {
        closeRecord: action.data.closeRecord,
        encounterId: action.data.encounterId,
        formVersionId: action.data.formVersionId,
        input,
        reason,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return {
      encounterId: action.data.encounterId,
      error: publicError(error, "Não foi possível salvar a triagem."),
    };
  }

  revalidatePath("/app/clinical");
  return {
    encounterId: action.data.encounterId,
    status: action.data.intent === "complete" ? "completed" : "saved",
    success:
      action.data.intent === "complete"
        ? "Triagem concluída e etapa liberada."
        : "Rascunho salvo com versionamento.",
  };
}

export async function saveMedicalConsultationAction(
  _state: ClinicalFormState,
  formData: FormData,
): Promise<ClinicalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const action = consultationActionSchema.safeParse({
    changeReason: formData.get("changeReason"),
    closeRecord: formData.get("intent") === "complete",
    encounterId: formData.get("encounterId"),
    intent: formData.get("intent"),
    physicianCredentialId: formData.get("physicianCredentialId"),
    reason: formData.get("reason"),
  });

  if (!action.success) {
    return { error: "Revise o atendimento e tente novamente." };
  }

  let input;
  try {
    input = parseConsultationFormData(formData);
  } catch (error) {
    return { error: publicError(error, "Revise os campos da consulta.") };
  }

  const reason =
    action.data.intent === "complete"
      ? action.data.reason?.trim() || "Conclusão da consulta"
      : action.data.changeReason?.trim() || action.data.reason?.trim() || "Rascunho de consulta";

  if (action.data.intent === "complete" && reason.length < 3) {
    return { error: "Informe o motivo da conclusão." };
  }

  try {
    await saveMedicalConsultation(
      {
        closeRecord: action.data.closeRecord,
        encounterId: action.data.encounterId,
        input,
        physicianCredentialId: action.data.physicianCredentialId,
        reason,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return {
      encounterId: action.data.encounterId,
      error: publicError(error, "Não foi possível salvar a consulta."),
    };
  }

  revalidatePath("/app/clinical");
  return {
    encounterId: action.data.encounterId,
    status: action.data.intent === "complete" ? "completed" : "saved",
    success:
      action.data.intent === "complete"
        ? "Consulta concluída e próxima etapa liberada."
        : "Rascunho salvo com versionamento.",
  };
}

/** @deprecated legacy JSON form */
export async function closeMedicalConsultationAction(
  _state: ClinicalFormState,
  formData: FormData,
): Promise<ClinicalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = consultationLegacyFormSchema.safeParse({
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

  const structured = conclusionInputSchema.safeParse({
    conclusionCode: form.data.conclusionCode,
    notes: form.data.notes ?? "",
    restrictionsText: form.data.restrictions ?? "",
  });
  if (!structured.success) {
    return { error: structured.error.issues[0]?.message ?? "Revise os campos da conclusão." };
  }

  try {
    await createMedicalConclusion(
      {
        conclusionCode: structured.data.conclusionCode,
        consultationId: form.data.consultationId,
        encounterId: form.data.encounterId,
        notes: structured.data.notes,
        physicianCredentialId: form.data.physicianCredentialId,
        restrictions: parseRestrictionsText(structured.data.restrictionsText),
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return {
      encounterId: form.data.encounterId,
      error: publicError(error, "Conclusão bloqueada ou não pôde ser preparada."),
    };
  }

  revalidatePath("/app/clinical");
  return {
    encounterId: form.data.encounterId,
    success: "Conclusão médica preparada para assinatura autenticada.",
  };
}
