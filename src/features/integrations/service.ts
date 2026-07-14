import "server-only";

import { hasTenantOrUnitPermission, requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import {
  assertEsocialEnvironment,
  assertEsocialPayloadShape,
  buildEsocialIdempotencyKey,
  hashEsocialPayload,
} from "@/features/integrations/esocial";
import {
  assertIdempotencyKey,
  redactIntegrationPayload,
} from "@/features/integrations/integration-workflow";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

export const enqueueIntegrationJobSchema = z.object({
  connectionId: z.string().uuid(),
  idempotencyKey: z.string().trim().min(8).max(160),
  jobType: z.string().trim().min(2).max(64),
  payload: z.record(z.string(), z.unknown()).default({}),
  tenantId: z.string().uuid(),
});

export type EnqueueIntegrationJobInput = z.infer<typeof enqueueIntegrationJobSchema>;

export const createEsocialEventSchema = z.object({
  businessKey: z.string().trim().min(2).max(120),
  environment: z.enum(["restricted_production", "production"]).default("restricted_production"),
  eventType: z.string().trim().min(2).max(64),
  layoutVersionId: z.string().uuid(),
  operationType: z
    .enum(["original", "correction", "rectification", "exclusion"])
    .default("original"),
  payload: z.record(z.string(), z.unknown()),
  productionAuthorized: z.boolean().default(false),
  tenantId: z.string().uuid(),
});

export type CreateEsocialEventInput = z.infer<typeof createEsocialEventSchema>;

export const registerSpoolFileSchema = z.object({
  connectorId: z.string().uuid(),
  contentHash: z.string().trim().min(16).max(128),
  fileName: z.string().trim().min(1).max(255),
  monitoredFolder: z.string().trim().min(1).max(500),
  tenantId: z.string().uuid(),
});

export type RegisterSpoolFileInput = z.infer<typeof registerSpoolFileSchema>;

export const requeueDeadLetterSchema = z.object({
  deadLetterId: z.string().uuid(),
  tenantId: z.string().uuid(),
});

export type RequeueDeadLetterInput = z.infer<typeof requeueDeadLetterSchema>;

export async function enqueueIntegrationJob(
  input: EnqueueIntegrationJobInput,
  requestId: string,
) {
  const parsed = enqueueIntegrationJobSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "integrations.manage");
  requireAal2(context);
  assertIdempotencyKey(parsed.idempotencyKey);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("enqueue_integration_job", {
    audit_request_id: requestId,
    idempotency_key_value: parsed.idempotencyKey,
    job_type_value: parsed.jobType,
    payload_redacted_value: redactIntegrationPayload(parsed.payload),
    target_connection_id: parsed.connectionId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível enfileirar job.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createEsocialEvent(input: CreateEsocialEventInput, requestId: string) {
  const parsed = createEsocialEventSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "esocial.manage");
  requireAal2(context);
  assertEsocialEnvironment(parsed.environment, parsed.productionAuthorized);
  const payload = assertEsocialPayloadShape(parsed.payload);
  const idempotencyKey = buildEsocialIdempotencyKey({
    businessKey: parsed.businessKey,
    eventType: parsed.eventType,
    operation: parsed.operationType,
  });
  const payloadHash = hashEsocialPayload(payload);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_esocial_event", {
    audit_request_id: requestId,
    business_key_value: parsed.businessKey,
    environment_value: parsed.environment,
    event_type_value: parsed.eventType,
    idempotency_key_value: idempotencyKey,
    layout_version_id_value: parsed.layoutVersionId,
    operation_type_value: parsed.operationType,
    payload_hash_value: payloadHash,
    payload_value: payload,
    previous_event_id_value: null,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar evento eSocial (sandbox).", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function registerConnectorSpoolFile(
  input: RegisterSpoolFileInput,
  requestId: string,
) {
  const parsed = registerSpoolFileSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  if (
    !hasTenantOrUnitPermission(context, "equipment.manage") &&
    !hasTenantOrUnitPermission(context, "integrations.manage")
  ) {
    throw new AppError("PERMISSION_DENIED", "Sem permissão para spool do conector.", {
      status: 403,
    });
  }
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("register_connector_spool_file", {
    audit_request_id: requestId,
    content_hash_value: parsed.contentHash,
    file_name_value: parsed.fileName,
    monitored_folder_value: parsed.monitoredFolder,
    payload_redacted_value: {
      source: "checkpoint",
      folder: parsed.monitoredFolder,
    },
    target_connector_id: parsed.connectorId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível registrar arquivo no spool.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function requeueIntegrationDeadLetter(
  input: RequeueDeadLetterInput,
  requestId: string,
) {
  const parsed = requeueDeadLetterSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "integrations.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("requeue_integration_dead_letter", {
    audit_request_id: requestId,
    target_dead_letter_id: parsed.deadLetterId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível reprocessar dead-letter.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
