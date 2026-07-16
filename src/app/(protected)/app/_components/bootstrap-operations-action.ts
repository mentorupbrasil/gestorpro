"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { AppError } from "@/core/errors/app-error";
import { bootstrapTenantOperations } from "@/features/platform/bootstrap-operations";
import { getRequestId } from "@/lib/http/request-id";
import { createOperationalLogger } from "@/lib/observability/logger";

export type BootstrapOperationsState = { error?: string; success?: string };

const logger = createOperationalLogger();

export async function bootstrapTenantOperationsAction(
  _prevState: BootstrapOperationsState,
  formData: FormData,
): Promise<BootstrapOperationsState> {
  void _prevState;
  void formData;
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const requestId = getRequestId(await headers());
  try {
    const result = await bootstrapTenantOperations(selectedTenantId, requestId);
    const parts = [
      result.unitCreated ? "unidade criada" : null,
      result.formCreated ? "rascunho de triagem (aprovação humana)" : null,
      result.asoCreated ? "rascunho de template ASO (aprovação humana)" : null,
      result.rolesAssigned.length > 0
        ? `papéis: ${result.rolesAssigned.join(", ")}`
        : "sem self-grant clínico/financeiro",
    ].filter(Boolean);

    revalidatePath("/app");
    revalidatePath("/app/units");
    revalidatePath("/app/access");
    revalidatePath("/app/clinical");
    revalidatePath("/app/clinical/triage");
    revalidatePath("/app/check-in");

    return {
      success: `Operação inicializada (${parts.join("; ")}). Atualize a página se o menu não mudar.`,
    };
  } catch (error) {
    logger.error({
      errorCode: error instanceof AppError ? error.code : "INTERNAL_ERROR",
      event: "tenant.bootstrap_operations_failed",
      requestId,
      route: "/app/bootstrap",
    });
    if (error instanceof AppError && error.code === "MFA_REQUIRED") {
      return { error: error.message };
    }
    return {
      error:
        error instanceof AppError
          ? error.message
          : "Falha ao inicializar. Confirme MFA e permissão de administrador.",
    };
  }
}
