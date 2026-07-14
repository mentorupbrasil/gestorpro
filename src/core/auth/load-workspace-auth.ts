import "server-only";

import { AppError } from "@/core/errors/app-error";
import type { AuthorizationContext } from "@/core/auth/authorization";
import { requirePermission, requireTenantOrUnitPermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import type { Permission } from "@/core/auth/permissions";

export async function loadWorkspaceAuth(
  tenantId: string,
  permission: Permission,
  scope: "tenant" | "tenantOrUnit" = "tenant",
): Promise<{ context: AuthorizationContext } | { error: string }> {
  try {
    const context = await resolveAuthorizationContext(tenantId);
    if (scope === "tenantOrUnit") {
      requireTenantOrUnitPermission(context, permission);
    } else {
      requirePermission(context, permission);
    }
    return { context };
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }
    return {
      error: error instanceof Error ? error.message : "Falha ao validar sessão ou permissões.",
    };
  }
}
