"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import {
  createSstCipaMembership,
  createSstEpiIssue,
  createSstIncident,
} from "@/features/sst/service";
import { getRequestId } from "@/lib/http/request-id";

export type SstFormState = { error?: string; success?: string };

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA antes de registrar SST.";
  }
  if (error instanceof AppError && error.message) return error.message;
  return fallback;
}

export async function createIncidentAction(
  _state: SstFormState,
  formData: FormData,
): Promise<SstFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      companyId: z.string().uuid(),
      descriptionRedacted: z.string().min(5),
      incidentType: z.enum(["near_miss", "injury", "illness", "property", "other"]),
      severity: z.enum(["low", "medium", "high", "critical"]),
      workerId: z.string().optional(),
    })
    .safeParse({
      companyId: formData.get("companyId"),
      descriptionRedacted: formData.get("descriptionRedacted"),
      incidentType: formData.get("incidentType"),
      severity: formData.get("severity"),
      workerId: formData.get("workerId") || undefined,
    });
  if (!form.success) return { error: "Revise os campos do incidente." };

  try {
    await createSstIncident(
      {
        companyId: form.data.companyId,
        descriptionRedacted: form.data.descriptionRedacted,
        incidentType: form.data.incidentType,
        severity: form.data.severity,
        tenantId: selectedTenantId,
        workerId: form.data.workerId ? z.string().uuid().parse(form.data.workerId) : null,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao registrar incidente.") };
  }

  revalidatePath("/app/sst");
  return { success: "Incidente registrado (operacional, sem teor legal CAT)." };
}

export async function createEpiAction(
  _state: SstFormState,
  formData: FormData,
): Promise<SstFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      companyId: z.string().uuid(),
      epiCode: z.string().min(1),
      epiName: z.string().min(1),
      issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      workerId: z.string().uuid(),
    })
    .safeParse({
      companyId: formData.get("companyId"),
      epiCode: formData.get("epiCode"),
      epiName: formData.get("epiName"),
      issuedAt: formData.get("issuedAt"),
      workerId: formData.get("workerId"),
    });
  if (!form.success) return { error: "Revise entrega de EPI." };

  try {
    await createSstEpiIssue(
      {
        companyId: form.data.companyId,
        epiCode: form.data.epiCode,
        epiName: form.data.epiName,
        issuedAt: form.data.issuedAt,
        tenantId: selectedTenantId,
        workerId: form.data.workerId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao registrar EPI.") };
  }

  revalidatePath("/app/sst");
  return { success: "EPI registrado." };
}

export async function createCipaAction(
  _state: SstFormState,
  formData: FormData,
): Promise<SstFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      companyId: z.string().uuid(),
      mandateStartsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      roleLabel: z.string().min(2),
      workerId: z.string().uuid(),
    })
    .safeParse({
      companyId: formData.get("companyId"),
      mandateStartsOn: formData.get("mandateStartsOn"),
      roleLabel: formData.get("roleLabel"),
      workerId: formData.get("workerId"),
    });
  if (!form.success) return { error: "Revise dados da CIPA." };

  try {
    await createSstCipaMembership(
      {
        companyId: form.data.companyId,
        mandateStartsOn: form.data.mandateStartsOn,
        roleLabel: form.data.roleLabel,
        tenantId: selectedTenantId,
        workerId: form.data.workerId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao registrar CIPA.") };
  }

  revalidatePath("/app/sst");
  return { success: "Membro da CIPA registrado (scaffold)." };
}
