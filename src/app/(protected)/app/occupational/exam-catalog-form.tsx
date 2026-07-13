"use client";

import { useActionState } from "react";
import { createExamCatalogItemAction, type OccupationalFormState } from "./actions";

const initialState: OccupationalFormState = {};

export function ExamCatalogForm() {
  const [state, action, pending] = useActionState(createExamCatalogItemAction, initialState);

  return (
    <form action={action} className="grid gap-4 border-t border-slate-200 pt-5">
      <h2 className="text-lg font-semibold">Novo exame no catálogo</h2>
      <div className="grid gap-4 md:grid-cols-[10rem_1fr_14rem]">
        <label className="grid gap-1 text-sm font-medium">
          Código
          <input
            className="rounded border border-slate-300 px-3 py-2 uppercase"
            name="code"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Nome
          <input className="rounded border border-slate-300 px-3 py-2" name="name" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Tipo
          <select className="rounded border border-slate-300 px-3 py-2" name="resultType" required>
            <option value="clinical">Clínico</option>
            <option value="laboratory">Laboratório</option>
            <option value="imaging">Imagem</option>
            <option value="audiometry">Audiometria</option>
            <option value="spirometry">Espirometria</option>
            <option value="other">Outro</option>
          </select>
        </label>
      </div>
      <button
        className="w-fit rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Criando…" : "Criar exame"}
      </button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-800">{state.success}</p> : null}
    </form>
  );
}
