import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createAppointmentSchema,
  createReferralSchema,
  createScheduleResourceSchema,
  type CreateAppointmentInput,
  type CreateReferralInput,
  type CreateScheduleResourceInput,
} from "./schemas";

export async function createReferral(input: CreateReferralInput) {
  const parsed = createReferralSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "referrals.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("referrals")
    .insert({
      company_id: parsed.companyId,
      occupational_exam_type: parsed.occupationalExamType,
      status: "ready_to_schedule",
      tenant_id: context.tenantId,
      valid_until: parsed.validUntil || null,
      worker_id: parsed.workerId,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar o encaminhamento.", {
      cause: error,
      status: 500,
    });
  }

  return data.id as string;
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
  requirePermission(context, "schedule.manage");

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
