import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { AppError } from "@/core/errors/app-error";
import { resolveAuthorizationContext } from "@/core/auth/session";
import {
  assignMembershipRoleSchema,
  createClinicUnitSchema,
  revokeMembershipRoleSchema,
  setMembershipStatusSchema,
  type AssignMembershipRoleInput,
  type CreateClinicUnitInput,
  type RevokeMembershipRoleInput,
  type SetMembershipStatusInput,
} from "@/features/platform/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createOperationalLogger } from "@/lib/observability/logger";

const logger = createOperationalLogger();

async function revokeUserSessions(userId: string, requestId: string) {
  try {
    const admin = createAdminSupabaseClient();
    const { error } = await admin.auth.admin.signOut(userId, "global");
    if (error) {
      logger.error({
        errorCode: "INTERNAL_ERROR",
        event: "membership.session_revoke_failed",
        requestId,
        route: "/app/access",
      });
    }
  } catch {
    logger.error({
      errorCode: "INTERNAL_ERROR",
      event: "membership.session_revoke_unavailable",
      requestId,
      route: "/app/access",
    });
  }
}

export async function createClinicUnit(input: CreateClinicUnitInput, requestId: string) {
  const parsed = createClinicUnitSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "units.manage");
  requireAal2(context);

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
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data: membership, error: membershipError } = await supabase
    .from("tenant_memberships")
    .select("user_id")
    .eq("id", parsed.membershipId)
    .eq("tenant_id", context.tenantId)
    .maybeSingle();

  if (membershipError || !membership) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível alterar o vínculo.", {
      cause: membershipError,
      status: 500,
    });
  }

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

  if (parsed.status === "blocked" || parsed.status === "inactive") {
    await revokeUserSessions(membership.user_id, requestId);
  }
}

export async function assignMembershipRole(input: AssignMembershipRoleInput, requestId: string) {
  const parsed = assignMembershipRoleSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "roles.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("assign_membership_role", {
    audit_request_id: requestId,
    target_clinic_unit_id: parsed.clinicUnitId ?? null,
    target_membership_id: parsed.membershipId,
    target_role_id: parsed.roleId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível conceder o papel.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function revokeMembershipRole(input: RevokeMembershipRoleInput, requestId: string) {
  const parsed = revokeMembershipRoleSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "roles.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("revoke_membership_role", {
    audit_request_id: requestId,
    target_membership_role_id: parsed.membershipRoleId,
    target_tenant_id: context.tenantId,
  });

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível remover o papel.", {
      cause: error,
      status: 500,
    });
  }
}
