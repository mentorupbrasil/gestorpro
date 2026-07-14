"use client";

import { useActionState } from "react";
import {
  acknowledgeClinicalAlertAction,
  createClinicalAlertAction,
  createConsultationAddendumAction,
  pauseEncounterFlowAction,
  resolveEncounterFlowPauseAction,
  type ClinicalFlowFormState,
} from "./actions";

type AlertRow = {
  id: string;
  message: string;
  severity: string;
  status: string;
};

type PauseRow = {
  id: string;
  reason: string;
  status: string;
};

type ClinicalFlowPanelProps = {
  alerts: AlertRow[];
  consultationId: string | null;
  encounterId: string | null;
  pauses: PauseRow[];
};

function Feedback({ state }: { state: ClinicalFlowFormState }) {
  if (state.error) return <p className="mt-2 text-sm text-red-700">{state.error}</p>;
  if (state.success) return <p className="mt-2 text-sm text-emerald-700">{state.success}</p>;
  return null;
}

export function ClinicalFlowPanel({
  alerts,
  consultationId,
  encounterId,
  pauses,
}: ClinicalFlowPanelProps) {
  const [alertState, createAlert, alertPending] = useActionState(
    createClinicalAlertAction,
    {} as ClinicalFlowFormState,
  );
  const [ackState, acknowledgeAlert, ackPending] = useActionState(
    acknowledgeClinicalAlertAction,
    {} as ClinicalFlowFormState,
  );
  const [addendumState, createAddendum, addendumPending] = useActionState(
    createConsultationAddendumAction,
    {} as ClinicalFlowFormState,
  );
  const [pauseState, pauseFlow, pausePending] = useActionState(
    pauseEncounterFlowAction,
    {} as ClinicalFlowFormState,
  );
  const [resolveState, resolvePause, resolvePending] = useActionState(
    resolveEncounterFlowPauseAction,
    {} as ClinicalFlowFormState,
  );

  if (!encounterId) {
    return (
      <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-lg font-semibold">Fluxo clínico (Fase G)</h2>
        <p className="mt-2 text-sm text-slate-600">
          Selecione um atendimento na fila para alertas, pausa e adendo.
        </p>
      </section>
    );
  }

  const activePause = pauses.find((pause) => pause.status === "active");

  return (
    <section className="mt-10 space-y-6 rounded-2xl border border-slate-200 p-5">
      <header>
        <h2 className="text-lg font-semibold">Fluxo clínico (Fase G)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Alertas auxiliares, intercorrência e adendo. Aptidão continua sendo decisão humana.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={createAlert} className="space-y-3 rounded-xl border border-slate-100 p-4">
          <h3 className="font-medium">Novo alerta</h3>
          <input name="encounterId" type="hidden" value={encounterId} />
          <select
            className="w-full rounded border px-3 py-2 text-sm"
            defaultValue="attention"
            name="severity"
          >
            <option value="info">info</option>
            <option value="attention">attention</option>
            <option value="urgent">urgent</option>
          </select>
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            name="message"
            placeholder="Mensagem do alerta"
            required
            rows={3}
          />
          <button
            className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={alertPending}
            type="submit"
          >
            Criar alerta
          </button>
          <Feedback state={alertState} />
        </form>

        <form action={pauseFlow} className="space-y-3 rounded-xl border border-slate-100 p-4">
          <h3 className="font-medium">Pausa / intercorrência</h3>
          <input name="encounterId" type="hidden" value={encounterId} />
          {activePause ? (
            <p className="text-sm text-amber-800">Fluxo pausado: {activePause.reason}</p>
          ) : (
            <>
              <textarea
                className="w-full rounded border px-3 py-2 text-sm"
                name="reason"
                placeholder="Motivo da pausa"
                required
                rows={3}
              />
              <button
                className="rounded bg-amber-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={pausePending}
                type="submit"
              >
                Pausar fluxo
              </button>
            </>
          )}
          <Feedback state={pauseState} />
        </form>
      </div>

      {activePause ? (
        <form action={resolvePause} className="space-y-3 rounded-xl border border-slate-100 p-4">
          <h3 className="font-medium">Retomar fluxo</h3>
          <input name="pauseId" type="hidden" value={activePause.id} />
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            name="resolvedNote"
            placeholder="Nota de resolução (opcional)"
            rows={2}
          />
          <button
            className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={resolvePending}
            type="submit"
          >
            Resolver pausa
          </button>
          <Feedback state={resolveState} />
        </form>
      ) : null}

      <div className="rounded-xl border border-slate-100 p-4">
        <h3 className="font-medium">Alertas abertos</h3>
        {alerts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Nenhum alerta neste atendimento.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {alerts.map((alert) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={alert.id}>
                <span>
                  <strong className="uppercase">{alert.severity}</strong> · {alert.message} ·{" "}
                  {alert.status}
                </span>
                {alert.status === "open" ? (
                  <form action={acknowledgeAlert}>
                    <input name="alertId" type="hidden" value={alert.id} />
                    <button
                      className="rounded border px-2 py-1 text-xs disabled:opacity-60"
                      disabled={ackPending}
                      type="submit"
                    >
                      Reconhecer
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <Feedback state={ackState} />
      </div>

      {consultationId ? (
        <form action={createAddendum} className="space-y-3 rounded-xl border border-slate-100 p-4">
          <h3 className="font-medium">Adendo de consulta</h3>
          <input name="consultationId" type="hidden" value={consultationId} />
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            name="reason"
            placeholder="Motivo do adendo"
            required
          />
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            name="note"
            placeholder="Nota adicional"
            required
            rows={3}
          />
          <button
            className="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={addendumPending}
            type="submit"
          >
            Registrar adendo
          </button>
          <Feedback state={addendumState} />
        </form>
      ) : null}
    </section>
  );
}
