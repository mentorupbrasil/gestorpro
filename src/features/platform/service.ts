import "server-only";

import { requirePermission } from "@/core/auth/authorization";
import { AppError } from "@/core/errors/app-error";
import { resolveAuthorizationContext } from "@/core/auth/session";
import {
  createClinicUnitSchema,
  setMembershipStatusSchema,
  type CreateClinicUnitInput,
  type SetMembershipStatusInput,
} from "@/features/platform/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createClinicUnit(input: CreateClinicUnitInput, requestId: string) {
  const parsed = createClinicUnitSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "units.manage");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_clinic_unit", {
    audit_request_id: requestId,
    target_tenant_id: context.tenantId,
    unit_code: parsed.code,
    unit_name: parsed.name,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar a unidade.", {
      cause: error,
      status: 500,
    });
  }
  return data;
}

export async function setMembershipStatus(input: SetMembershipStatusInput, requestId: string) {
  const parsed = setMembershipStatusSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "memberships.manage");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("set_membership_status", {
    audit_request_id: requestId,
    new_status: parsed.status,
    target_membership_id: parsed.membershipId,
    target_tenant_id: context.tenantId,
  });

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível alterar o vínculo.", {
      cause: error,
      status: 500,
    });
  }
}
