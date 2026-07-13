"use client";

import { useActionState, useState } from "react";
import { computeConclusionBlockers } from "@/features/clinical/workflow";
import { createMedicalConclusionAction, type ClinicalFormState } from "./actions";

type ConsultationOption = { encounterId: string; id: string; name: string };
type PhysicianOption = { id: string; name: string };

const initialState: ClinicalFormState = {};

export function ClinicalForms({
  consultations,
  physicians,
}: {
  consultations: readonly ConsultationOption[];
  physicians: readonly PhysicianOption[];
}) {
  const [encounterId, setEncounterId] = useState(consultations[0]?.encounterId ?? "");
  const [conclusionState, conclusionAction, conclusionPending] = useActionState(
    createMedicalConclusionAction,
    initialState,
  );

  const blockers = computeConclusionBlockers({
    closedConsultation: consultations.length > 0,
    closedTriage: true,
    flowPaused: false,
    pendingRequiredExams: 0,
    physicianRegistrationComplete: physicians.length > 0,
  });

  return (
    <section className="mt-8 rounded border border-slate-200 p-5">
      <h2 className="text-lg font-semibold">Conclusão médica humana</h2>
      <p className="mt-2 text-sm text-slate-600">
        Decisão explícita do médico. O sistema não define aptidão automaticamente.
      </p>

      {blockers.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-800">
          {blockers.map((blocker) => (
            <li key={blocker.code}>{blocker.message}</li>
          ))}
        </ul>
      ) : null}

      <form action={conclusionAction} className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm md:col-span-2">
          Consulta fechada
          <select
            className="rounded border border-slate-300 px-3 py-2"
            name="consultationId"
            onChange={(event) => {
              const selected = consultations.find((c) => c.id === event.target.value);
              setEncounterId(selected?.encounterId ?? "");
            }}
            required
          >
            <option value="">Selecione</option>
            {consultations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <input name="encounterId" type="hidden" value={encounterId} />
        <label className="grid gap-1 text-sm">
          Médico
          <select className="rounded border border-slate-300 px-3 py-2" name="physicianCredentialId" required>
            <option value="">Selecione</option>
            {physicians.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
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
          Restrições (uma por linha)
          <textarea className="rounded border border-slate-300 px-3 py-2" name="restrictions" />
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          Observações
          <textarea className="rounded border border-slate-300 px-3 py-2" name="notes" />
        </label>
        <button
          className="rounded bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2"
          disabled={conclusionPending || consultations.length === 0}
          type="submit"
        >
          Preparar conclusão para assinatura
        </button>
      </form>
      {conclusionState.error ? (
        <p className="mt-3 text-sm font-semibold text-red-700">{conclusionState.error}</p>
      ) : null}
      {conclusionState.success ? (
        <p className="mt-3 text-sm font-semibold text-emerald-800">{conclusionState.success}</p>
      ) : null}
    </section>
  );
}
