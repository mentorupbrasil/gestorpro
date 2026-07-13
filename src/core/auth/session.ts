import "server-only";

import { z } from "zod";
import { isPermission, type Permission } from "@/core/auth/permissions";
import type { AuthorizationContext } from "@/core/auth/authorization";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const authorizationPayloadSchema = z.object({
  aal: z.enum(["aal1", "aal2"]).default("aal1"),
  authorizationVersion: z.union([z.literal(1), z.literal(2)]).optional(),
  clinicUnitIds: z.array(z.uuid()).default([]),
  permissions: z.array(z.string()).default([]),
  tenantId: z.uuid(),
  unitPermissions: z.record(z.string(), z.array(z.string())).optional().default({}),
  userId: z.uuid(),
});

export async function resolveAuthorizationContext(
  selectedTenantId: string,
): Promise<AuthorizationContext> {
  const tenantId = z.uuid().parse(selectedTenantId);
  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new AppError("AUTHENTICATION_REQUIRED", "Autenticação necessária.", {
      cause: userError,
      status: 401,
    });
  }

  const { data, error } = await supabase.rpc("get_my_authorization_context", {
    target_tenant_id: tenantId,
  });

  if (error) {
    throw new AppError("TENANT_ACCESS_DENIED", "Tenant fora do seu escopo de acesso.", {
      cause: error,
      status: 403,
    });
  }

  const parsedResult = authorizationPayloadSchema.safeParse(data);
  if (!parsedResult.success) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Não foi possível interpretar suas permissões. Aplique as migrations mais recentes no Supabase e tente novamente.",
      { cause: parsedResult.error, status: 500 },
    );
  }

  const parsed = parsedResult.data;
  const validPermissions = parsed.permissions.filter(isPermission) as Permission[];
  const unitPermissions = new Map<string, ReadonlySet<Permission>>(
    Object.entries(parsed.unitPermissions).map(([unitId, permissionCodes]) => [
      unitId,
      new Set(permissionCodes.filter(isPermission) as Permission[]),
    ]),
  );

  return {
    aal: parsed.aal,
    clinicUnitIds: new Set(parsed.clinicUnitIds),
    permissions: new Set(validPermissions),
    tenantId: parsed.tenantId,
    unitPermissions,
    userId: parsed.userId,
  };
}
