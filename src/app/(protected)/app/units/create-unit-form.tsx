"use client";

import { useActionState } from "react";
import { createUnitAction, type CreateUnitState } from "./actions";

const initialState: CreateUnitState = {};

export function CreateUnitForm() {
  const [state, action, pending] = useActionState(createUnitAction, initialState);

  return (
    <form action={action} className="mt-6 grid gap-4 border-t border-slate-200 pt-6">
      <div className="grid gap-4 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
        <label className="grid gap-1 text-sm font-medium">
          Código
          <input
            className="rounded border border-slate-300 px-3 py-2 uppercase"
            name="code"
            maxLength={32}
            placeholder="FOR-01"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Nome da unidade
          <input
            className="rounded border border-slate-300 px-3 py-2"
            name="name"
            maxLength={160}
            required
          />
        </label>
        <button
          className="rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Criando…" : "Criar unidade"}
        </button>
      </div>
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
