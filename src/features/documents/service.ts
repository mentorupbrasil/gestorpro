import "server-only";

import { createHash } from "node:crypto";
import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import {
  assertAsoReadiness,
  assertPrivateDocumentPath,
  buildDocumentHash,
  buildNonPhiDocumentStubPdf,
  CLINICAL_PRIVATE_BUCKET,
  type DocumentType,
} from "@/features/documents/document-workflow";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

export const createDocumentVersionSchema = z.object({
  documentType: z.enum(["aso", "triage_form", "exam_report", "generic"]),
  encounterId: z.string().uuid(),
  hasMedicalConclusion: z.boolean().default(false),
  idempotencyKey: z.string().trim().min(8).max(128),
  pendingRequiredExams: z.number().int().nonnegative().default(0),
  rectificationReason: z.string().trim().max(500).optional().default(""),
  snapshot: z.record(z.string(), z.unknown()),
  templateVersionId: z.string().uuid(),
  tenantId: z.string().uuid(),
});

export type CreateDocumentVersionInput = z.input<typeof createDocumentVersionSchema>;

export const signDocumentVersionSchema = z.object({
  contentHash: z.string().trim().min(16),
  documentVersionId: z.string().uuid(),
  method: z.enum(["password_reauth", "totp", "webauthn"]).default("totp"),
  tenantId: z.string().uuid(),
});

export type SignDocumentVersionInput = z.input<typeof signDocumentVersionSchema>;

export async function createGeneratedDocumentVersion(
  input: CreateDocumentVersionInput,
  requestId: string,
) {
  const parsed = createDocumentVersionSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "documents.manage");
  requireAal2(context);

  assertAsoReadiness({
    documentType: parsed.documentType as DocumentType,
    hasMedicalConclusion: parsed.hasMedicalConclusion,
    pendingRequiredExams: parsed.pendingRequiredExams,
  });

  const snapshotHash = buildDocumentHash(parsed.snapshot);
  const supabase = await createServerSupabaseClient();
  const { data: versionId, error } = await supabase.rpc("create_generated_document_version", {
    audit_request_id: requestId,
    content_hash_value: snapshotHash,
    document_type_value: parsed.documentType,
    idempotency_key_value: parsed.idempotencyKey,
    rectification_reason_value: parsed.rectificationReason,
    snapshot_payload_value: parsed.snapshot,
    // Path do cliente rejeitado: RPC ignora e gera opaco + pending.
    storage_path_value: "",
    target_encounter_id: parsed.encounterId,
    target_template_version_id: parsed.templateVersionId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof versionId !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível gerar documento.", {
      cause: error,
      status: 500,
    });
  }

  const { data: versionRow, error: versionError } = await supabase
    .from("document_versions")
    .select("id, storage_path, storage_bucket, render_status")
    .eq("tenant_id", context.tenantId)
    .eq("id", versionId)
    .maybeSingle();

  if (versionError || !versionRow?.storage_path) {
    throw new AppError("INTERNAL_ERROR", "Versão criada sem caminho de storage.", {
      cause: versionError,
      status: 500,
    });
  }

  assertPrivateDocumentPath({
    bucket: versionRow.storage_bucket ?? CLINICAL_PRIVATE_BUCKET,
    path: versionRow.storage_path,
  });

  let renderStatus = versionRow.render_status ?? "pending";
  let contentHash = snapshotHash;

  try {
    const pdfBytes = buildNonPhiDocumentStubPdf({
      documentType: parsed.documentType as DocumentType,
      versionId,
    });
    contentHash = createHash("sha256").update(pdfBytes).digest("hex");

    const admin = createAdminSupabaseClient();
    const { error: uploadError } = await admin.storage
      .from(CLINICAL_PRIVATE_BUCKET)
      .upload(versionRow.storage_path, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: finalizeError } = await supabase.rpc("finalize_document_version_render", {
      audit_request_id: requestId,
      content_hash_value: contentHash,
      render_status_value: "rendered",
      target_document_version_id: versionId,
      target_tenant_id: context.tenantId,
    });

    if (finalizeError) {
      throw finalizeError;
    }

    renderStatus = "rendered";
  } catch (cause) {
    // Fail-closed: versão permanece pending se upload/finalize falhar.
    return {
      contentHash: snapshotHash,
      renderStatus: "pending" as const,
      versionId,
      warning:
        cause instanceof AppError && cause.message.includes("SUPABASE_SERVICE_ROLE_KEY")
          ? "Versão pending: configure SUPABASE_SERVICE_ROLE_KEY para gravar o PDF privado."
          : "Versão pending: PDF ainda não foi gravado no storage privado.",
    };
  }

  return { contentHash, renderStatus, versionId };
}

export async function signDocumentVersion(input: SignDocumentVersionInput, requestId: string) {
  const parsed = signDocumentVersionSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "documents.sign");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("sign_document_version", {
    aal_value: "aal2",
    audit_request_id: requestId,
    ip_value: null,
    method_value: parsed.method,
    signed_hash_value: parsed.contentHash,
    target_document_version_id: parsed.documentVersionId,
    target_tenant_id: context.tenantId,
    user_agent_value: "",
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível assinar documento.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
