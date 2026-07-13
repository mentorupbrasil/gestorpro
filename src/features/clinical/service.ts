import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  closeMedicalConsultationSchema,
  createMedicalConclusionSchema,
  saveTriageRecordSchema,
  type CloseMedicalConsultationInput,
  type CreateMedicalConclusionInput,
  type SaveTriageRecordInput,
} from "./schemas";

export async function saveTriageRecord(input: SaveTriageRecordInput, requestId: string) {
  const parsed = saveTriageRecordSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "triage.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("save_triage_record", {
    audit_request_id: requestId,
    change_reason: parsed.reason,
    close_record: parsed.closeRecord,
    payload_value: parsed.payload,
    target_encounter_id: parsed.encounterId,
    target_form_version_id: parsed.formVersionId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar a triagem.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function closeMedicalConsultation(
  input: CloseMedicalConsultationInput,
  requestId: string,
) {
  const parsed = closeMedicalConsultationSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "consultations.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("close_medical_consultation", {
    assessment_value: parsed.assessment,
    audit_request_id: requestId,
    change_reason: parsed.reason,
    objective_value: parsed.objective,
    physician_credential_id_value: parsed.physicianCredentialId,
    plan_value: parsed.plan,
    subjective_value: parsed.subjective,
    target_encounter_id: parsed.encounterId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível fechar a consulta.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createMedicalConclusion(
  input: CreateMedicalConclusionInput,
  requestId: string,
) {
  const parsed = createMedicalConclusionSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "conclusions.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_medical_conclusion", {
    audit_request_id: requestId,
    conclusion_code_value: parsed.conclusionCode,
    consultation_id_value: parsed.consultationId,
    notes_value: parsed.notes,
    physician_credential_id_value: parsed.physicianCredentialId,
    restrictions_value: parsed.restrictions,
    target_encounter_id: parsed.encounterId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível preparar a conclusão médica.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
