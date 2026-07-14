import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
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

export async function createOccupationalStructure(input: CreateOccupationalStructureInput) {
  const parsed = createOccupationalStructureSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "occupational.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();

  const { data: establishment, error: establishmentError } = await supabase
    .from("company_establishments")
    .upsert(
      {
        code: parsed.establishmentCode,
        company_id: parsed.companyId,
        name: parsed.establishmentName,
        status: "active",
        tenant_id: context.tenantId,
      },
      { onConflict: "tenant_id,company_id,code" },
    )
    .select("id")
    .single();

  if (establishmentError || !establishment?.id) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar o estabelecimento.", {
      cause: establishmentError,
      status: 500,
    });
  }

  const { data: sector, error: sectorError } = await supabase
    .from("sectors")
    .upsert(
      {
        code: parsed.sectorCode,
        company_id: parsed.companyId,
        establishment_id: establishment.id,
        name: parsed.sectorName,
        status: "active",
        tenant_id: context.tenantId,
      },
      { onConflict: "tenant_id,company_id,code" },
    )
    .select("id")
    .single();

  if (sectorError || !sector?.id) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar o setor.", {
      cause: sectorError,
      status: 500,
    });
  }

  const { data: job, error: jobError } = await supabase
    .from("job_positions")
    .upsert(
      {
        code: parsed.jobCode,
        company_id: parsed.companyId,
        name: parsed.jobName,
        sector_id: sector.id,
        status: "active",
        tenant_id: context.tenantId,
      },
      { onConflict: "tenant_id,company_id,code" },
    )
    .select("id")
    .single();

  if (jobError || !job?.id) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar a função.", {
      cause: jobError,
      status: 500,
    });
  }

  const { data: exposureGroup, error: exposureGroupError } = await supabase
    .from("exposure_groups")
    .upsert(
      {
        code: parsed.exposureGroupCode,
        company_id: parsed.companyId,
        name: parsed.exposureGroupName,
        status: "active",
        tenant_id: context.tenantId,
      },
      { onConflict: "tenant_id,company_id,code" },
    )
    .select("id")
    .single();

  if (exposureGroupError || !exposureGroup?.id) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar o GHE.", {
      cause: exposureGroupError,
      status: 500,
    });
  }

  const { data: risk, error: riskError } = await supabase
    .from("occupational_risks")
    .upsert(
      {
        code: parsed.riskCode,
        name: parsed.riskName,
        risk_type: parsed.riskType,
        status: "active",
        tenant_id: context.tenantId,
      },
      { onConflict: "tenant_id,code" },
    )
    .select("id")
    .single();

  if (riskError || !risk?.id) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar o risco.", {
      cause: riskError,
      status: 500,
    });
  }

  await supabase.from("risk_assignments").insert({
    company_id: parsed.companyId,
    exposure_group_id: exposureGroup.id,
    job_position_id: job.id,
    occupational_risk_id: risk.id,
    source: "manual",
    starts_on: parsed.startsOn,
    tenant_id: context.tenantId,
    version: 1,
  });

  const { data: employment, error: employmentError } = await supabase
    .from("employment_contracts")
    .insert({
      company_id: parsed.companyId,
      exposure_group_id: exposureGroup.id,
      job_position_id: job.id,
      sector_id: sector.id,
      starts_on: parsed.startsOn,
      status: "active",
      tenant_id: context.tenantId,
      version: 1,
      worker_id: parsed.workerId,
    })
    .select("id")
    .single();

  if (employmentError || !employment?.id) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar o vínculo.", {
      cause: employmentError,
      status: 500,
    });
  }

  await supabase.from("employment_contract_history").insert({
    employment_contract_id: employment.id,
    event_type: "created",
    payload: {
      exposureGroupId: exposureGroup.id,
      jobPositionId: job.id,
      sectorId: sector.id,
    },
    tenant_id: context.tenantId,
  });

  return employment.id as string;
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
        exam_catalog(id, code, name)
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
      .select("action, justification, exam_catalog(id, code, name)")
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
