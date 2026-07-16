"use client";

import { useActionState } from "react";
import { createWorkerAction, type OccupationalFormState } from "./actions";

const initialState: OccupationalFormState = {};

export function WorkerForm() {
  const [state, action, pending] = useActionState(createWorkerAction, initialState);

  return (
    <form action={action} className="grid gap-3 gp-surface p-4">
      <h2 className="text-lg font-semibold">Novo trabalhador</h2>
      <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
        <label className="grid gap-1 text-sm font-medium">
          Nome completo
          <input className="gp-input" maxLength={180} name="fullName" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          CPF
          <input
            className="gp-input"
            inputMode="numeric"
            name="cpf"
            placeholder="00000000000"
            required
          />
        </label>
      </div>
      <button className="gp-btn gp-btn-primary w-fit" disabled={pending} type="submit">
        {pending ? "Criando…" : "Criar trabalhador"}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
