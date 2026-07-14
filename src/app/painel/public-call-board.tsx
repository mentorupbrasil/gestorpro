"use client";

import { useEffect, useRef, useState } from "react";

type PublicState = {
  activeCall?: {
    action: string;
    callEventId: string;
    createdAt: string;
    payload: Record<string, unknown>;
  } | null;
  panelName: string;
  recentCalls: Array<{
    createdAt: string;
    room?: string | null | undefined;
    ticketCode?: string | null | undefined;
  }>;
};

export function PublicCallBoard({
  deviceToken,
  initialState,
  sessionId,
}: {
  deviceToken: string;
  initialState: PublicState;
  sessionId: string;
}) {
  const [state, setState] = useState(initialState);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const lastSpoken = useRef<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/display/state", {
          body: JSON.stringify({ deviceToken, sessionId }),
          headers: { "content-type": "application/json" },
          method: "POST",
        });
        if (!response.ok) return;
        const next = (await response.json()) as PublicState & { ok: boolean };
        setState(next);

        const voiceText = String(next.activeCall?.payload?.voiceText ?? "");
        const callId = next.activeCall?.callEventId ?? null;
        if (voiceEnabled && voiceText && callId && callId !== lastSpoken.current) {
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
        // reconciliação periódica; falha pontual não derruba o painel
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [deviceToken, sessionId, voiceEnabled]);

  const ticketCode = String(state.activeCall?.payload?.ticketCode ?? "—");
  const room = String(state.activeCall?.payload?.room ?? "Atendimento");

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/50">Painel de chamadas</p>
          <h1 className="text-2xl font-semibold">{state.panelName}</h1>
        </div>
        <button
          className="rounded border border-white/20 px-3 py-1.5 text-sm"
          onClick={() => setVoiceEnabled((value) => !value)}
          type="button"
        >
          Voz {voiceEnabled ? "on" : "off"}
        </button>
      </header>

      <main className="grid gap-6 px-6 py-10 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300/80">Chamada ativa</p>
          <p className="mt-6 text-7xl font-bold tracking-tight">{ticketCode}</p>
          <p className="mt-4 text-3xl text-white/80">{room}</p>
          {!state.activeCall ? (
            <p className="mt-8 text-lg text-white/50">Aguardando próxima chamada…</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-medium text-white/80">Últimas chamadas</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {state.recentCalls.length === 0 ? (
              <li className="text-white/50">Sem histórico recente.</li>
            ) : (
              state.recentCalls.map((call) => (
                <li
                  className="flex items-center justify-between border-b border-white/10 pb-2"
                  key={`${call.ticketCode}-${call.createdAt}`}
                >
                  <span className="font-semibold">{call.ticketCode ?? "—"}</span>
                  <span className="text-white/50">{call.room ?? ""}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
