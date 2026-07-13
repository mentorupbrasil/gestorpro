import "server-only";

import { AppError } from "@/core/errors/app-error";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { provisionTenantSchema, type ProvisionTenantInput } from "@/features/platform/schemas";

export async function provisionTenantForUser(
  input: ProvisionTenantInput & { userId: string; displayName?: string | null },
) {
  const parsed = provisionTenantSchema.parse(input);
  const admin = createAdminSupabaseClient();

  const { data: tenantId, error } = await admin.rpc("provision_tenant_for_user", {
    target_user_id: input.userId,
    tenant_legal_name: parsed.legalName,
    tenant_trade_name: parsed.tradeName?.trim() ? parsed.tradeName.trim() : null,
  });

  if (error || typeof tenantId !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar a organização.", {
      cause: error,
      status: 500,
    });
  }

  if (input.displayName?.trim()) {
    await admin
      .from("user_profiles")
      .update({ display_name: input.displayName.trim() })
      .eq("id", input.userId);
  }

  return tenantId;
}
