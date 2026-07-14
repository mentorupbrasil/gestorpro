import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { simulateRequiredExams } from "@/features/occupational/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createAppointmentSchema,
  createReferralSchema,
  createScheduleResourceSchema,
  type CreateAppointmentInput,
  type CreateReferralInput,
  type CreateScheduleResourceInput,
} from "./schemas";

export async function createReferral(input: CreateReferralInput, requestId: string) {
  const parsed = createReferralSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "referrals.manage");
  requireAal2(context);

  const asOf = parsed.asOf ?? new Date().toISOString().slice(0, 10);
  let riskCodes = parsed.riskCodes;

  const supabase = await createServerSupabaseClient();
  if (riskCodes.length === 0) {
    const { data: assignments } = await supabase
      .from("risk_assignments")
      .select("occupational_risks(code)")
      .eq("tenant_id", context.tenantId)
      .eq("company_id", parsed.companyId)
      .is("ends_on", null)
      .limit(50);

    riskCodes = (assignments ?? []).flatMap((row) => {
      const risk = Array.isArray(row.occupational_risks)
        ? row.occupational_risks[0]
        : row.occupational_risks;
      return risk?.code ? [risk.code] : [];
    });
  }

  let calculated;
  try {
    calculated = await simulateRequiredExams({
      asOf,
      occupationalExamType: parsed.occupationalExamType,
      riskCodes,
      tenantId: context.tenantId,
      workerId: parsed.workerId,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("INTERNAL_ERROR", "Não foi possível calcular exames do protocolo.", {
      cause: error,
      status: 500,
    });
  }

  const examItems = calculated.exams.map((exam) => ({
    examCatalogId: exam.id,
    source: exam.reason === "manual_override" ? "manual" : "protocol",
  }));

  const { data, error } = await supabase.rpc("create_referral_with_protocol", {
    audit_request_id: requestId,
    exam_items_value: examItems,
    exam_preview_value: calculated.exams,
    occupational_exam_type_value: parsed.occupationalExamType,
    target_company_id: parsed.companyId,
    target_tenant_id: context.tenantId,
    target_worker_id: parsed.workerId,
    valid_until_value: parsed.validUntil || null,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar o encaminhamento.", {
      cause: error,
      status: 500,
    });
  }

  return { examCount: calculated.exams.length, id: data };
}

export async function createScheduleResource(input: CreateScheduleResourceInput) {
  const parsed = createScheduleResourceSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "schedule.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("schedule_resources")
    .upsert(
      {
        clinic_unit_id: parsed.clinicUnitId,
        code: parsed.code,
        name: parsed.name,
        resource_type: parsed.resourceType,
        status: "active",
        tenant_id: context.tenantId,
      },
      { onConflict: "tenant_id,clinic_unit_id,code" },
    )
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar o recurso de agenda.", {
      cause: error,
      status: 500,
    });
  }

  return data.id as string;
}

export async function createAppointment(input: CreateAppointmentInput, requestId: string) {
  const parsed = createAppointmentSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "schedule.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_scheduled_appointment", {
    audit_request_id: requestId,
    ends_at_value: parsed.endsAt,
    preparation_text: parsed.preparationInstructions ?? "",
    starts_at_value: parsed.startsAt,
    target_clinic_unit_id: parsed.clinicUnitId,
    target_referral_id: parsed.referralId,
    target_resource_id: parsed.resourceId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível agendar.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
