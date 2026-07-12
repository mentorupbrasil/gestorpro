"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { setMembershipStatus } from "@/features/platform/service";
import { getRequestId } from "@/lib/http/request-id";
import { createOperationalLogger } from "@/lib/observability/logger";

export type MembershipStatusState = { error?: string; success?: string };
const formSchema = z.object({
  membershipId: z.uuid(),
  status: z.enum(["active", "blocked", "inactive"]),
});
const logger = createOperationalLogger();

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
    return { error: "Não foi possível alterar o vínculo. A ação pode não ser permitida." };
  }

  revalidatePath("/app/access");
  return { success: "Status do vínculo atualizado com auditoria." };
}
