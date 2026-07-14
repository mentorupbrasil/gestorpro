import "server-only";

import { requireAal2, requireTenantOrUnitPermission } from "@/core/auth/authorization";
import {
  requirePermissionOnClinicUnitRow,
  requirePermissionOnQueueTicket,
} from "@/core/auth/unit-scope";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createCallEventSchema,
  createDisplayPanelSchema,
  type CreateCallEventInput,
  type CreateDisplayPanelInput,
} from "./schemas";

export async function createDisplayPanel(input: CreateDisplayPanelInput, requestId: string) {
  const parsed = createDisplayPanelSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireTenantOrUnitPermission(context, "display.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  await requirePermissionOnClinicUnitRow(supabase, context, parsed.clinicUnitId, "display.manage");

  const { data, error } = await supabase.rpc("upsert_display_panel", {
    audit_request_id: requestId,
    channel_name_value: parsed.channelName,
    code_value: parsed.code,
    name_value: parsed.name,
    target_clinic_unit_id: parsed.clinicUnitId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar o painel.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createCallEvent(input: CreateCallEventInput, requestId: string) {
  const parsed = createCallEventSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireTenantOrUnitPermission(context, "display.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  await requirePermissionOnQueueTicket(supabase, context, parsed.queueTicketId, "display.manage");

  const { data, error } = await supabase.rpc("create_call_event", {
    audit_request_id: requestId,
    call_action: parsed.action,
    target_display_panel_id: parsed.displayPanelId,
    target_queue_ticket_id: parsed.queueTicketId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    const message = error?.message ?? "";
    if (/already being called/i.test(message)) {
      throw new AppError("VALIDATION_FAILED", "Paciente já está sendo chamado por outra sala.", {
        cause: error,
        status: 409,
      });
    }
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar a chamada.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
