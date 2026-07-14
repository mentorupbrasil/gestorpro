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
      <form action={sampleAction} className="space-y-3 gp-surface p-4">
        <h3 className="font-semibold">Evento de amostra</h3>
        <input
          className="gp-input font-mono"
          name="sampleId"
          placeholder="laboratory_sample_id"
          required
        />
        <select className="gp-input" defaultValue="collected" name="eventType">
          <option value="collected">collected</option>
          <option value="received">received</option>
          <option value="processing_started">processing_started</option>
          <option value="disposed">disposed</option>
          <option value="cancelled">cancelled</option>
          <option value="corrected">corrected</option>
        </select>
        <button className="gp-btn gp-btn-primary" disabled={samplePending} type="submit">
          Registrar evento
        </button>
        {sampleState.error ? <p className="text-sm text-red-700">{sampleState.error}</p> : null}
        {sampleState.success ? (
          <p className="text-sm text-emerald-700">{sampleState.success}</p>
        ) : null}
      </form>

      <form action={resultAction} className="space-y-3 gp-surface p-4">
        <h3 className="font-semibold">Resultado laboratorial</h3>
        <input
          className="gp-input font-mono"
          name="orderItemId"
          placeholder="laboratory_order_item_id"
          required
        />
        <input className="gp-input" name="resultValue" placeholder="Valor" required />
        <select className="gp-input" defaultValue="resulted" name="status">
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
          className="gp-input"
          defaultValue="registro inicial checkpoint"
          name="correctionReason"
          required
        />
        <button className="gp-btn gp-btn-primary" disabled={resultPending} type="submit">
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
