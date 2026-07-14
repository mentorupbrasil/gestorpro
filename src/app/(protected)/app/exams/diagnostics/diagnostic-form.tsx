"use client";

import { useActionState } from "react";
import { saveDiagnosticExamAction, type DiagnosticFormState } from "./actions";

export function DiagnosticExamForm() {
  const [state, action, pending] = useActionState(
    saveDiagnosticExamAction,
    {} as DiagnosticFormState,
  );

  return (
    <form action={action} className="mt-6 space-y-3 rounded-2xl border border-slate-200 p-4">
      <h3 className="font-semibold">Registrar / atualizar resultado</h3>
      <input
        className="w-full rounded border px-3 py-2 text-sm font-mono"
        name="examOrderId"
        placeholder="exam_order_id (uuid)"
        required
      />
      <select className="w-full rounded border px-3 py-2 text-sm" defaultValue="ecg" name="modality">
        <option value="ecg">ECG</option>
        <option value="eeg">EEG</option>
        <option value="radiology">Radiologia</option>
      </select>
      <select className="w-full rounded border px-3 py-2 text-sm" defaultValue="reported" name="status">
        <option value="prepared">prepared</option>
        <option value="executed">executed</option>
        <option value="reported">reported</option>
        <option value="validated">validated</option>
      </select>
      <textarea
        className="w-full rounded border px-3 py-2 text-sm"
        name="report"
        placeholder="Laudo humano"
        rows={3}
      />
      <textarea
        className="w-full rounded border px-3 py-2 text-sm"
        name="professionalConclusion"
        placeholder="Conclusão profissional (humana)"
        rows={2}
      />
      <input
        className="w-full rounded border px-3 py-2 text-sm"
        defaultValue="registro inicial checkpoint"
        name="correctionReason"
        required
      />
      <button
        className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        Salvar diagnóstico
      </button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
