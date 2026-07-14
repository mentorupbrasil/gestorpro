import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import {
  EXAM_PROTOCOL_ITEM_CATALOG_EMBED,
  EXAM_PROTOCOL_OVERRIDE_CATALOG_EMBED,
} from "@/lib/supabase/embeds";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createCompanySchema,
  createExamCatalogItemSchema,
  createExamProtocolPackageSchema,
  createManualExamOverrideSchema,
  createOccupationalStructureSchema,
  createPcmsoVersionSchema,
  createWorkerSchema,
  simulateRequiredExamsSchema,
  type CreateCompanyInput,
  type CreateExamCatalogItemInput,
  type CreateExamProtocolPackageInput,
  type CreateManualExamOverrideInput,
  type CreateOccupationalStructureInput,
  type CreatePcmsoVersionInput,
  type CreateWorkerInput,
  type SimulateRequiredExamsInput,
} from "./schemas";
import {
  calculateRequiredExams,
  type ExamProtocolOverrideSnapshot,
  type ExamProtocolSnapshot,
} from "./exam-engine";

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

export async function createExamCatalogItem(input: CreateExamCatalogItemInput, requestId: string) {
  const parsed = createExamCatalogItemSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "protocols.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_exam_catalog_item", {
    audit_request_id: requestId,
    code_value: parsed.code,
    name_value: parsed.name,
    result_type_value: parsed.resultType,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar o exame do catálogo.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createPcmsoVersion(input: CreatePcmsoVersionInput, requestId: string) {
  const parsed = createPcmsoVersionSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "protocols.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("publish_pcmso_version", {
    audit_request_id: requestId,
    company_id_value: parsed.companyId,
    program_code: parsed.programCode,
    program_name: parsed.name,
    target_tenant_id: context.tenantId,
    valid_from_value: parsed.validFrom,
    valid_until_value: parsed.validUntil || null,
    version_number_value: parsed.versionNumber,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível publicar a versão PCMSO.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createOccupationalStructure(
  input: CreateOccupationalStructureInput,
  requestId: string,
) {
  const parsed = createOccupationalStructureSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "occupational.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_occupational_structure", {
    audit_request_id: requestId,
    company_id_value: parsed.companyId,
    establishment_code: parsed.establishmentCode,
    establishment_name: parsed.establishmentName,
    exposure_group_code: parsed.exposureGroupCode,
    exposure_group_name: parsed.exposureGroupName,
    job_code: parsed.jobCode,
    job_name: parsed.jobName,
    risk_code: parsed.riskCode,
    risk_name: parsed.riskName,
    risk_type_value: parsed.riskType,
    sector_code: parsed.sectorCode,
    sector_name: parsed.sectorName,
    starts_on_value: parsed.startsOn,
    target_tenant_id: context.tenantId,
    worker_id_value: parsed.workerId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar estrutura e vínculo.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createExamProtocolPackage(
  input: CreateExamProtocolPackageInput,
  requestId: string,
) {
  const parsed = createExamProtocolPackageSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "protocols.manage");
  requireAal2(context);

  const items = parsed.examCatalogIds.map((examCatalogId) => ({
    conditions: parsed.riskCodes.length > 0 ? { riskCodes: parsed.riskCodes } : {},
    examCatalogId,
    required: true,
  }));

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_exam_protocol_package", {
    activate_protocol: parsed.activate,
    audit_request_id: requestId,
    items_value: items,
    occupational_exam_type_value: parsed.occupationalExamType,
    target_pcmso_version_id: parsed.pcmsoVersionId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar o protocolo de exames.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function simulateRequiredExams(input: SimulateRequiredExamsInput) {
  const parsed = simulateRequiredExamsSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  const canSimulate =
    context.permissions.has("occupational.read") ||
    context.permissions.has("referrals.manage") ||
    context.permissions.has("protocols.manage");
  if (!canSimulate) {
    throw new AppError("PERMISSION_DENIED", "Você não possui permissão para esta ação.", {
      status: 403,
    });
  }

  const supabase = await createServerSupabaseClient();
  const { data: protocolRows, error } = await supabase
    .from("exam_protocols")
    .select(
      `
      id,
      status,
      occupational_exam_type,
      pcmso_versions(id, status, valid_from, valid_until),
      exam_protocol_items(
        required,
        conditions,
        ${EXAM_PROTOCOL_ITEM_CATALOG_EMBED}(id, code, name)
      )
    `,
    )
    .eq("tenant_id", context.tenantId);

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível carregar protocolos.", {
      cause: error,
      status: 500,
    });
  }

  const protocols: ExamProtocolSnapshot[] = (protocolRows ?? []).flatMap((row) => {
    const version = Array.isArray(row.pcmso_versions) ? row.pcmso_versions[0] : row.pcmso_versions;
    if (!version) return [];
    const items = (row.exam_protocol_items ?? []).flatMap((item) => {
      const exam = Array.isArray(item.exam_catalog) ? item.exam_catalog[0] : item.exam_catalog;
      if (!exam) return [];
      const conditions =
        item.conditions && typeof item.conditions === "object" && !Array.isArray(item.conditions)
          ? (item.conditions as { riskCodes?: string[] })
          : {};
      return [
        {
          exam: { code: exam.code, id: exam.id, name: exam.name },
          required: item.required,
          riskCodes: conditions.riskCodes ?? [],
        },
      ];
    });

    return [
      {
        id: row.id,
        items,
        occupationalExamType:
          row.occupational_exam_type as ExamProtocolSnapshot["occupationalExamType"],
        pcmsoVersion: {
          id: version.id,
          status: version.status as "draft" | "approved" | "expired",
          validFrom: version.valid_from,
          validUntil: version.valid_until,
        },
        status: row.status as ExamProtocolSnapshot["status"],
      },
    ];
  });

  let overrides: ExamProtocolOverrideSnapshot[] = [];
  if (parsed.workerId) {
    const { data: overrideRows } = await supabase
      .from("exam_protocol_overrides")
      .select(`action, justification, ${EXAM_PROTOCOL_OVERRIDE_CATALOG_EMBED}(id, code, name)`)
      .eq("tenant_id", context.tenantId)
      .eq("worker_id", parsed.workerId)
      .order("created_at", { ascending: false })
      .limit(20);

    overrides = (overrideRows ?? []).flatMap((row) => {
      const exam = Array.isArray(row.exam_catalog) ? row.exam_catalog[0] : row.exam_catalog;
      if (!exam) return [];
      return [
        {
          action: row.action as "add" | "remove",
          exam: { code: exam.code, id: exam.id, name: exam.name },
          justification: row.justification,
        },
      ];
    });
  }

  return calculateRequiredExams({
    asOf: parsed.asOf,
    occupationalExamType: parsed.occupationalExamType,
    overrides,
    protocols,
    riskCodes: parsed.riskCodes,
  });
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
