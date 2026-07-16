import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

export const createSstIncidentSchema = z.object({
  companyId: z.string().uuid(),
  descriptionRedacted: z.string().trim().min(5).max(2000),
  incidentType: z.enum(["near_miss", "injury", "illness", "property", "other"]),
  occurredAt: z.string().datetime().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("low"),
  tenantId: z.string().uuid(),
  workerId: z.string().uuid().optional().nullable(),
});

export type CreateSstIncidentInput = z.input<typeof createSstIncidentSchema>;

export const createSstEpiIssueSchema = z.object({
  companyId: z.string().uuid(),
  dueReturnOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  epiCode: z.string().trim().min(1).max(32),
  epiName: z.string().trim().min(1).max(200),
  issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  noteRedacted: z.string().trim().max(1000).optional().default(""),
  tenantId: z.string().uuid(),
  workerId: z.string().uuid(),
});

export type CreateSstEpiIssueInput = z.input<typeof createSstEpiIssueSchema>;

export const createSstCipaMembershipSchema = z.object({
  companyId: z.string().uuid(),
  mandateEndsOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  mandateStartsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  roleLabel: z.string().trim().min(2).max(120),
  tenantId: z.string().uuid(),
  workerId: z.string().uuid(),
});

export type CreateSstCipaMembershipInput = z.infer<typeof createSstCipaMembershipSchema>;

export async function createSstIncident(input: CreateSstIncidentInput, requestId: string) {
  const parsed = createSstIncidentSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "sst.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_sst_incident", {
    audit_request_id: requestId,
    description_redacted_value: parsed.descriptionRedacted,
    incident_type_value: parsed.incidentType,
    occurred_at_value: parsed.occurredAt ?? new Date().toISOString(),
    severity_value: parsed.severity,
    target_company_id: parsed.companyId,
    target_tenant_id: context.tenantId,
    target_worker_id: parsed.workerId ?? null,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível registrar incidente SST.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createSstEpiIssue(input: CreateSstEpiIssueInput, requestId: string) {
  const parsed = createSstEpiIssueSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "sst.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_sst_epi_issue", {
    audit_request_id: requestId,
    due_return_on_value: parsed.dueReturnOn ?? null,
    epi_code_value: parsed.epiCode,
    epi_name_value: parsed.epiName,
    issued_at_value: parsed.issuedAt,
    note_redacted_value: parsed.noteRedacted,
    target_company_id: parsed.companyId,
    target_tenant_id: context.tenantId,
    target_worker_id: parsed.workerId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível registrar EPI.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createSstCipaMembership(
  input: CreateSstCipaMembershipInput,
  requestId: string,
) {
  const parsed = createSstCipaMembershipSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "sst.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_sst_cipa_membership", {
    audit_request_id: requestId,
    mandate_ends_on_value: parsed.mandateEndsOn ?? null,
    mandate_starts_on_value: parsed.mandateStartsOn,
    role_label_value: parsed.roleLabel,
    target_company_id: parsed.companyId,
    target_tenant_id: context.tenantId,
    target_worker_id: parsed.workerId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível registrar membro da CIPA.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
