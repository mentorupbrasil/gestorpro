import { AppError } from "@/core/errors/app-error";
import type { Permission } from "@/core/auth/permissions";

export type AuthorizationContext = Readonly<{
  aal: "aal1" | "aal2";
  clinicUnitIds: ReadonlySet<string>;
  permissions: ReadonlySet<Permission>;
  tenantId: string;
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

export function requireClinicUnit(context: AuthorizationContext, clinicUnitId: string) {
  if (!context.clinicUnitIds.has(clinicUnitId)) {
    throw new AppError("TENANT_ACCESS_DENIED", "Unidade fora do seu escopo de acesso.", {
      status: 403,
    });
  }
}

export function requireAal2(context: AuthorizationContext) {
  if (context.aal !== "aal2") {
    throw new AppError("MFA_REQUIRED", "Esta ação exige autenticação reforçada.", {
      status: 403,
    });
  }
}
