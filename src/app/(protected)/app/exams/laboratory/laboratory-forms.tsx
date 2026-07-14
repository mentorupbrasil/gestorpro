"use client";

import { useActionState } from "react";
import {
  recordLaboratorySampleAction,
  saveLaboratoryResultAction,
  type LaboratoryFormState,
} from "./actions";

export function LaboratoryForms() {
  const [sampleState, sampleAction, samplePending] = useActionState(
    recordLaboratorySampleAction,
    {} as LaboratoryFormState,
  );
  const [resultState, resultAction, resultPending] = useActionState(
    saveLaboratoryResultAction,
    {} as LaboratoryFormState,
  );

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <form action={sampleAction} className="space-y-3 rounded-2xl border border-slate-200 p-4">
        <h3 className="font-semibold">Evento de amostra</h3>
        <input
          className="w-full rounded border px-3 py-2 text-sm font-mono"
          name="sampleId"
          placeholder="laboratory_sample_id"
          required
        />
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="collected"
          name="eventType"
        >
          <option value="collected">collected</option>
          <option value="received">received</option>
          <option value="processing_started">processing_started</option>
          <option value="disposed">disposed</option>
          <option value="cancelled">cancelled</option>
          <option value="corrected">corrected</option>
        </select>
        <button
          className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={samplePending}
          type="submit"
        >
          Registrar evento
        </button>
        {sampleState.error ? <p className="text-sm text-red-700">{sampleState.error}</p> : null}
        {sampleState.success ? (
          <p className="text-sm text-emerald-700">{sampleState.success}</p>
        ) : null}
      </form>

      <form action={resultAction} className="space-y-3 rounded-2xl border border-slate-200 p-4">
        <h3 className="font-semibold">Resultado laboratorial</h3>
        <input
          className="w-full rounded border px-3 py-2 text-sm font-mono"
          name="orderItemId"
          placeholder="laboratory_order_item_id"
          required
        />
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          name="resultValue"
          placeholder="Valor"
          required
        />
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="resulted"
          name="status"
        >
          <option value="resulted">resulted</option>
          <option value="reviewed">reviewed</option>
          <option value="released">released</option>
          <option value="repeated">repeated</option>
          <option value="cancelled">cancelled</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input name="criticalFlag" type="checkbox" /> Crítico
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="criticalConfirmed" type="checkbox" /> Crítico confirmado
        </label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="registro inicial checkpoint"
          name="correctionReason"
          required
        />
        <button
          className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={resultPending}
          type="submit"
        >
          Salvar resultado
        </button>
        {resultState.error ? <p className="text-sm text-red-700">{resultState.error}</p> : null}
        {resultState.success ? (
          <p className="text-sm text-emerald-700">{resultState.success}</p>
        ) : null}
      </form>
    </div>
  );
}
