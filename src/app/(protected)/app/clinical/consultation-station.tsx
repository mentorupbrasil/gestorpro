"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef } from "react";
import type { ConsultationQueueItem, PhysicianOption } from "@/features/clinical/service";
import {
  consultationInputFromStored,
  type ConsultationStoredPayload,
} from "@/features/clinical/consultation-payload";
import { saveMedicalConsultationAction, type ClinicalFormState } from "./actions";

type ConsultationStationProps = {
  physicians: readonly PhysicianOption[];
  professionalName: string;
  queue: readonly ConsultationQueueItem[];
  selectedEncounter: ConsultationQueueItem | null;
  selectedRecord: {
    consultationId: string;
    currentVersion: number;
    payload: ConsultationStoredPayload;
    physicianCredentialId: string;
    status: string;
  } | null;
};

const initialState: ClinicalFormState = {};

function fieldValue(value: string | null | undefined) {
  return value ?? "";
}

function Field({
  defaultValue = "",
  label,
  name,
  readOnly = false,
  required = false,
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      <input
        className="rounded border border-slate-300 px-3 py-2 read-only:bg-slate-50"
        defaultValue={fieldValue(defaultValue)}
        name={name}
        readOnly={readOnly}
        required={required}
      />
    </label>
  );
}

function TextArea({
  defaultValue = "",
  label,
  name,
  readOnly = false,
  required = false,
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      <textarea
        className="min-h-20 rounded border border-slate-300 px-3 py-2 read-only:bg-slate-50"
        defaultValue={fieldValue(defaultValue)}
        name={name}
        readOnly={readOnly}
        required={required}
      />
    </label>
  );
}

