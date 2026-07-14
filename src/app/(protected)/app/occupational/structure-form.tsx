"use client";

import { useActionState } from "react";
import { createOccupationalStructureAction, type OccupationalFormState } from "./actions";

type StructureFormProps = {
  companies: ReadonlyArray<{ id: string; legalName: string }>;
  workers: ReadonlyArray<{ fullName: string; id: string }>;
};

const initialState: OccupationalFormState = {};

export function StructureForm({ companies, workers }: StructureFormProps) {
  const [state, action, pending] = useActionState(createOccupationalStructureAction, initialState);
  const disabled = companies.length === 0 || workers.length === 0;

  return (
    <form action={action} className="grid gap-3 gp-surface p-4 lg:col-span-2">
      <h2 className="text-lg font-semibold">Estrutura ocupacional e vínculo</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Empresa
          <select className="gp-input" disabled={disabled} name="companyId" required>
            <option value="">Selecione</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.legalName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Trabalhador
          <select className="gp-input" disabled={disabled} name="workerId" required>
            <option value="">Selecione</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.fullName}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Código estabelecimento
          <input className="gp-input uppercase" name="establishmentCode" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Estabelecimento
          <input className="gp-input" name="establishmentName" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Código setor
          <input className="gp-input uppercase" name="sectorCode" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Setor
          <input className="gp-input" name="sectorName" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Código função
          <input className="gp-input uppercase" name="jobCode" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Função
          <input className="gp-input" name="jobName" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Código GHE
          <input className="gp-input uppercase" name="exposureGroupCode" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          GHE
          <input className="gp-input" name="exposureGroupName" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Código risco
          <input className="gp-input uppercase" name="riskCode" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Risco
          <input className="gp-input" name="riskName" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Tipo de risco
          <select className="gp-input" name="riskType" required>
            <option value="physical">Físico</option>
            <option value="chemical">Químico</option>
            <option value="biological">Biológico</option>
            <option value="ergonomic">Ergonômico</option>
            <option value="accident">Acidente</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Início do vínculo
          <input className="gp-input" name="startsOn" type="date" required />
        </label>
      </div>
      <button className="gp-btn gp-btn-primary w-fit" disabled={pending || disabled} type="submit">
        {pending ? "Criando…" : "Criar estrutura e vínculo"}
      </button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-800">{state.success}</p> : null}
    </form>
  );
}
