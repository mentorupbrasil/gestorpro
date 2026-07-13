import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  saveVisualAcuityResultSchema,
  startVisualAcuityExamSchema,
  type SaveVisualAcuityResultInput,
  type StartVisualAcuityExamInput,
} from "./schemas";
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
