"use client";

import { useActionState } from "react";
import {
  saveAudiometryResultAction,
  startAudiometryExamAction,
  type AudiometryFormState,
} from "./actions";

type Option = { id: string; name: string };
const initialState: AudiometryFormState = {};

function Feedback({ state }: { state: AudiometryFormState }) {
  if (state.error) return <p className="mt-3 text-sm font-semibold text-red-700">{state.error}</p>;
  if (state.success) {
    return <p className="mt-3 text-sm font-semibold text-emerald-800">{state.success}</p>;
  }

  return null;
}

export function AudiometryForms({
  calibrations,
  orders,
  results,
}: {
  calibrations: readonly Option[];
  orders: readonly Option[];
  results: readonly Option[];
}) {
  const [startState, startAction, startPending] = useActionState(
    startAudiometryExamAction,
    initialState,
  );
  const [saveState, saveAction, savePending] = useActionState(
    saveAudiometryResultAction,
    initialState,
  );

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <form action={startAction} className="rounded border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Iniciar audiometria</h2>
        <label className="mt-4 grid gap-1 text-sm">
          Ordem de exame
          <select className="rounded border border-slate-300 px-3 py-2" name="examOrderId" required>
            <option value="">Selecione</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="mt-4 rounded bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={startPending}
          type="submit"
        >
          Iniciar
        </button>
        <Feedback state={startState} />
      </form>

      <form action={saveAction} className="rounded border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Resultado audiométrico</h2>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            Resultado iniciado
            <select className="rounded border border-slate-300 px-3 py-2" name="resultId" required>
              <option value="">Selecione</option>
              {results.map((result) => (
                <option key={result.id} value={result.id}>
                  {result.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Calibração
            <select
              className="rounded border border-slate-300 px-3 py-2"
              name="calibrationId"
              required
            >
              <option value="">Selecione</option>
              {calibrations.map((calibration) => (
                <option key={calibration.id} value={calibration.id}>
                  {calibration.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Repouso auditivo informado (horas)
            <input className="rounded border border-slate-300 px-3 py-2" name="restHours" />
          </label>
          <label className="grid gap-1 text-sm">
            Dados ocupacionais JSON
            <textarea
              className="min-h-24 rounded border border-slate-300 px-3 py-2 font-mono text-xs"
              name="occupationalData"
              defaultValue={JSON.stringify({ noiseExposure: "", ppeUse: "" }, null, 2)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Limiares JSON
            <textarea
              className="min-h-32 rounded border border-slate-300 px-3 py-2 font-mono text-xs"
              name="thresholds"
              defaultValue={JSON.stringify(
                {
                  left: { "500": 10, "1000": 15, "2000": 10 },
                  right: { "500": 5, "1000": 10, "2000": 10 },
                },
                null,
                2,
              )}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Equipamento JSON
            <textarea
              className="min-h-20 rounded border border-slate-300 px-3 py-2 font-mono text-xs"
              name="equipment"
              defaultValue={JSON.stringify({ audiometer: "", serial: "" }, null, 2)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Cabine JSON
            <textarea
              className="min-h-20 rounded border border-slate-300 px-3 py-2 font-mono text-xs"
              name="booth"
              defaultValue={JSON.stringify({ type: "", noiseLevel: "" }, null, 2)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Laudo/relato
            <textarea className="rounded border border-slate-300 px-3 py-2" name="report" />
          </label>
          <label className="grid gap-1 text-sm">
            Conclusão profissional
            <textarea
              className="rounded border border-slate-300 px-3 py-2"
              name="professionalConclusion"
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            Motivo da versão/correção
            <input
              className="rounded border border-slate-300 px-3 py-2"
              name="correctionReason"
              required
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="completeResult" type="checkbox" /> Concluir exame
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="inconclusiveResult" type="checkbox" /> Marcar inconclusivo
          </label>
        </div>
        <button
          className="mt-4 rounded bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={savePending}
          type="submit"
        >
          Salvar versão
        </button>
        <Feedback state={saveState} />
      </form>
    </section>
  );
}
