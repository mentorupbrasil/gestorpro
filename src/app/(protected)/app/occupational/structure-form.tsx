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
    <form action={action} className="grid gap-4 border-t border-slate-200 pt-5 lg:col-span-2">
      <h2 className="text-lg font-semibold">Estrutura ocupacional e vínculo</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Empresa
          <select
            className="rounded border border-slate-300 px-3 py-2"
            disabled={disabled}
            name="companyId"
            required
          >
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
          <select
            className="rounded border border-slate-300 px-3 py-2"
            disabled={disabled}
            name="workerId"
            required
          >
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
          <input
            className="rounded border border-slate-300 px-3 py-2 uppercase"
            name="establishmentCode"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Estabelecimento
          <input
            className="rounded border border-slate-300 px-3 py-2"
            name="establishmentName"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Código setor
          <input
            className="rounded border border-slate-300 px-3 py-2 uppercase"
            name="sectorCode"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Setor
          <input className="rounded border border-slate-300 px-3 py-2" name="sectorName" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Código função
          <input
            className="rounded border border-slate-300 px-3 py-2 uppercase"
            name="jobCode"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Função
          <input className="rounded border border-slate-300 px-3 py-2" name="jobName" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Código GHE
          <input
            className="rounded border border-slate-300 px-3 py-2 uppercase"
            name="exposureGroupCode"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          GHE
          <input
            className="rounded border border-slate-300 px-3 py-2"
            name="exposureGroupName"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Código risco
          <input
            className="rounded border border-slate-300 px-3 py-2 uppercase"
            name="riskCode"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Risco
          <input className="rounded border border-slate-300 px-3 py-2" name="riskName" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Tipo de risco
          <select className="rounded border border-slate-300 px-3 py-2" name="riskType" required>
            <option value="physical">Físico</option>
            <option value="chemical">Químico</option>
            <option value="biological">Biológico</option>
            <option value="ergonomic">Ergonômico</option>
            <option value="accident">Acidente</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Início do vínculo
          <input
            className="rounded border border-slate-300 px-3 py-2"
            name="startsOn"
            type="date"
            required
          />
        </label>
      </div>
      <button
        className="w-fit rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={pending || disabled}
        type="submit"
      >
        {pending ? "Criando…" : "Criar estrutura e vínculo"}
      </button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-800">{state.success}</p> : null}
    </form>
  );
}
