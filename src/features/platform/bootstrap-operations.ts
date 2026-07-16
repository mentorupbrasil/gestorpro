import "server-only";

import { z } from "zod";
import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { AppError } from "@/core/errors/app-error";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const bootstrapResultSchema = z.object({
  asoCreated: z.boolean(),
  asoVersionId: z.string().uuid().nullable().optional(),
  formCreated: z.boolean(),
  formVersionId: z.string().uuid().nullable().optional(),
  rolesAssigned: z.array(z.string()),
  unitCreated: z.boolean(),
  unitId: z.string().uuid().nullable().optional(),
});

export type BootstrapTenantOperationsResult = z.infer<typeof bootstrapResultSchema>;

export async function bootstrapTenantOperations(
  tenantId: string,
  requestId: string,
): Promise<BootstrapTenantOperationsResult> {
  const context = await resolveAuthorizationContext(tenantId);
  requirePermission(context, "roles.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("bootstrap_tenant_operations", {
    audit_request_id: requestId,
    target_tenant_id: context.tenantId,
  });

  if (error) {
    if (error.message?.includes("aal2 required")) {
      throw new AppError("MFA_REQUIRED", "Confirme o MFA em Segurança antes de inicializar.", {
        status: 403,
      });
    }
    throw new AppError("INTERNAL_ERROR", "Não foi possível inicializar a operação do tenant.", {
      cause: error,
      status: 500,
    });
  }

  return bootstrapResultSchema.parse(data);
}
