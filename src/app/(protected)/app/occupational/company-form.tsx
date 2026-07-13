"use client";

import { useActionState } from "react";
import { createCompanyAction, type OccupationalFormState } from "./actions";

const initialState: OccupationalFormState = {};

export function CompanyForm() {
  const [state, action, pending] = useActionState(createCompanyAction, initialState);

  return (
    <form action={action} className="grid gap-4 border-t border-slate-200 pt-5">
      <h2 className="text-lg font-semibold">Nova empresa</h2>
      <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
        <label className="grid gap-1 text-sm font-medium">
          Razão social
          <input
            className="rounded border border-slate-300 px-3 py-2"
            maxLength={180}
            name="legalName"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          CNPJ
          <input
            className="rounded border border-slate-300 px-3 py-2"
            inputMode="numeric"
            name="taxId"
            placeholder="00000000000000"
            required
          />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Nome fantasia
        <input className="rounded border border-slate-300 px-3 py-2" name="tradeName" />
      </label>
      <button
        className="w-fit rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Criando…" : "Criar empresa"}
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
