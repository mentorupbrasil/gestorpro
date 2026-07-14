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

  try {
    const sessionId = await registerDisplaySession(token, label);
    const state = await loadDisplayPublicState(token);
    return (
      <PublicCallBoard
        deviceToken={token}
        initialState={{
          activeCall: state.activeCall ?? null,
          panelName: state.panelName,
          recentCalls: state.recentCalls,
        }}
        sessionId={sessionId}
      />
    );
  } catch {
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
}
