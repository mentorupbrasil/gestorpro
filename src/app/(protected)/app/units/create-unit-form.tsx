"use client";

import { useActionState } from "react";
import { createUnitAction, type CreateUnitState } from "./actions";

const initialState: CreateUnitState = {};

export function CreateUnitForm() {
  const [state, action, pending] = useActionState(createUnitAction, initialState);

  return (
    <form action={action} className="mt-4 grid gap-3 gp-surface p-4">
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
        <label className="grid gap-1 text-sm font-medium">
          Código
          <input
            className="gp-input uppercase"
            name="code"
            maxLength={32}
            placeholder="FOR-01"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Nome da unidade
          <input className="gp-input" name="name" maxLength={160} required />
        </label>
        <button className="gp-btn gp-btn-primary" disabled={pending} type="submit">
          {pending ? "Criando…" : "Criar unidade"}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-gp-accent-strong">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
