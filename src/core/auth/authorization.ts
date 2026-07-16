import { AppError } from "@/core/errors/app-error";
import type { Permission } from "@/core/auth/permissions";

export type AuthorizationContext = Readonly<{
  aal: "aal1" | "aal2";
  clinicUnitIds: ReadonlySet<string>;
  permissions: ReadonlySet<Permission>;
  tenantId: string;
  unitPermissions: ReadonlyMap<string, ReadonlySet<Permission>>;
  userId: string;
}>;

export function requirePermission(
  context: AuthorizationContext | null,
  permission: Permission,
): AuthorizationContext {
  if (!context) {
    throw new AppError("AUTHENTICATION_REQUIRED", "Autenticação necessária.", { status: 401 });
  }

  if (!context.permissions.has(permission)) {
    throw new AppError("PERMISSION_DENIED", "Você não possui permissão para esta ação.", {
      status: 403,
    });
  }

  return context;
}

/** True when the permission is tenant-wide OR granted in at least one unit. */
export function hasTenantOrUnitPermission(
  context: AuthorizationContext,
  permission: Permission,
): boolean {
  if (context.permissions.has(permission)) return true;
  for (const unitPermissions of context.unitPermissions.values()) {
    if (unitPermissions.has(permission)) return true;
  }
  return false;
}

/**
 * Gate for operational surfaces where unit-scoped roles are valid.
 * Never promotes a unit grant to tenant-wide; use requireUnitPermission on the real unit.
 */
export function requireTenantOrUnitPermission(
  context: AuthorizationContext | null,
  permission: Permission,
): AuthorizationContext {
  if (!context) {
    throw new AppError("AUTHENTICATION_REQUIRED", "Autenticação necessária.", { status: 401 });
  }

  if (!hasTenantOrUnitPermission(context, permission)) {
    throw new AppError("PERMISSION_DENIED", "Você não possui permissão para esta ação.", {
      status: 403,
    });
  }

  return context;
}

export function requireClinicUnit(context: AuthorizationContext, clinicUnitId: string) {
  if (!context.clinicUnitIds.has(clinicUnitId)) {
    throw new AppError("TENANT_ACCESS_DENIED", "Unidade fora do seu escopo de acesso.", {
      status: 403,
    });
  }
}

export function requireUnitPermission(
  context: AuthorizationContext,
  clinicUnitId: string,
  permission: Permission,
) {
  requireClinicUnit(context, clinicUnitId);

  if (
    !context.permissions.has(permission) &&
    !context.unitPermissions.get(clinicUnitId)?.has(permission)
  ) {
    throw new AppError("PERMISSION_DENIED", "Você não possui permissão nesta unidade.", {
      status: 403,
    });
  }

  return context;
}

export function requireAal2(context: AuthorizationContext) {
  if (context.aal !== "aal2") {
    throw new AppError("MFA_REQUIRED", "Esta ação exige autenticação reforçada.", {
      status: 403,
    });
  }
}
