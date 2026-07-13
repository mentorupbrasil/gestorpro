"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { createCallEvent, createDisplayPanel } from "@/features/display/service";
import { getRequestId } from "@/lib/http/request-id";

export type DisplayFormState = { error?: string; success?: string };

const panelFormSchema = z.object({
  channelName: z.string(),
  clinicUnitId: z.string(),
  code: z.string(),
  name: z.string(),
});

const callFormSchema = z.object({
  action: z.enum(["call", "recall", "arrived", "start", "return", "no_show", "redirect"]),
  displayPanelId: z.string(),
  queueTicketId: z.string(),
});

function publicError(error: unknown, fallback: string) {
  if (error instanceof AppError && error.code === "MFA_REQUIRED") {
    return "Confirme o MFA antes de gerenciar chamadas.";
  }

  return fallback;
}

export async function createDisplayPanelAction(
  _state: DisplayFormState,
  formData: FormData,
): Promise<DisplayFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };
  const form = panelFormSchema.safeParse({
    channelName: formData.get("channelName"),
    clinicUnitId: formData.get("clinicUnitId"),
    code: formData.get("code"),
    name: formData.get("name"),
  });
  if (!form.success) return { error: "Revise unidade, código, nome e canal." };

  try {
    await createDisplayPanel({ ...form.data, tenantId: selectedTenantId });
  } catch (error) {
    return { error: publicError(error, "Não foi possível criar o painel.") };
  }

  revalidatePath("/app/display");
  return { success: "Painel criado com canal privado." };
}

export async function createCallEventAction(
  _state: DisplayFormState,
  formData: FormData,
): Promise<DisplayFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };
  const form = callFormSchema.safeParse({
    action: formData.get("action"),
    displayPanelId: formData.get("displayPanelId"),
    queueTicketId: formData.get("queueTicketId"),
  });
  if (!form.success) return { error: "Revise painel, ticket e ação." };

  const requestId = getRequestId(await headers());
  try {
    await createCallEvent({ ...form.data, tenantId: selectedTenantId }, requestId);
  } catch (error) {
    return { error: publicError(error, "Não foi possível chamar o ticket.") };
  }

  revalidatePath("/app/display");
  return { success: "Chamada persistida para o painel." };
}
