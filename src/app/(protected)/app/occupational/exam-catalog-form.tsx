"use client";

import { useActionState } from "react";
import { createExamCatalogItemAction, type OccupationalFormState } from "./actions";

const initialState: OccupationalFormState = {};

export function ExamCatalogForm() {
  const [state, action, pending] = useActionState(createExamCatalogItemAction, initialState);

  return (
    <form action={action} className="grid gap-3 gp-surface p-4">
      <h2 className="text-lg font-semibold">Novo exame no catálogo</h2>
      <div className="grid gap-4 md:grid-cols-[10rem_1fr_14rem]">
        <label className="grid gap-1 text-sm font-medium">
          Código
          <input className="gp-input uppercase" name="code" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Nome
          <input className="gp-input" name="name" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Tipo
          <select className="gp-input" name="resultType" required>
            <option value="clinical">Clínico</option>
            <option value="laboratory">Laboratório</option>
            <option value="imaging">Imagem</option>
            <option value="audiometry">Audiometria</option>
            <option value="spirometry">Espirometria</option>
            <option value="other">Outro</option>
          </select>
        </label>
      </div>
      <button className="gp-btn gp-btn-primary w-fit" disabled={pending} type="submit">
        {pending ? "Criando…" : "Criar exame"}
      </button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-800">{state.success}</p> : null}
    </form>
  );
}
