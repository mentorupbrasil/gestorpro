import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

export const upsertCompanyPortalUserSchema = z.object({
  companyId: z.string().uuid(),
  scopes: z.array(z.string()).default([]),
  status: z.enum(["active", "suspended", "revoked"]).default("active"),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type UpsertCompanyPortalUserInput = z.input<typeof upsertCompanyPortalUserSchema>;

export const upsertReleaseRuleSchema = z.object({
  companyId: z.string().uuid(),
  documentType: z.enum(["aso", "triage_form", "exam_report", "generic"]),
  redactionProfile: z.enum(["operational", "minimal", "full_allowed"]).default("operational"),
  releaseToCompany: z.boolean().default(false),
  tenantId: z.string().uuid(),
});

export type UpsertReleaseRuleInput = z.input<typeof upsertReleaseRuleSchema>;

export const companyPortalOverviewSchema = z.object({
  companyId: z.string().uuid(),
  encountersSafe: z
    .array(
      z.object({
        checkedInAt: z.string().nullable().optional(),
        id: z.string().uuid(),
        statusLabel: z.string(),
      }),
    )
    .default([]),
  invoices: z
    .array(
      z.object({
        dueOn: z.string().nullable().optional(),
        id: z.string().uuid(),
        issuedAt: z.string().nullable().optional(),
        status: z.string(),
        totalCents: z.number(),
      }),
    )
    .default([]),
  releaseRules: z
    .array(
      z.object({
        documentType: z.string(),
        redactionProfile: z.string(),
        releaseToCompany: z.boolean(),
      }),
    )
    .default([]),
  releasedDocuments: z
    .array(
      z.object({
        createdAt: z.string().optional(),
        currentVersion: z.number().optional(),
        documentType: z.string(),
        id: z.string().uuid(),
        status: z.string(),
      }),
    )
    .default([]),
});

export type CompanyPortalOverview = z.infer<typeof companyPortalOverviewSchema>;

export async function upsertCompanyPortalUser(
  input: UpsertCompanyPortalUserInput,
  requestId: string,
) {
  const parsed = upsertCompanyPortalUserSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "company_portal.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("upsert_company_portal_user", {
    audit_request_id: requestId,
    scopes_value: parsed.scopes,
    status_value: parsed.status,
    target_company_id: parsed.companyId,
    target_tenant_id: context.tenantId,
    target_user_id: parsed.userId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível gravar usuário do portal.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function upsertCompanyDocumentReleaseRule(
  input: UpsertReleaseRuleInput,
  requestId: string,
) {
  const parsed = upsertReleaseRuleSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "company_portal.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("upsert_company_document_release_rule", {
    audit_request_id: requestId,
    document_type_value: parsed.documentType,
    redaction_profile_value: parsed.redactionProfile,
    release_to_company_value: parsed.releaseToCompany,
    target_company_id: parsed.companyId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível gravar regra de liberação.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function loadCompanyPortalOverview(tenantId: string, companyId: string) {
  await resolveAuthorizationContext(tenantId);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_company_portal_overview", {
    target_company_id: companyId,
    target_tenant_id: tenantId,
  });

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível carregar o portal da empresa.", {
      cause: error,
      status: 500,
    });
  }

  return companyPortalOverviewSchema.parse(data ?? {});
}
