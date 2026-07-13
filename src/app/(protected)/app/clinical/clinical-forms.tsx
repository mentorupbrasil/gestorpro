"use client";

import { useActionState } from "react";
import { createMedicalConclusionAction, type ClinicalFormState } from "./actions";

type Option = { id: string; name: string };

const initialState: ClinicalFormState = {};

function Feedback({ state }: { state: ClinicalFormState }) {
  if (state.error) return <p className="mt-3 text-sm font-semibold text-red-700">{state.error}</p>;
  if (state.success) {
    return <p className="mt-3 text-sm font-semibold text-emerald-800">{state.success}</p>;
  }

  return null;
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: readonly Option[];
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <select className="rounded border border-slate-300 px-3 py-2" name={name} required>
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ClinicalForms({
  consultations,
  physicians,
}: {
  consultations: readonly Option[];
  physicians: readonly Option[];
}) {
  const [conclusionState, conclusionAction, conclusionPending] = useActionState(
    createMedicalConclusionAction,
    initialState,
  );

  return (
    <section className="mt-8">
      <form action={conclusionAction} className="rounded border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Conclusão humana</h2>
        <p className="mt-2 text-sm text-slate-600">
          A tela apenas registra decisão médica explícita. Nenhuma regra define aptidão sozinha.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <SelectField label="Consulta fechada" name="consultationId" options={consultations} />
          <SelectField label="Médico vinculado" name="physicianCredentialId" options={physicians} />
          <label className="grid gap-1 text-sm">
            Atendimento (UUID)
            <input
              className="rounded border border-slate-300 px-3 py-2 font-mono text-xs"
              name="encounterId"
              placeholder="Informe o encounter_id da consulta fechada"
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            Conclusão
            <select className="rounded border border-slate-300 px-3 py-2" name="conclusionCode">
              <option value="fit">Apto</option>
              <option value="fit_with_restrictions">Apto com restrições</option>
              <option value="unfit">Inapto</option>
              <option value="inconclusive">Inconclusivo</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            Restrições, uma por linha
            <textarea className="rounded border border-slate-300 px-3 py-2" name="restrictions" />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            Observações
            <textarea className="rounded border border-slate-300 px-3 py-2" name="notes" />
          </label>
        </div>
        <button
          className="mt-4 rounded bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={conclusionPending}
          type="submit"
        >
          Preparar assinatura
        </button>
        <Feedback state={conclusionState} />
      </form>
    </section>
  );
}
