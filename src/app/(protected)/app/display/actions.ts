"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import {
  createCallEvent,
  createDisplayPanel,
  revokeDisplayPanel,
} from "@/features/display/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRequestId } from "@/lib/http/request-id";
import { randomBytes } from "node:crypto";

export type DisplayFormState = { error?: string; success?: string; deviceToken?: string };

const panelFormSchema = z.object({
  channelName: z.string(),
  clinicUnitId: z.string(),
  code: z.string(),
  name: z.string(),
});

const callFormSchema = z.object({
  action: z.enum(["call", "recall", "arrived", "start", "return", "no_show", "redirect"]),
  displayPanelId: z.string().uuid(),
  expectedVersion: z.coerce.number().int().positive().optional(),
  queueTicketId: z.string().uuid(),
  redirectPanelId: z.string().uuid().optional(),
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
    const requestId = getRequestId(await headers());
    const panelId = await createDisplayPanel(
      { ...form.data, tenantId: selectedTenantId },
      requestId,
    );
    const deviceToken = randomBytes(24).toString("base64url");
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("issue_display_panel_device_token", {
      audit_request_id: requestId,
      plain_token_value: deviceToken,
      target_display_panel_id: panelId,
      target_tenant_id: selectedTenantId,
    });
    if (error) {
      return {
        error: publicError(error, "Painel criado, mas falhou emissão do token do dispositivo."),
      };
    }
    revalidatePath("/app/display");
    return {
      deviceToken,
      success: `Painel criado. URL pública: /painel?token=${deviceToken}`,
    };
  } catch (error) {
    return { error: publicError(error, "Não foi possível criar o painel.") };
  }
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
    expectedVersion: formData.get("expectedVersion") || undefined,
    queueTicketId: formData.get("queueTicketId"),
    redirectPanelId: formData.get("redirectPanelId") || undefined,
  });
  if (!form.success) return { error: "Revise painel, ticket, ação, versão e destino." };

  const requestId = getRequestId(await headers());
  try {
    await createCallEvent(
      {
        action: form.data.action,
        displayPanelId: form.data.displayPanelId,
        queueTicketId: form.data.queueTicketId,
        tenantId: selectedTenantId,
        ...(form.data.expectedVersion != null
          ? { expectedVersion: form.data.expectedVersion }
          : {}),
        ...(form.data.redirectPanelId ? { redirectPanelId: form.data.redirectPanelId } : {}),
      },
      requestId,
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível chamar o ticket.") };
  }

  revalidatePath("/app/display");
  return { success: "Chamada persistida para o painel." };
}

export async function revokeDisplayPanelAction(
  _state: DisplayFormState,
  formData: FormData,
): Promise<DisplayFormState> {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) return { error: "Selecione uma organização antes de continuar." };
  const displayPanelId = z.string().uuid().safeParse(formData.get("displayPanelId"));
  if (!displayPanelId.success) return { error: "Selecione um painel válido para revogar." };

  const requestId = getRequestId(await headers());
  try {
    await revokeDisplayPanel(
      { displayPanelId: displayPanelId.data, tenantId: selectedTenantId },
      requestId,
    );
  } catch (error) {
    return { error: publicError(error, "Não foi possível revogar o painel.") };
  }

  revalidatePath("/app/display");
  return { success: "Painel revogado e token invalidado." };
}
