import "server-only";

import { createClient } from "@supabase/supabase-js";
import { AppError } from "@/core/errors/app-error";
import { z } from "zod";

function createDeviceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new AppError("INTERNAL_ERROR", "Supabase público não configurado.", { status: 500 });
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function registerDisplaySession(deviceToken: string, deviceLabel: string) {
  const supabase = createDeviceSupabaseClient();
  const { data, error } = await supabase.rpc("register_display_panel_session", {
    device_label_value: deviceLabel,
    device_token_value: deviceToken,
  });
  if (error || typeof data !== "string") {
    throw new AppError("AUTHENTICATION_REQUIRED", "Token de dispositivo inválido.", {
      cause: error,
      status: 401,
    });
  }
  return data;
}

export async function heartbeatDisplaySession(deviceToken: string, sessionId: string) {
  const supabase = createDeviceSupabaseClient();
  const { error } = await supabase.rpc("heartbeat_display_panel_session", {
    device_token_value: deviceToken,
    target_session_id: sessionId,
  });
  if (error) {
    throw new AppError("INTERNAL_ERROR", "Falha no heartbeat do painel.", {
      cause: error,
      status: 500,
    });
  }
}

export async function loadDisplayPublicState(deviceToken: string) {
  const supabase = createDeviceSupabaseClient();
  const { data, error } = await supabase.rpc("get_display_panel_public_state", {
    device_token_value: deviceToken,
  });
  if (error || !data) {
    throw new AppError("AUTHENTICATION_REQUIRED", "Painel indisponível.", {
      cause: error,
      status: 401,
    });
  }
  return z
    .object({
      activeCall: z
        .object({
          action: z.string(),
          callEventId: z.string(),
          createdAt: z.string(),
          payload: z.record(z.string(), z.unknown()),
        })
        .nullable()
        .optional(),
      channelName: z.string(),
      panelName: z.string(),
      privacyMode: z.string(),
      recentCalls: z.array(
        z.object({
          createdAt: z.string(),
          room: z.string().nullable().optional(),
          ticketCode: z.string().nullable().optional(),
        }),
      ),
      serverTime: z.string(),
    })
    .parse(data);
}

export async function acknowledgeDisplayCall(input: {
  ackKind: "delivered" | "acknowledged" | "displayed";
  callEventId: string;
  deviceToken: string;
  sessionId: string;
}) {
  const supabase = createDeviceSupabaseClient();
  const { error } = await supabase.rpc("acknowledge_call_delivery", {
    ack_kind: input.ackKind,
    device_token_value: input.deviceToken,
    target_call_event_id: input.callEventId,
    target_session_id: input.sessionId,
  });
  if (error) {
    throw new AppError("INTERNAL_ERROR", "Falha ao confirmar chamada no painel.", {
      cause: error,
      status: 500,
    });
  }
}
