import { PublicCallBoard } from "./public-call-board";
import { loadDisplayPublicState, registerDisplaySession } from "@/features/display/device-public";

type Props = {
  searchParams?: Promise<{ token?: string; label?: string }>;
};

export default async function PublicPanelPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const token = params?.token?.trim() ?? "";
  const label = params?.label?.trim() || "Painel público";

  if (token.length < 24) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0b1220] px-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Painel de chamadas</h1>
          <p className="mt-3 text-white/70">
            Informe um token de dispositivo válido em <code>?token=</code> (mín. 24 caracteres).
          </p>
        </div>
      </main>
    );
  }

  let sessionId: string | null = null;
  let panelName = "";
  let channelName = "panel";
  let recentCalls: Array<{ createdAt: string; room: string | null; ticketCode: string | null }> =
    [];
  let activeCall: {
    action: string;
    callEventId: string;
    createdAt: string;
    payload: Record<string, unknown>;
  } | null = null;
  let authError = false;

  try {
    sessionId = await registerDisplaySession(token, label);
    const state = await loadDisplayPublicState(token);
    panelName = state.panelName;
    channelName = state.channelName;
    activeCall = state.activeCall ?? null;
    recentCalls = state.recentCalls.map((call) => ({
      createdAt: call.createdAt,
      room: call.room ?? null,
      ticketCode: call.ticketCode ?? null,
    }));
  } catch {
    authError = true;
  }

  if (authError || !sessionId) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0b1220] px-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Dispositivo não autorizado</h1>
          <p className="mt-3 text-white/70">
            Token inválido ou painel inativo. Solicite novo token na estação autenticada.
          </p>
        </div>
      </main>
    );
  }

  return (
    <PublicCallBoard
      channelName={channelName}
      deviceToken={token}
      initialState={{
        activeCall,
        channelName,
        panelName,
        recentCalls,
      }}
      sessionId={sessionId}
    />
  );
}
