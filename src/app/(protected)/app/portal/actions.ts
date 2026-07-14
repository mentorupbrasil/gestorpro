"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import {
  upsertCompanyDocumentReleaseRule,
  upsertCompanyPortalUser,
} from "@/features/portal/service";
import { getRequestId } from "@/lib/http/request-id";

export type PortalFormState = { error?: string; success?: string };

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA antes de gerenciar o portal.";
  }
  if (error instanceof AppError && error.message) return error.message;
  return fallback;
}

export async function upsertPortalUserAction(
  _state: PortalFormState,
  formData: FormData,
): Promise<PortalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      companyId: z.string().uuid(),
      status: z.enum(["active", "suspended", "revoked"]),
      userId: z.string().uuid(),
    })
    .safeParse({
      companyId: formData.get("companyId"),
      status: formData.get("status"),
      userId: formData.get("userId"),
    });
  if (!form.success) return { error: "Revise empresa, usuário e status." };

  try {
    await upsertCompanyPortalUser(
      {
        companyId: form.data.companyId,
        status: form.data.status,
        tenantId: selectedTenantId,
        userId: form.data.userId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao gravar usuário do portal.") };
  }

  revalidatePath("/app/finance");
  revalidatePath("/app/portal");
  return { success: "Usuário do portal atualizado." };
}

export async function upsertReleaseRuleAction(
  _state: PortalFormState,
  formData: FormData,
): Promise<PortalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      companyId: z.string().uuid(),
      documentType: z.enum(["aso", "triage_form", "exam_report", "generic"]),
      redactionProfile: z.enum(["operational", "minimal", "full_allowed"]),
      releaseToCompany: z.coerce.boolean().default(false),
    })
    .safeParse({
      companyId: formData.get("companyId"),
      documentType: formData.get("documentType"),
      redactionProfile: formData.get("redactionProfile") ?? "operational",
      releaseToCompany: formData.get("releaseToCompany") === "on",
    });
  if (!form.success) return { error: "Revise a matriz de liberação." };

  try {
    await upsertCompanyDocumentReleaseRule(
      {
        companyId: form.data.companyId,
        documentType: form.data.documentType,
        redactionProfile: form.data.redactionProfile,
        releaseToCompany: form.data.releaseToCompany,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao gravar regra de liberação.") };
  }

  revalidatePath("/app/finance");
  revalidatePath("/app/portal");
  return { success: "Matriz de documentos atualizada." };
}
