import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  saveAudiometryResultSchema,
  saveDiagnosticExamResultSchema,
  saveLaboratoryResultSchema,
  saveSpirometryManeuverSchema,
  saveVisualAcuityResultSchema,
  startAudiometryExamSchema,
  startSpirometryExamSchema,
  startVisualAcuityExamSchema,
  recordLaboratorySampleEventSchema,
  type SaveAudiometryResultInput,
  type SaveDiagnosticExamResultInput,
  type SaveLaboratoryResultInput,
  type SaveSpirometryManeuverInput,
  type SaveVisualAcuityResultInput,
  type StartAudiometryExamInput,
  type StartSpirometryExamInput,
  type StartVisualAcuityExamInput,
  type RecordLaboratorySampleEventInput,
} from "./schemas";
import { assertAuditoryRest, validateAudiometryThresholds } from "./audiometry";
import {
  assertDiagnosticModality,
  assertPrivateStorageRefs,
  assertReportWithoutInterpretationAutomation,
} from "./diagnostic-exams";
import { assertLaboratoryRelease, assertReferenceRangeConfig } from "./laboratory";
import {
  assertAcceptedManeuver,
  assertSpirometryCatalogType,
  computeSpirometryPercentages,
  validateSpirometryQuality,
} from "./spirometry";
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

export async function startSpirometryExam(input: StartSpirometryExamInput, requestId: string) {
  const parsed = startSpirometryExamSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "exams.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data: order, error: orderError } = await supabase
    .from("exam_orders")
    .select("id, exam_catalog(result_type)")
    .eq("tenant_id", context.tenantId)
    .eq("id", parsed.examOrderId)
    .maybeSingle();

  if (orderError || !order) {
    throw new AppError("VALIDATION_FAILED", "A ordem de exame não foi encontrada.", {
      cause: orderError,
      status: 400,
    });
  }
  assertSpirometryCatalogType(order.exam_catalog?.[0]?.result_type);

  const { data, error } = await supabase.rpc("start_spirometry_exam", {
    audit_request_id: requestId,
    target_exam_order_id: parsed.examOrderId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível iniciar espirometria.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function saveSpirometryManeuver(
  input: SaveSpirometryManeuverInput,
  requestId: string,
) {
  const parsed = saveSpirometryManeuverSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "exams.manage");
  requireAal2(context);
  validateSpirometryQuality(parsed.qualityGrade);
  assertAcceptedManeuver({
    acceptManeuver: parsed.acceptManeuver,
    completeResult: parsed.completeResult,
  });
  const percentages = computeSpirometryPercentages(parsed.measuredValues, parsed.predictedValues);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("save_spirometry_maneuver", {
    accept_maneuver: parsed.acceptManeuver,
    attempt_number_value: parsed.attemptNumber,
    audit_request_id: requestId,
    bronchodilator_value: parsed.bronchodilator,
    calibration_id_value: parsed.calibrationId,
    complete_result: parsed.completeResult,
    correction_reason_value: parsed.correctionReason,
    curve_attachment_refs_value: parsed.curveAttachmentRefs,
    inconclusive_reason_value: parsed.inconclusiveReason,
    inconclusive_result: parsed.inconclusiveResult,
    measured_values_value: parsed.measuredValues,
    percentages_value: percentages,
    predicted_value_set_id_value: parsed.predictedValueSetId,
    predicted_values_value: parsed.predictedValues,
    professional_conclusion_value: parsed.professionalConclusion,
    quality_grade_value: parsed.qualityGrade,
    required_inputs_value: parsed.requiredInputs,
    target_result_id: parsed.resultId,
    target_tenant_id: context.tenantId,
    technical_notes_value: parsed.technicalNotes,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar espirometria.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function saveDiagnosticExamResult(
  input: SaveDiagnosticExamResultInput,
  requestId: string,
) {
  const parsed = saveDiagnosticExamResultSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "exams.manage");
  requireAal2(context);
  assertDiagnosticModality(parsed.modality);
  assertPrivateStorageRefs([...parsed.rawFileRefs, ...parsed.imageOrPdfRefs]);
  assertReportWithoutInterpretationAutomation({
    professionalConclusion: parsed.professionalConclusion,
    report: parsed.report,
    status: parsed.status,
  });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("save_diagnostic_exam_result", {
    audit_request_id: requestId,
    correction_reason_value: parsed.correctionReason,
    equipment_value: parsed.equipment,
    execution_value: parsed.execution,
    external_result_validation_value: parsed.externalResultValidation,
    image_or_pdf_refs_value: parsed.imageOrPdfRefs,
    modality_value: parsed.modality,
    preparation_value: parsed.preparation,
    professional_conclusion_value: parsed.professionalConclusion,
    raw_file_refs_value: parsed.rawFileRefs,
    report_value: parsed.report,
    status_value: parsed.status,
    target_exam_order_id: parsed.examOrderId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar exame diagnóstico.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function recordLaboratorySampleEvent(
  input: RecordLaboratorySampleEventInput,
  requestId: string,
) {
  const parsed = recordLaboratorySampleEventSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "exams.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("record_laboratory_sample_event", {
    audit_request_id: requestId,
    event_type_value: parsed.eventType,
    payload_value: parsed.payload,
    target_sample_id: parsed.sampleId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível registrar evento da amostra.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function saveLaboratoryResult(input: SaveLaboratoryResultInput, requestId: string) {
  const parsed = saveLaboratoryResultSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "exams.manage");
  requireAal2(context);
  assertReferenceRangeConfig(parsed.referenceRangeSnapshot);
  assertLaboratoryRelease({
    criticalConfirmed: parsed.criticalConfirmed,
    criticalFlag: parsed.criticalFlag,
    status: parsed.status,
  });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("save_laboratory_result", {
    audit_request_id: requestId,
    correction_reason: parsed.correctionReason,
    critical_flag_value: parsed.criticalFlag,
    reference_range_snapshot_value: parsed.referenceRangeSnapshot,
    result_payload_value: parsed.resultPayload,
    status_value: parsed.status,
    target_order_item_id: parsed.orderItemId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar resultado laboratorial.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
