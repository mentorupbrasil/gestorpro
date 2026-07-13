import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createCompanySchema,
  createExamCatalogItemSchema,
  createManualExamOverrideSchema,
  createPcmsoVersionSchema,
  createWorkerSchema,
  type CreateCompanyInput,
  type CreateExamCatalogItemInput,
  type CreateManualExamOverrideInput,
  type CreatePcmsoVersionInput,
  type CreateWorkerInput,
} from "./schemas";

export async function createCompany(input: CreateCompanyInput, requestId: string) {
  const parsed = createCompanySchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "occupational.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_occupational_company", {
    audit_request_id: requestId,
    company_legal_name: parsed.legalName,
    company_tax_id: parsed.taxId,
    company_trade_name: parsed.tradeName ?? "",
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar a empresa.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createWorker(input: CreateWorkerInput, requestId: string) {
  const parsed = createWorkerSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "occupational.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_occupational_worker", {
    audit_request_id: requestId,
    target_tenant_id: context.tenantId,
    worker_cpf: parsed.cpf,
    worker_full_name: parsed.fullName,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar o trabalhador.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createExamCatalogItem(input: CreateExamCatalogItemInput) {
  const parsed = createExamCatalogItemSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "protocols.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("exam_catalog")
    .insert({
      code: parsed.code,
      name: parsed.name,
      result_type: parsed.resultType,
      tenant_id: context.tenantId,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar o exame do catálogo.", {
      cause: error,
      status: 500,
    });
  }

  return data.id as string;
}

export async function createPcmsoVersion(input: CreatePcmsoVersionInput) {
  const parsed = createPcmsoVersionSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "protocols.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data: program, error: programError } = await supabase
    .from("pcmso_programs")
    .upsert(
      {
        code: parsed.programCode,
        company_id: parsed.companyId,
        name: parsed.name,
        status: "active",
        tenant_id: context.tenantId,
      },
      { onConflict: "tenant_id,company_id,code" },
    )
    .select("id")
    .single();

  if (programError || !program?.id) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar o programa PCMSO.", {
      cause: programError,
      status: 500,
    });
  }

  const { data, error } = await supabase
    .from("pcmso_versions")
    .insert({
      approved_at: new Date().toISOString(),
      company_id: parsed.companyId,
      content_hash: `manual-${parsed.companyId}-${parsed.versionNumber}-${parsed.validFrom}`,
      pcmso_program_id: program.id,
      status: "approved",
      tenant_id: context.tenantId,
      valid_from: parsed.validFrom,
      valid_until: parsed.validUntil || null,
      version_number: parsed.versionNumber,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar a versão PCMSO.", {
      cause: error,
      status: 500,
    });
  }

  return data.id as string;
}

export async function createManualExamOverride(
  input: CreateManualExamOverrideInput,
  requestId: string,
) {
  const parsed = createManualExamOverrideSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "protocols.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_exam_protocol_override", {
    audit_request_id: requestId,
    override_action: parsed.action,
    override_justification: parsed.justification,
    target_employment_contract_id: parsed.employmentContractId,
    target_exam_catalog_id: parsed.examCatalogId,
    target_exam_protocol_id: parsed.examProtocolId,
    target_tenant_id: context.tenantId,
    target_worker_id: parsed.workerId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível registrar o override.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
