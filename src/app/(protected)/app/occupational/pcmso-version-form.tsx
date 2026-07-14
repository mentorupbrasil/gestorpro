"use client";

import { useActionState } from "react";
import { createPcmsoVersionAction, type OccupationalFormState } from "./actions";

type PcmsoVersionFormProps = {
  companies: ReadonlyArray<{ id: string; legalName: string }>;
};

const initialState: OccupationalFormState = {};

export function PcmsoVersionForm({ companies }: PcmsoVersionFormProps) {
  const [state, action, pending] = useActionState(createPcmsoVersionAction, initialState);

  return (
    <form action={action} className="grid gap-3 gp-surface p-4">
      <h2 className="text-lg font-semibold">Nova versão PCMSO</h2>
      <label className="grid gap-1 text-sm font-medium">
        Empresa
        <select className="gp-input" disabled={companies.length === 0} name="companyId" required>
          <option value="">Selecione</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.legalName}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-[10rem_1fr_8rem]">
        <label className="grid gap-1 text-sm font-medium">
          Código
          <input className="gp-input uppercase" name="programCode" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Nome do programa
          <input className="gp-input" name="name" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Versão
          <input className="gp-input" min="1" name="versionNumber" type="number" required />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Vigente de
          <input className="gp-input" name="validFrom" type="date" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Vigente até
          <input className="gp-input" name="validUntil" type="date" />
        </label>
      </div>
      <button
        className="gp-btn gp-btn-primary w-fit"
        disabled={pending || companies.length === 0}
        type="submit"
      >
        {pending ? "Criando…" : "Aprovar versão PCMSO"}
      </button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-800">{state.success}</p> : null}
    </form>
  );
}
