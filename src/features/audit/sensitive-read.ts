import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createOperationalLogger } from "@/lib/observability/logger";

const logger = createOperationalLogger();

export type SensitiveReadAction =
  | "chart.viewed"
  | "result.viewed"
  | "document.previewed"
  | "document.downloaded"
  | "document.printed"
  | "document.signed_url"
  | "document.list_viewed"
  | "sensitive_search.performed"
  | "export.performed"
  | "break_glass.accessed";

type RecordSensitiveReadInput = {
  action: SensitiveReadAction;
  entityId?: string | null;
  entityType: string;
  requestId: string;
  result?: "allowed" | "denied";
  tenantId: string;
};

/** Best-effort: never blocks the primary clinical/document read path. */
export async function recordSensitiveRead(input: RecordSensitiveReadInput) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("log_sensitive_read", {
      access_result: input.result ?? "allowed",
      audit_action: input.action,
      audit_entity_id: input.entityId ?? null,
      audit_entity_type: input.entityType,
      audit_request_id: input.requestId,
      target_tenant_id: input.tenantId,
    });
    if (error) {
      logger.error({
        errorCode: "INTERNAL_ERROR",
        event: "sensitive_read.audit_failed",
        requestId: input.requestId,
      });
    }
  } catch {
    logger.error({
      errorCode: "INTERNAL_ERROR",
      event: "sensitive_read.audit_unavailable",
      requestId: input.requestId,
    });
  }
}

type RecordDocumentAccessInput = {
  accessType: "preview" | "download" | "print" | "signed_url";
  documentVersionId: string;
  expiresAt?: string | null;
  requestId: string;
  tenantId: string;
};

export async function recordDocumentAccess(input: RecordDocumentAccessInput) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("log_document_access", {
      access_type_value: input.accessType,
      audit_request_id: input.requestId,
      expires_at_value: input.expiresAt ?? null,
      target_document_version_id: input.documentVersionId,
      target_tenant_id: input.tenantId,
    });
    if (error) {
      logger.error({
        errorCode: "INTERNAL_ERROR",
        event: "document_access.audit_failed",
        requestId: input.requestId,
      });
    }
  } catch {
    logger.error({
      errorCode: "INTERNAL_ERROR",
      event: "document_access.audit_unavailable",
      requestId: input.requestId,
    });
  }
}
