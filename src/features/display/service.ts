import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createCallEventSchema,
  createDisplayPanelSchema,
  type CreateCallEventInput,
  type CreateDisplayPanelInput,
} from "./schemas";

export async function createDisplayPanel(input: CreateDisplayPanelInput) {
  const parsed = createDisplayPanelSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "display.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_panels")
    .upsert(
      {
        channel_name: parsed.channelName,
        clinic_unit_id: parsed.clinicUnitId,
        code: parsed.code,
        name: parsed.name,
        status: "active",
        tenant_id: context.tenantId,
      },
      { onConflict: "tenant_id,clinic_unit_id,code" },
    )
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar o painel.", {
      cause: error,
      status: 500,
    });
  }

  return data.id as string;
}

export async function createCallEvent(input: CreateCallEventInput, requestId: string) {
  const parsed = createCallEventSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "display.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_call_event", {
    audit_request_id: requestId,
    call_action: parsed.action,
    target_display_panel_id: parsed.displayPanelId,
    target_queue_ticket_id: parsed.queueTicketId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar a chamada.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
