"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import {
  createCompany,
  createExamCatalogItem,
  createOccupationalStructure,
  createPcmsoVersion,
  createWorker,
} from "@/features/occupational/service";
import { getRequestId } from "@/lib/http/request-id";
import { createOperationalLogger } from "@/lib/observability/logger";

export type OccupationalFormState = { error?: string; success?: string };

const companyFormSchema = z.object({
  legalName: z.string(),
  taxId: z.string(),
  tradeName: z.string().optional(),
});

const workerFormSchema = z.object({
  cpf: z.string(),
  fullName: z.string(),
});

const examCatalogFormSchema = z.object({
  code: z.string(),
  name: z.string(),
  resultType: z.enum(["clinical", "laboratory", "imaging", "audiometry", "spirometry", "other"]),
});

const pcmsoVersionFormSchema = z.object({
  companyId: z.string(),
  name: z.string(),
  programCode: z.string(),
  validFrom: z.string(),
  validUntil: z.string().optional(),
  versionNumber: z.coerce.number().int().positive(),
});

const occupationalStructureFormSchema = z.object({
  companyId: z.string(),
  establishmentCode: z.string(),
  establishmentName: z.string(),
  exposureGroupCode: z.string(),
  exposureGroupName: z.string(),
  jobCode: z.string(),
  jobName: z.string(),
  riskCode: z.string(),
  riskName: z.string(),
  riskType: z.enum(["physical", "chemical", "biological", "ergonomic", "accident"]),
  sectorCode: z.string(),
  sectorName: z.string(),
  startsOn: z.string(),
  workerId: z.string(),
});

const logger = createOperationalLogger();

function mfaMessage(error: unknown) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA em Segurança da conta antes de alterar o domínio ocupacional.";
  }

  return null;
}

export async function createCompanyAction(
  _state: OccupationalFormState,
  formData: FormData,
): Promise<OccupationalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = companyFormSchema.safeParse({
    legalName: formData.get("legalName"),
    taxId: formData.get("taxId"),
    tradeName: formData.get("tradeName"),
  });
  if (!form.success) return { error: "Revise razão social, nome fantasia e CNPJ." };

  const requestId = getRequestId(await headers());
  try {
    await createCompany({ ...form.data, tenantId: selectedTenantId }, requestId);
  } catch (error) {
    logger.error({
      errorCode: error instanceof AppError ? error.code : "INTERNAL_ERROR",
      event: "occupational.company_create_failed",
      requestId,
      route: "/app/occupational",
    });

    return { error: mfaMessage(error) ?? "Não foi possível criar a empresa." };
  }

  revalidatePath("/app/occupational");
  return { success: "Empresa criada com auditoria." };
}

export async function createWorkerAction(
  _state: OccupationalFormState,
  formData: FormData,
): Promise<OccupationalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = workerFormSchema.safeParse({
    cpf: formData.get("cpf"),
    fullName: formData.get("fullName"),
  });
  if (!form.success) return { error: "Revise nome e CPF do trabalhador." };

  const requestId = getRequestId(await headers());
  try {
    await createWorker({ ...form.data, tenantId: selectedTenantId }, requestId);
  } catch (error) {
    logger.error({
      errorCode: error instanceof AppError ? error.code : "INTERNAL_ERROR",
      event: "occupational.worker_create_failed",
      requestId,
      route: "/app/occupational",
    });

    return { error: mfaMessage(error) ?? "Não foi possível criar o trabalhador." };
  }

  revalidatePath("/app/occupational");
  return { success: "Trabalhador criado com deduplicação." };
}

export async function createExamCatalogItemAction(
  _state: OccupationalFormState,
  formData: FormData,
): Promise<OccupationalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = examCatalogFormSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    resultType: formData.get("resultType"),
  });
  if (!form.success) return { error: "Revise código, nome e tipo do exame." };

  try {
    await createExamCatalogItem({ ...form.data, tenantId: selectedTenantId });
  } catch (error) {
    return { error: mfaMessage(error) ?? "Não foi possível criar o exame do catálogo." };
  }

  revalidatePath("/app/occupational");
  return { success: "Exame incluído no catálogo." };
}

export async function createPcmsoVersionAction(
  _state: OccupationalFormState,
  formData: FormData,
): Promise<OccupationalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = pcmsoVersionFormSchema.safeParse({
    companyId: formData.get("companyId"),
    name: formData.get("name"),
    programCode: formData.get("programCode"),
    validFrom: formData.get("validFrom"),
    validUntil: formData.get("validUntil"),
    versionNumber: formData.get("versionNumber"),
  });
  if (!form.success) return { error: "Revise empresa, vigência e versão do PCMSO." };

  try {
    await createPcmsoVersion({ ...form.data, tenantId: selectedTenantId });
  } catch (error) {
    return { error: mfaMessage(error) ?? "Não foi possível criar a versão PCMSO." };
  }

  revalidatePath("/app/occupational");
  return { success: "Versão PCMSO aprovada e protegida contra alteração retroativa." };
}

export async function createOccupationalStructureAction(
  _state: OccupationalFormState,
  formData: FormData,
): Promise<OccupationalFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };

  const form = occupationalStructureFormSchema.safeParse({
    companyId: formData.get("companyId"),
    establishmentCode: formData.get("establishmentCode"),
    establishmentName: formData.get("establishmentName"),
    exposureGroupCode: formData.get("exposureGroupCode"),
    exposureGroupName: formData.get("exposureGroupName"),
    jobCode: formData.get("jobCode"),
    jobName: formData.get("jobName"),
    riskCode: formData.get("riskCode"),
    riskName: formData.get("riskName"),
    riskType: formData.get("riskType"),
    sectorCode: formData.get("sectorCode"),
    sectorName: formData.get("sectorName"),
    startsOn: formData.get("startsOn"),
    workerId: formData.get("workerId"),
  });
  if (!form.success) return { error: "Revise empresa, trabalhador, estrutura, risco e vigência." };

  try {
    await createOccupationalStructure({ ...form.data, tenantId: selectedTenantId });
  } catch (error) {
    return { error: mfaMessage(error) ?? "Não foi possível criar estrutura e vínculo." };
  }

  revalidatePath("/app/occupational");
  return { success: "Estrutura ocupacional e vínculo criados com histórico." };
}