export function ConsultationStation({
  physicians,
  professionalName,
  queue,
  selectedEncounter,
  selectedRecord,
}: ConsultationStationProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(saveMedicalConsultationAction, initialState);
  const readOnly = selectedRecord?.status === "closed";
  const input = useMemo(
    () => consultationInputFromStored(selectedRecord?.payload ?? buildEmptyPayload()),
    [selectedRecord],
  );
  const defaultPhysicianId =
    selectedRecord?.physicianCredentialId ?? physicians[0]?.id ?? "";

  useEffect(() => {
    if (state.success && state.encounterId) {
      router.refresh();
    }
  }, [router, state.encounterId, state.success]);

  return (
    <section className="mt-8 rounded border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">P0.2</p>
          <h2 className="text-lg font-semibold">Estação de consulta médica</h2>
          <p className="mt-1 text-sm text-slate-600">
            Profissional: {professionalName}. Somente atendimentos com triagem concluída.
          </p>
        </div>
        <p className="text-sm text-slate-500">{queue.length} na fila de consulta</p>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-2">
          {queue.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum atendimento aguardando consulta.</p>
          ) : (
            queue.map((item) => (
              <button
                key={item.encounterId}
                className={`w-full rounded border px-3 py-2 text-left text-sm ${
                  selectedEncounter?.encounterId === item.encounterId
                    ? "border-sky-700 bg-sky-50"
                    : "border-slate-200 hover:border-sky-300"
                }`}
                onClick={() => router.push(`/app/clinical?consultation=${item.encounterId}`)}
                type="button"
              >
                <p className="font-semibold text-slate-900">{item.workerName}</p>
                <p className="text-xs text-slate-600">
                  {item.companyName} · {item.examTypeLabel}
                </p>
                <p className="text-xs text-slate-500">
                  Espera {item.waitLabel}
                  {item.pendingExams > 0 ? ` · ${item.pendingExams} exame(s) pendente(s)` : ""}
                </p>
              </button>
            ))
          )}
        </aside>

        {selectedEncounter ? (
          <div className="grid gap-4">
            {selectedEncounter.triageSummary ? (
              <div className="rounded border border-emerald-100 bg-emerald-50/60 p-3 text-sm">
                <p className="font-semibold text-emerald-900">Resumo da triagem</p>
                <p className="mt-1 text-slate-700">
                  Queixa: {selectedEncounter.triageSummary.clinical.currentComplaint ?? "—"}
                </p>
                <p className="text-slate-700">
                  PA: {selectedEncounter.triageSummary.vitals.systolicBp ?? "—"}/
                  {selectedEncounter.triageSummary.vitals.diastolicBp ?? "—"} · FC:{" "}
                  {selectedEncounter.triageSummary.vitals.heartRate ?? "—"}
                </p>
                <p className="text-slate-700">
                  IMC: {selectedEncounter.triageSummary.anthropometry.bmi ?? "—"}
                </p>
              </div>
            ) : null}

            {physicians.length === 0 ? (
              <p className="text-sm text-amber-800">
                Cadastre uma credencial médica ativa vinculada ao seu usuário para registrar consulta.
              </p>
            ) : (
              <form ref={formRef} action={action} className="grid gap-4">
                <input name="encounterId" type="hidden" value={selectedEncounter.encounterId} />
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-800">Credencial médica</span>
                  <select
                    className="rounded border border-slate-300 px-3 py-2 read-only:bg-slate-50"
                    defaultValue={defaultPhysicianId}
                    disabled={readOnly}
                    name="physicianCredentialId"
                    required
                  >
                    {physicians.map((physician) => (
                      <option key={physician.id} value={physician.id}>
                        {physician.label}
                      </option>
                    ))}
                  </select>
                </label>

                <TextArea
                  defaultValue={input.subjective.chiefComplaint}
                  label="Queixa principal"
                  name="chiefComplaint"
                  readOnly={readOnly}
                />
                <TextArea
                  defaultValue={input.subjective.historyOfPresentIllness}
                  label="História da doença atual"
                  name="historyOfPresentIllness"
                  readOnly={readOnly}
                />
                <TextArea
                  defaultValue={input.subjective.occupationalHistory}
                  label="História ocupacional"
                  name="occupationalHistory"
                  readOnly={readOnly}
                />
                <TextArea
                  defaultValue={input.objective.generalAppearance}
                  label="Aspecto geral"
                  name="generalAppearance"
                  readOnly={readOnly}
                />
                <TextArea
                  defaultValue={input.objective.physicalExam}
                  label="Exame físico"
                  name="physicalExam"
                  readOnly={readOnly}
                />
                <TextArea
                  defaultValue={input.assessment}
                  label="Avaliação"
                  name="assessment"
                  readOnly={readOnly}
                />
                <TextArea
                  defaultValue={input.plan}
                  label="Plano / conduta"
                  name="plan"
                  readOnly={readOnly}
                />

                {!readOnly ? (
                  <>
                    <Field label="Motivo da alteração" name="changeReason" />
                    <Field label="Motivo da conclusão" name="reason" required />
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded border border-sky-700 px-4 py-2 text-sm font-semibold text-sky-800 disabled:opacity-60"
                        disabled={pending}
                        name="intent"
                        type="submit"
                        value="draft"
                      >
                        Salvar rascunho
                      </button>
                      <button
                        className="rounded bg-sky-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        disabled={pending}
                        name="intent"
                        type="submit"
                        value="complete"
                      >
                        Concluir consulta
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-emerald-800">Consulta concluída.</p>
                )}

                {state.error ? (
                  <p className="text-sm font-semibold text-red-700">{state.error}</p>
                ) : null}
                {state.success ? (
                  <p className="text-sm font-semibold text-emerald-800">{state.success}</p>
                ) : null}
              </form>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Selecione um atendimento na fila para consultar.</p>
        )}
      </div>
    </section>
  );
}

function buildEmptyPayload(): ConsultationStoredPayload {
  return {
    assessment: null,
    objective: {
      generalAppearance: null,
      physicalExam: null,
      vitalSignsReview: null,
    },
    plan: null,
    schemaVersion: 1,
    subjective: {
      chiefComplaint: null,
      historyOfPresentIllness: null,
      occupationalHistory: null,
      reviewOfSystems: null,
    },
  };
}
