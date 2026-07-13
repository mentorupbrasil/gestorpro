import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkInSchema, type CheckInInput } from "./schemas";

export async function checkInAppointment(input: CheckInInput, requestId: string) {
  const parsed = checkInSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "encounters.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("check_in_appointment", {
    audit_request_id: requestId,
    idempotency_key_value: parsed.idempotencyKey,
    target_appointment_id: parsed.appointmentId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível realizar check-in.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
