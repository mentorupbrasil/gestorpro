"use client";

import { useActionState } from "react";
import { createOrganization, type CreateOrganizationState } from "./actions";

const initialState: CreateOrganizationState = {};

export function CreateOrganizationForm() {
  const [state, action, pending] = useActionState(createOrganization, initialState);

  return (
    <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
      <h2 className="text-lg font-semibold text-emerald-950">Criar minha organização</h2>
      <p className="mt-1 text-sm text-emerald-900">
        Cadastre sua clínica ou empresa para uso real. Você será o administrador inicial.
      </p>

      <form action={action} className="mt-5 grid gap-4" noValidate>
        <label className="grid gap-1 text-sm font-medium text-slate-800">
          Razão social
          <input
            className="rounded border border-slate-300 bg-white px-3 py-2"
            name="legalName"
            placeholder="Clínica Exemplo Serviços Médicos Ltda."
            required
            type="text"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-800">
          Nome fantasia (opcional)
          <input
            className="rounded border border-slate-300 bg-white px-3 py-2"
            name="tradeName"
            placeholder="Clínica Exemplo"
            type="text"
          />
        </label>
        {state.error ? (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-800" role="status">
            {state.success}
          </p>
        ) : null}
        <button
          className="w-fit rounded bg-emerald-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Criando…" : "Criar e entrar"}
        </button>
      </form>
    </section>
  );
}
