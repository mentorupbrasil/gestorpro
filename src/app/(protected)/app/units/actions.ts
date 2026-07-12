"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { createClinicUnit } from "@/features/platform/service";
import { getRequestId } from "@/lib/http/request-id";
import { createOperationalLogger } from "@/lib/observability/logger";

export type CreateUnitState = { error?: string; success?: string };

const formSchema = z.object({
  code: z.string(),
  name: z.string(),
});
const logger = createOperationalLogger();

export async function createUnitAction(
  _state: CreateUnitState,
  formData: FormData,
): Promise<CreateUnitState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = formSchema.safeParse({ code: formData.get("code"), name: formData.get("name") });
  if (!form.success) return { error: "Revise o código e o nome da unidade." };

  const requestId = getRequestId(await headers());
  try {
    await createClinicUnit({ ...form.data, tenantId: selectedTenantId }, requestId);
  } catch (error) {
    logger.error({
      errorCode: error instanceof AppError ? error.code : "INTERNAL_ERROR",
      event: "clinic_unit.create_failed",
      requestId,
      route: "/app/units",
    });
    return { error: "Não foi possível criar a unidade. Confirme seus dados e sua permissão." };
  }

  revalidatePath("/app/units");
  return { success: "Unidade criada com auditoria." };
}
