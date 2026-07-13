import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  saveVisualAcuityResultSchema,
  saveAudiometryResultSchema,
  startAudiometryExamSchema,
  startVisualAcuityExamSchema,
  type SaveAudiometryResultInput,
  type SaveVisualAcuityResultInput,
  type StartAudiometryExamInput,
  type StartVisualAcuityExamInput,
} from "./schemas";
import { assertAuditoryRest, validateAudiometryThresholds } from "./audiometry";
import { assertProfessionalConclusion, validateVisualAcuityPayload } from "./visual-acuity";

export async function startVisualAcuityExam(input: StartVisualAcuityExamInput, requestId: string) {
  const parsed = startVisualAcuityExamSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "exams.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("start_visual_acuity_exam", {
    audit_request_id: requestId,
    target_exam_order_id: parsed.examOrderId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível iniciar acuidade visual.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function saveVisualAcuityResult(
  input: SaveVisualAcuityResultInput,
  requestId: string,
) {
  const parsed = saveVisualAcuityResultSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "exams.manage");
  requireAal2(context);
  validateVisualAcuityPayload(parsed.payload);
  assertProfessionalConclusion(parsed.professionalConclusion);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("save_visual_acuity_result", {
    audit_request_id: requestId,
    binocular_value: parsed.payload.binocular,
    chart_type_value: parsed.chartType,
    complete_result: parsed.completeResult,
    correction_reason_value: parsed.correctionReason,
    equipment_name_value: parsed.equipmentName,
    left_eye_value: parsed.payload.leftEye,
    observations_value: parsed.observations,
    professional_conclusion_value: parsed.professionalConclusion,
    right_eye_value: parsed.payload.rightEye,
    target_result_id: parsed.resultId,
    target_tenant_id: context.tenantId,
    test_conditions_value: parsed.testConditions,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar acuidade visual.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function startAudiometryExam(input: StartAudiometryExamInput, requestId: string) {
  const parsed = startAudiometryExamSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "exams.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("start_audiometry_exam", {
    audit_request_id: requestId,
    target_exam_order_id: parsed.examOrderId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível iniciar audiometria.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function saveAudiometryResult(input: SaveAudiometryResultInput, requestId: string) {
  const parsed = saveAudiometryResultSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "exams.manage");
  requireAal2(context);
  validateAudiometryThresholds(parsed.thresholds);
  assertAuditoryRest(parsed.restReported.hours);
  assertProfessionalConclusion(parsed.professionalConclusion);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("save_audiometry_result", {
    audit_request_id: requestId,
    booth_value: parsed.booth,
    calibration_id_value: parsed.calibrationId,
    complaints_value: parsed.complaints,
    comparison_value: parsed.comparison,
    complete_result: parsed.completeResult,
    correction_reason_value: parsed.correctionReason,
    equipment_value: parsed.equipment,
    inconclusive_result: parsed.inconclusiveResult,
    masking_value: parsed.masking,
    normalized_payload_value: parsed.normalizedPayload,
    occupational_data_value: parsed.occupationalData,
    original_import_payload_value: parsed.originalImportPayload,
    otoscopy_value: parsed.otoscopy,
    professional_conclusion_value: parsed.professionalConclusion,
    report_value: parsed.report,
    rest_reported_value: parsed.restReported,
    target_result_id: parsed.resultId,
    target_tenant_id: context.tenantId,
    thresholds_value: parsed.thresholds,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar audiometria.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
