"use client";

import { useEffect, useRef, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type PublicState = {
  activeCall?: {
    action: string;
    callEventId: string;
    createdAt: string;
    payload: Record<string, unknown>;
  } | null;
  channelName?: string;
  panelName: string;
  recentCalls: Array<{
    createdAt: string;
    room?: string | null | undefined;
    ticketCode?: string | null | undefined;
  }>;
};

export function PublicCallBoard({
  channelName,
  deviceToken,
  initialState,
  sessionId,
}: {
  channelName: string;
  deviceToken: string;
  initialState: PublicState;
  sessionId: string;
}) {
  const [state, setState] = useState(initialState);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [linkMode, setLinkMode] = useState<"realtime" | "poll">("poll");
  const lastSpoken = useRef<string | null>(null);
  const voiceEnabledRef = useRef(voiceEnabled);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  useEffect(() => {
    let cancelled = false;

    async function refreshState() {
      try {
        const response = await fetch("/api/display/state", {
          body: JSON.stringify({ deviceToken, sessionId }),
          headers: { "content-type": "application/json" },
          method: "POST",
        });
        if (!response.ok || cancelled) return;
        const next = (await response.json()) as PublicState & { ok: boolean };
        setState(next);

        const voiceText = String(next.activeCall?.payload?.voiceText ?? "");
        const callId = next.activeCall?.callEventId ?? null;
        if (voiceEnabledRef.current && voiceText && callId && callId !== lastSpoken.current) {
          lastSpoken.current = callId;
          if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(voiceText);
            utterance.lang = "pt-BR";
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          }
          void fetch("/api/display/ack", {
            body: JSON.stringify({
              ackKind: "displayed",
              callEventId: callId,
              deviceToken,
              sessionId,
            }),
            headers: { "content-type": "application/json" },
            method: "POST",
          });
        }
      } catch {
        // reconciliação periódica
      }
    }

    void refreshState();

    const supabase = getBrowserSupabaseClient();
    let subscribed = false;
    const channel = supabase
      .channel(`display:${channelName}`)
      .on("broadcast", { event: "call_updated" }, () => {
        void refreshState();
      })
      .subscribe((status: string) => {
        subscribed = status === "SUBSCRIBED";
        if (!cancelled) setLinkMode(subscribed ? "realtime" : "poll");
      });

    const pollTimer = window.setInterval(() => {
      void refreshState();
    }, 8_000);

    const heartbeatTimer = window.setInterval(() => {
      void fetch("/api/display/heartbeat", {
        body: JSON.stringify({ deviceToken, sessionId }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
    }, 20_000);

    return () => {
      cancelled = true;
      window.clearInterval(pollTimer);
      window.clearInterval(heartbeatTimer);
      void supabase.removeChannel(channel);
    };
  }, [channelName, deviceToken, sessionId]);

  const ticketCode = String(state.activeCall?.payload?.ticketCode ?? "—");
  const room = String(state.activeCall?.payload?.room ?? "Atendimento");

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/50">Painel de chamadas</p>
          <h1 className="text-2xl font-semibold">{state.panelName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40">
            {linkMode === "realtime" ? "Realtime" : "Poll"}
          </span>
          <button
            className="rounded border border-white/20 px-3 py-1.5 text-sm"
            onClick={() => setVoiceEnabled((value) => !value)}
            type="button"
          >
            Voz {voiceEnabled ? "on" : "off"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-16 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">Chamada atual</p>
        <p className="text-7xl font-semibold tracking-tight">{ticketCode}</p>
        <p className="text-3xl text-white/80">{room}</p>
      </main>

      <section className="border-t border-white/10 px-6 py-6">
        <h2 className="mb-3 text-sm uppercase tracking-wide text-white/50">Recentes</h2>
        <ul className="grid gap-2 text-left text-sm text-white/80 md:grid-cols-3">
          {state.recentCalls.map((call) => (
            <li
              className="rounded border border-white/10 px-3 py-2"
              key={`${call.createdAt}-${call.ticketCode}`}
            >
              <span className="font-medium">{call.ticketCode ?? "—"}</span>
              <span className="mx-2 text-white/40">·</span>
              <span>{call.room ?? "Sala"}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
