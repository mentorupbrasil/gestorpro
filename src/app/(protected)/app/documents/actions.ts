"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { createGeneratedDocumentVersion, signDocumentVersion } from "@/features/documents/service";
import { getRequestId } from "@/lib/http/request-id";

export type DocumentsFormState = { error?: string; success?: string };

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA antes de emitir ou assinar.";
  }
  if (error instanceof AppError && error.message) return error.message;
  return fallback;
}

export async function createDocumentVersionAction(
  _state: DocumentsFormState,
  formData: FormData,
): Promise<DocumentsFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  if (formData.get("storagePath")) {
    return { error: "Caminho de storage do cliente não é aceito." };
  }

  const form = z
    .object({
      documentType: z.enum(["aso", "triage_form", "exam_report", "generic"]),
      encounterId: z.string().uuid(),
      hasMedicalConclusion: z.coerce.boolean().default(false),
      idempotencyKey: z.string().min(8),
      pendingRequiredExams: z.coerce.number().int().nonnegative().default(0),
      templateVersionId: z.string().uuid(),
    })
    .safeParse({
      documentType: formData.get("documentType"),
      encounterId: formData.get("encounterId"),
      hasMedicalConclusion: formData.get("hasMedicalConclusion") === "on",
      idempotencyKey: formData.get("idempotencyKey"),
      pendingRequiredExams: formData.get("pendingRequiredExams") ?? 0,
      templateVersionId: formData.get("templateVersionId"),
    });
  if (!form.success) return { error: "Revise os campos do documento." };

  try {
    const result = await createGeneratedDocumentVersion(
      {
        documentType: form.data.documentType,
        encounterId: form.data.encounterId,
        hasMedicalConclusion: form.data.hasMedicalConclusion,
        idempotencyKey: form.data.idempotencyKey,
        pendingRequiredExams: form.data.pendingRequiredExams,
        snapshot: {
          encounterId: form.data.encounterId,
          issuedAt: new Date().toISOString(),
          type: form.data.documentType,
        },
        templateVersionId: form.data.templateVersionId,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
    revalidatePath("/app/documents");
    if (result.renderStatus !== "rendered") {
      return {
        success:
          `Versão ${result.versionId.slice(0, 8)}… criada (pending). ${result.warning ?? ""}`.trim(),
      };
    }
    return { success: `Versão gerada e PDF privado gravado (${result.versionId.slice(0, 8)}…).` };
  } catch (error) {
    return { error: publicError(error, "Falha ao gerar documento.") };
  }
}

export async function signDocumentVersionAction(
  _state: DocumentsFormState,
  formData: FormData,
): Promise<DocumentsFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      contentHash: z.string().min(16),
      documentVersionId: z.string().uuid(),
    })
    .safeParse({
      contentHash: formData.get("contentHash"),
      documentVersionId: formData.get("documentVersionId"),
    });
  if (!form.success) return { error: "Versão ou hash inválidos." };

  try {
    await signDocumentVersion(
      {
        contentHash: form.data.contentHash,
        documentVersionId: form.data.documentVersionId,
        method: "totp",
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao assinar documento.") };
  }

  revalidatePath("/app/documents");
  return { success: "Documento assinado (hash vinculado)." };
}
