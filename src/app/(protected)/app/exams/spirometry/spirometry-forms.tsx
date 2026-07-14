"use client";

import { useActionState } from "react";
import {
  saveSpirometryManeuverAction,
  startSpirometryExamAction,
  type SpirometryFormState,
} from "./actions";

type Option = { id: string; name: string };
const initialState: SpirometryFormState = {};

function Feedback({ state }: Readonly<{ state: SpirometryFormState }>) {
  if (state.error) return <p className="mt-3 text-sm font-semibold text-red-700">{state.error}</p>;
  if (state.success) {
    return <p className="mt-3 text-sm font-semibold text-emerald-800">{state.success}</p>;
  }
  return null;
}

export function SpirometryForms({
  calibrations,
  orders,
  predictedSets,
  results,
}: Readonly<{
  calibrations: readonly Option[];
  orders: readonly Option[];
  predictedSets: readonly Option[];
  results: readonly Option[];
}>) {
  const [startState, startAction, startPending] = useActionState(
    startSpirometryExamAction,
    initialState,
  );
  const [saveState, saveAction, savePending] = useActionState(
    saveSpirometryManeuverAction,
    initialState,
  );

  return (
    <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <form action={startAction} className="gp-surface p-4">
        <h2 className="text-lg font-semibold">Iniciar exame</h2>
        <p className="mt-1 text-sm text-slate-600">
          Exige sessão MFA e ordem do tipo espirometria.
        </p>
        <label className="mt-4 grid gap-1 text-sm font-medium">
          Ordem de espirometria
          <select className="gp-input" name="examOrderId" required>
            <option value="">Selecione</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="mt-4 gp-btn gp-btn-primary"
          disabled={startPending || orders.length === 0}
          type="submit"
        >
          {startPending ? "Iniciando…" : "Iniciar espirometria"}
        </button>
        <Feedback state={startState} />
      </form>

      <form action={saveAction} className="gp-surface p-4">
        <h2 className="text-lg font-semibold">Registrar manobra</h2>
        <p className="mt-1 text-sm text-slate-600">
          Percentuais são calculados tecnicamente; interpretação e conclusão são exclusivamente
          humanas.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Select label="Resultado iniciado" name="resultId" options={results} />
          <Select label="Calibração válida" name="calibrationId" options={calibrations} />
          <Select
            label="Conjunto de valores previstos"
            name="predictedValueSetId"
            options={predictedSets}
          />
          <label className="grid gap-1 text-sm font-medium">
            Tentativa
            <input
              className="gp-input"
              defaultValue="1"
              min="1"
              name="attemptNumber"
              required
              type="number"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Qualidade técnica
            <select className="gp-input" name="qualityGrade" required>
              {["A", "B", "C", "D", "E", "F", "unacceptable"].map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Valores medidos JSON
            <textarea
              className="min-h-24 gp-input font-mono text-xs"
              defaultValue={JSON.stringify({ fev1: 3, fvc: 4, pef: 7 }, null, 2)}
              name="measuredValues"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Valores previstos JSON
            <textarea
              className="min-h-24 gp-input font-mono text-xs"
              defaultValue={JSON.stringify({ fev1: 4, fvc: 5, pef: 8 }, null, 2)}
              name="predictedValues"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Entradas obrigatórias JSON
            <textarea
              className="min-h-24 gp-input font-mono text-xs"
              defaultValue={JSON.stringify(
                { heightCm: null, weightKg: null, smoking: "not_informed" },
                null,
                2,
              )}
              name="requiredInputs"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Notas técnicas
            <textarea className="gp-input" name="technicalNotes" />
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Conclusão profissional humana
            <textarea className="gp-input" name="professionalConclusion" />
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Motivo da versão/correção
            <input className="gp-input" name="correctionReason" required />
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Motivo de inconclusão
            <textarea className="gp-input" name="inconclusiveReason" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="acceptManeuver" type="checkbox" /> Manobra aceita tecnicamente
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="completeResult" type="checkbox" /> Concluir exame
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="inconclusiveResult" type="checkbox" /> Marcar inconclusivo
          </label>
        </div>
        <button
          className="mt-4 gp-btn gp-btn-primary"
          disabled={
            savePending ||
            results.length === 0 ||
            calibrations.length === 0 ||
            predictedSets.length === 0
          }
          type="submit"
        >
          {savePending ? "Salvando…" : "Salvar manobra"}
        </button>
        <Feedback state={saveState} />
      </form>
    </section>
  );
}

function Select({
  label,
  name,
  options,
}: Readonly<{ label: string; name: string; options: readonly Option[] }>) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select className="gp-input" name={name} required>
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
