"use client";

import { useActionState } from "react";
import { saveDiagnosticExamAction, type DiagnosticFormState } from "./actions";

type QueueOption = { id: string; label: string };

export function DiagnosticExamForm({
  examOrderOptions = [],
}: {
  examOrderOptions?: readonly QueueOption[];
}) {
  const [state, action, pending] = useActionState(
    saveDiagnosticExamAction,
    {} as DiagnosticFormState,
  );

  return (
    <form action={action} className="mt-4 space-y-3 gp-surface p-4">
      <h3 className="font-semibold">Registrar / atualizar resultado</h3>
      {examOrderOptions.length > 0 ? (
        <label className="grid gap-1 text-sm">
          Pedido na fila
          <select className="gp-input" name="examOrderId" required>
            <option value="">Selecione</option>
            {examOrderOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input
          className="gp-input font-mono"
          name="examOrderId"
          placeholder="exam_order_id (uuid)"
          required
        />
      )}
      <select className="gp-input" defaultValue="ecg" name="modality">
        <option value="ecg">ECG</option>
        <option value="eeg">EEG</option>
        <option value="radiology">Radiologia</option>
      </select>
      <select className="gp-input" defaultValue="reported" name="status">
        <option value="prepared">prepared</option>
        <option value="executed">executed</option>
        <option value="reported">reported</option>
        <option value="validated">validated</option>
      </select>
      <textarea className="gp-input" name="report" placeholder="Laudo humano" rows={3} />
      <textarea
        className="gp-input"
        name="professionalConclusion"
        placeholder="Conclusão profissional (humana)"
        rows={2}
      />
      <input
        className="gp-input"
        defaultValue="registro inicial checkpoint"
        name="correctionReason"
        required
      />
      <button className="gp-btn gp-btn-primary" disabled={pending} type="submit">
        Salvar diagnóstico
      </button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
