"use client";

import { useActionState } from "react";
import {
  saveVisualAcuityResultAction,
  startVisualAcuityExamAction,
  type VisualAcuityFormState,
} from "./actions";

type Option = { id: string; name: string };

const initialState: VisualAcuityFormState = {};

function Feedback({ state }: { state: VisualAcuityFormState }) {
  if (state.error) return <p className="mt-3 text-sm font-semibold text-red-700">{state.error}</p>;
  if (state.success) {
    return <p className="mt-3 text-sm font-semibold text-emerald-800">{state.success}</p>;
  }

  return null;
}

export function VisualAcuityForms({
  orders,
  results,
}: {
  orders: readonly Option[];
  results: readonly Option[];
}) {
  const [startState, startAction, startPending] = useActionState(
    startVisualAcuityExamAction,
    initialState,
  );
  const [saveState, saveAction, savePending] = useActionState(
    saveVisualAcuityResultAction,
    initialState,
  );

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <form action={startAction} className="rounded border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Iniciar exame</h2>
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
          Iniciar acuidade
        </button>
        <Feedback state={startState} />
      </form>

      <form action={saveAction} className="rounded border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Resultado versionado</h2>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            Exame iniciado
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
            Resultado JSON
            <textarea
              className="min-h-44 rounded border border-slate-300 px-3 py-2 font-mono text-xs"
              name="payload"
              required
              defaultValue={JSON.stringify(
                {
                  binocular: { farWithCorrection: "20/20", nearWithCorrection: "20/25" },
                  leftEye: { farWithCorrection: "20/25", nearWithCorrection: "20/25" },
                  rightEye: { farWithCorrection: "20/20", nearWithCorrection: "20/20" },
                },
                null,
                2,
              )}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Condições do teste JSON
            <textarea
              className="min-h-24 rounded border border-slate-300 px-3 py-2 font-mono text-xs"
              name="testConditions"
              required
              defaultValue={JSON.stringify(
                { distanceMeters: 6, lighting: "adequada", correctionUsed: true },
                null,
                2,
              )}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Equipamento
            <input className="rounded border border-slate-300 px-3 py-2" name="equipmentName" />
          </label>
          <label className="grid gap-1 text-sm">
            Tabela
            <input className="rounded border border-slate-300 px-3 py-2" name="chartType" />
          </label>
          <label className="grid gap-1 text-sm">
            Observações
            <textarea className="rounded border border-slate-300 px-3 py-2" name="observations" />
          </label>
          <label className="grid gap-1 text-sm">
            Conclusão profissional do exame
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
            <input name="completeResult" type="checkbox" /> Concluir etapa do exame
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
