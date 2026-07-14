import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import {
  assertAsoReadiness,
  assertPrivateDocumentPath,
  buildDocumentHash,
  type DocumentType,
} from "@/features/documents/document-workflow";
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
  storagePath: z.string().trim().min(3).max(500),
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
  assertPrivateDocumentPath({
    bucket: "clinical-private",
    path: parsed.storagePath,
  });

  const contentHash = buildDocumentHash(parsed.snapshot);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_generated_document_version", {
    audit_request_id: requestId,
    content_hash_value: contentHash,
    document_type_value: parsed.documentType,
    idempotency_key_value: parsed.idempotencyKey,
    rectification_reason_value: parsed.rectificationReason,
    snapshot_payload_value: parsed.snapshot,
    storage_path_value: parsed.storagePath,
    target_encounter_id: parsed.encounterId,
    target_template_version_id: parsed.templateVersionId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível gerar documento.", {
      cause: error,
      status: 500,
    });
  }

  return { contentHash, versionId: data };
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
