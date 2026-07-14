"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import {
  createEsocialEvent,
  enqueueIntegrationJob,
  registerConnectorSpoolFile,
  requeueIntegrationDeadLetter,
} from "@/features/integrations/service";
import { getRequestId } from "@/lib/http/request-id";

export type IntegrationsFormState = { error?: string; success?: string };

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA antes de operar integrações.";
  }
  if (error instanceof AppError && error.message) return error.message;
  return fallback;
}

export async function enqueueJobAction(
  _state: IntegrationsFormState,
  formData: FormData,
): Promise<IntegrationsFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      connectionId: z.string().uuid(),
      idempotencyKey: z.string().min(8),
      jobType: z.string().min(2),
    })
    .safeParse({
      connectionId: formData.get("connectionId"),
      idempotencyKey: formData.get("idempotencyKey"),
      jobType: formData.get("jobType"),
    });
  if (!form.success) return { error: "Revise conexão, tipo e idempotência." };

  try {
    await enqueueIntegrationJob(
      {
        connectionId: form.data.connectionId,
        idempotencyKey: form.data.idempotencyKey,
        jobType: form.data.jobType,
        payload: { source: "integrations-console" },
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao enfileirar job.") };
  }

  revalidatePath("/app/integrations");
  return { success: "Job enfileirado (payload redigido)." };
}

export async function createEsocialEventAction(
  _state: IntegrationsFormState,
  formData: FormData,
): Promise<IntegrationsFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      businessKey: z.string().min(2),
      eventType: z.string().min(2),
      layoutVersionId: z.string().uuid(),
    })
    .safeParse({
      businessKey: formData.get("businessKey"),
      eventType: formData.get("eventType"),
      layoutVersionId: formData.get("layoutVersionId"),
    });
  if (!form.success) return { error: "Revise layout, tipo e chave de negócio." };

  try {
    await createEsocialEvent(
      {
        businessKey: form.data.businessKey,
        environment: "restricted_production",
        eventType: form.data.eventType,
        layoutVersionId: form.data.layoutVersionId,
        payload: { evt: { checkpoint: true, businessKey: form.data.businessKey } },
        productionAuthorized: false,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao criar evento eSocial sandbox.") };
  }

  revalidatePath("/app/integrations");
  return { success: "Evento eSocial criado em restricted_production (sem envio real)." };
}

export async function registerSpoolAction(
  _state: IntegrationsFormState,
  formData: FormData,
): Promise<IntegrationsFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({
      connectorId: z.string().uuid(),
      fileName: z.string().min(1),
      monitoredFolder: z.string().min(1),
    })
    .safeParse({
      connectorId: formData.get("connectorId"),
      fileName: formData.get("fileName"),
      monitoredFolder: formData.get("monitoredFolder"),
    });
  if (!form.success) return { error: "Revise conector, pasta e arquivo." };

  const contentHash = createHash("sha256")
    .update(`${form.data.monitoredFolder}:${form.data.fileName}:${Date.now()}`)
    .digest("hex");

  try {
    await registerConnectorSpoolFile(
      {
        connectorId: form.data.connectorId,
        contentHash,
        fileName: form.data.fileName,
        monitoredFolder: form.data.monitoredFolder,
        tenantId: selectedTenantId,
      },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao registrar spool.") };
  }

  revalidatePath("/app/integrations");
  return { success: "Arquivo do spool registrado e job enfileirado." };
}

export async function requeueDeadLetterAction(
  _state: IntegrationsFormState,
  formData: FormData,
): Promise<IntegrationsFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização." };

  const form = z
    .object({ deadLetterId: z.string().uuid() })
    .safeParse({ deadLetterId: formData.get("deadLetterId") });
  if (!form.success) return { error: "Dead-letter inválida." };

  try {
    await requeueIntegrationDeadLetter(
      { deadLetterId: form.data.deadLetterId, tenantId: selectedTenantId },
      getRequestId(await headers()),
    );
  } catch (error) {
    return { error: publicError(error, "Falha ao reprocessar dead-letter.") };
  }

  revalidatePath("/app/integrations");
  return { success: "Dead-letter reenfileirada." };
}
