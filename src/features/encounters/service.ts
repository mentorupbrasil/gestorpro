import "server-only";

import { requireAal2, requireTenantOrUnitPermission } from "@/core/auth/authorization";
import { requirePermissionOnAppointment } from "@/core/auth/unit-scope";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stableCheckInIdempotencyKey } from "./idempotency";
import { checkInSchema, type CheckInInput } from "./schemas";

export { stableCheckInIdempotencyKey } from "./idempotency";

export async function checkInAppointment(input: CheckInInput, requestId: string) {
  const parsed = checkInSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireTenantOrUnitPermission(context, "encounters.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  await requirePermissionOnAppointment(
    supabase,
    context,
    parsed.appointmentId,
    "encounters.manage",
  );

  const idempotencyKey = stableCheckInIdempotencyKey(parsed.appointmentId);

  const { data, error } = await supabase.rpc("check_in_appointment", {
    audit_request_id: requestId,
    idempotency_key_value: idempotencyKey,
    target_appointment_id: parsed.appointmentId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    const message = error?.message ?? "";
    if (/aal2 required/i.test(message)) {
      throw new AppError("MFA_REQUIRED", "Check-in exige autenticação AAL2 (MFA).", {
        cause: error,
        status: 401,
      });
    }
    if (/protocol|PCMSO|employment|ambiguous|missing referral|worker/i.test(message)) {
      throw new AppError("VALIDATION_FAILED", message, {
        cause: error,
        status: 422,
      });
    }
    throw new AppError("INTERNAL_ERROR", "Não foi possível realizar check-in.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
