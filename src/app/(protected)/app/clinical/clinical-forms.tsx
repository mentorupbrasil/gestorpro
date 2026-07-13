"use client";

import { useActionState } from "react";
import {
  closeMedicalConsultationAction,
  createMedicalConclusionAction,
  saveTriageRecordAction,
  type ClinicalFormState,
} from "./actions";

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
  encounters,
  formVersions,
  physicians,
}: {
  consultations: readonly Option[];
  encounters: readonly Option[];
  formVersions: readonly Option[];
  physicians: readonly Option[];
}) {
  const [triageState, triageAction, triagePending] = useActionState(
    saveTriageRecordAction,
    initialState,
  );
  const [consultationState, consultationAction, consultationPending] = useActionState(
    closeMedicalConsultationAction,
    initialState,
  );
  const [conclusionState, conclusionAction, conclusionPending] = useActionState(
    createMedicalConclusionAction,
    initialState,
  );

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-3">
      <form action={triageAction} className="rounded border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Triagem versionada</h2>
        <div className="mt-4 grid gap-3">
          <SelectField label="Atendimento" name="encounterId" options={encounters} />
          <SelectField label="Versão do formulário" name="formVersionId" options={formVersions} />
          <label className="grid gap-1 text-sm">
            Payload JSON
            <textarea
              className="min-h-28 rounded border border-slate-300 px-3 py-2 font-mono text-xs"
              name="payload"
              required
              defaultValue={JSON.stringify({ pressão: "", peso: "", observações: "" }, null, 2)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Motivo
            <input className="rounded border border-slate-300 px-3 py-2" name="reason" required />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="closeRecord" type="checkbox" /> Fechar triagem explicitamente
          </label>
        </div>
        <button
          className="mt-4 rounded bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={triagePending}
          type="submit"
        >
          Salvar triagem
        </button>
        <Feedback state={triageState} />
      </form>

      <form action={consultationAction} className="rounded border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Consulta médica</h2>
        <div className="mt-4 grid gap-3">
          <SelectField label="Atendimento" name="encounterId" options={encounters} />
          <SelectField label="Médico vinculado" name="physicianCredentialId" options={physicians} />
          <label className="grid gap-1 text-sm">
            Subjetivo JSON
            <textarea
              className="min-h-20 rounded border border-slate-300 px-3 py-2 font-mono text-xs"
              name="subjective"
              required
              defaultValue={JSON.stringify({ queixa: "" }, null, 2)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Objetivo JSON
            <textarea
              className="min-h-20 rounded border border-slate-300 px-3 py-2 font-mono text-xs"
              name="objective"
              required
              defaultValue={JSON.stringify({ exameFisico: "" }, null, 2)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Avaliação
            <textarea className="rounded border border-slate-300 px-3 py-2" name="assessment" />
          </label>
          <label className="grid gap-1 text-sm">
            Plano
            <textarea className="rounded border border-slate-300 px-3 py-2" name="plan" />
          </label>
          <label className="grid gap-1 text-sm">
            Motivo
            <input className="rounded border border-slate-300 px-3 py-2" name="reason" required />
          </label>
        </div>
        <button
          className="mt-4 rounded bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={consultationPending}
          type="submit"
        >
          Fechar consulta
        </button>
        <Feedback state={consultationState} />
      </form>

      <form action={conclusionAction} className="rounded border border-slate-200 p-5">
        <h2 className="text-lg font-semibold">Conclusão humana</h2>
        <p className="mt-2 text-sm text-slate-600">
          A tela apenas registra decisão médica explícita. Nenhuma regra define aptidão sozinha.
        </p>
        <div className="mt-4 grid gap-3">
          <SelectField label="Atendimento" name="encounterId" options={encounters} />
          <SelectField label="Consulta fechada" name="consultationId" options={consultations} />
          <SelectField label="Médico vinculado" name="physicianCredentialId" options={physicians} />
          <label className="grid gap-1 text-sm">
            Conclusão
            <select className="rounded border border-slate-300 px-3 py-2" name="conclusionCode">
              <option value="fit">Apto</option>
              <option value="fit_with_restrictions">Apto com restrições</option>
              <option value="unfit">Inapto</option>
              <option value="inconclusive">Inconclusivo</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Restrições, uma por linha
            <textarea className="rounded border border-slate-300 px-3 py-2" name="restrictions" />
          </label>
          <label className="grid gap-1 text-sm">
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
