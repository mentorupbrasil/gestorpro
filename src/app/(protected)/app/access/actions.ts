"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import {
  assignMembershipRole,
  revokeMembershipRole,
  setMembershipStatus,
} from "@/features/platform/service";
import { getRequestId } from "@/lib/http/request-id";
import { createOperationalLogger } from "@/lib/observability/logger";

export type MembershipStatusState = { error?: string; success?: string };
export type MembershipRoleState = { error?: string; success?: string };

const formSchema = z.object({
  membershipId: z.uuid(),
  status: z.enum(["active", "blocked", "inactive"]),
});
const assignRoleFormSchema = z.object({
  membershipId: z.uuid(),
  roleId: z.uuid(),
});
const revokeRoleFormSchema = z.object({
  membershipRoleId: z.uuid(),
});
const logger = createOperationalLogger();

function mapAccessError(error: unknown, fallback: string): MembershipRoleState {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return { error: "Confirme o MFA em Segurança da conta antes de alterar acessos." };
  }
  return { error: fallback };
}

export async function setMembershipStatusAction(
  _state: MembershipStatusState,
  formData: FormData,
): Promise<MembershipStatusState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  const form = formSchema.safeParse({
    membershipId: formData.get("membershipId"),
    status: formData.get("status"),
  });
  if (!selectedTenantId || !form.success) return { error: "Solicitação de vínculo inválida." };

  const requestId = getRequestId(await headers());
  try {
    await setMembershipStatus({ ...form.data, tenantId: selectedTenantId }, requestId);
  } catch (error) {
    logger.error({
      errorCode: error instanceof AppError ? error.code : "INTERNAL_ERROR",
      event: "membership.status_change_failed",
      requestId,
      route: "/app/access",
    });
    return mapAccessError(
      error,
      "Não foi possível alterar o vínculo. A ação pode não ser permitida.",
    );
  }

  revalidatePath("/app/access");
  return { success: "Status do vínculo atualizado com auditoria." };
}

export async function assignMembershipRoleAction(
  _state: MembershipRoleState,
  formData: FormData,
): Promise<MembershipRoleState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  const form = assignRoleFormSchema.safeParse({
    membershipId: formData.get("membershipId"),
    roleId: formData.get("roleId"),
  });
  if (!selectedTenantId || !form.success) return { error: "Solicitação de papel inválida." };

  const requestId = getRequestId(await headers());
  try {
    await assignMembershipRole({ ...form.data, tenantId: selectedTenantId }, requestId);
  } catch (error) {
    logger.error({
      errorCode: error instanceof AppError ? error.code : "INTERNAL_ERROR",
      event: "membership_role.assign_failed",
      requestId,
      route: "/app/access",
    });
    return mapAccessError(
      error,
      "Não foi possível conceder o papel. A ação pode não ser permitida.",
    );
  }

  revalidatePath("/app/access");
  return { success: "Papel concedido com auditoria." };
}

export async function revokeMembershipRoleAction(
  _state: MembershipRoleState,
  formData: FormData,
): Promise<MembershipRoleState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  const form = revokeRoleFormSchema.safeParse({
    membershipRoleId: formData.get("membershipRoleId"),
  });
  if (!selectedTenantId || !form.success) return { error: "Solicitação de remoção inválida." };

  const requestId = getRequestId(await headers());
  try {
    await revokeMembershipRole({ ...form.data, tenantId: selectedTenantId }, requestId);
  } catch (error) {
    logger.error({
      errorCode: error instanceof AppError ? error.code : "INTERNAL_ERROR",
      event: "membership_role.revoke_failed",
      requestId,
      route: "/app/access",
    });
    return mapAccessError(
      error,
      "Não foi possível remover o papel. A ação pode não ser permitida.",
    );
  }

  revalidatePath("/app/access");
  return { success: "Papel removido com auditoria." };
}
