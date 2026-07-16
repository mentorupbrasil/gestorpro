"use client";

import { useActionState } from "react";
import { createCompanyAction, type OccupationalFormState } from "./actions";

const initialState: OccupationalFormState = {};

export function CompanyForm() {
  const [state, action, pending] = useActionState(createCompanyAction, initialState);

  return (
    <form action={action} className="grid gap-3 gp-surface p-4">
      <h2 className="text-base font-semibold text-gp-text">Nova empresa</h2>
      <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
        <label className="grid gap-1 text-sm font-medium">
          Razão social
          <input className="gp-input" maxLength={180} name="legalName" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          CNPJ
          <input
            className="gp-input"
            inputMode="numeric"
            name="taxId"
            placeholder="00000000000000"
            required
          />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Nome fantasia
        <input className="gp-input" name="tradeName" />
      </label>
      <button className="gp-btn gp-btn-primary w-fit" disabled={pending} type="submit">
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
