"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo } from "react";
import {
  conclusionCodeLabels,
  formatRestrictionsForTextarea,
} from "@/features/clinical/conclusion-payload";
import type {
  ConclusionQueueItem,
  ConclusionWorkspace,
  PhysicianOption,
} from "@/features/clinical/service";
import { createMedicalConclusionAction, type ClinicalFormState } from "./actions";

type ConclusionStationProps = Pick<
  ConclusionWorkspace,
  "physicians" | "professionalName" | "queue" | "selectedEncounter" | "selectedRecord"
>;

const initialState: ClinicalFormState = {};

export function ConclusionStation({
  physicians,
  professionalName,
  queue,
  selectedEncounter,
  selectedRecord,
}: ConclusionStationProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createMedicalConclusionAction, initialState);
  const readOnly = Boolean(selectedRecord);
  const defaultPhysicianId =
    selectedRecord?.physicianCredentialId ?? physicians[0]?.id ?? "";

  const blockers = selectedEncounter?.blockers ?? [];

  useEffect(() => {
    if (state.success && state.encounterId) {
      router.refresh();
    }
  }, [router, state.encounterId, state.success]);

  const restrictionsDefault = useMemo(
    () => formatRestrictionsForTextarea(selectedRecord?.restrictions ?? []),
    [selectedRecord],
  );

  return (
    <section className="mt-8 rounded border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">P0.3</p>
          <h2 className="text-lg font-semibold">Estação de conclusão médica</h2>
          <p className="mt-1 text-sm text-slate-600">
            Profissional: {professionalName}. Decisão humana explícita — o sistema não define
            aptidão automaticamente.
          </p>
        </div>
        <p className="text-sm text-slate-500">{queue.length} aguardando conclusão</p>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-2">
          {queue.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum atendimento aguardando conclusão.</p>
          ) : (
            queue.map((item) => (
              <QueueButton
                item={item}
                key={item.encounterId}
                selected={selectedEncounter?.encounterId === item.encounterId}
              />
            ))
          )}
        </aside>

        {selectedEncounter ? (
          <div className="grid gap-4">
            {selectedEncounter.consultationSummary ? (
              <div className="rounded border border-sky-100 bg-sky-50/60 p-3 text-sm">
                <p className="font-semibold text-sky-900">Resumo da consulta</p>
                <p className="mt-1 text-slate-700">
                  Avaliação: {selectedEncounter.consultationSummary.assessment ?? "—"}
                </p>
                <p className="text-slate-700">
                  Plano: {selectedEncounter.consultationSummary.plan ?? "—"}
                </p>
              </div>
            ) : null}

            {blockers.length > 0 && !readOnly ? (
              <ul className="list-disc space-y-1 rounded border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
                {blockers.map((blocker) => (
                  <li key={blocker.code}>{blocker.message}</li>
                ))}
              </ul>
            ) : null}

            {physicians.length === 0 ? (
              <p className="text-sm text-amber-800">
                Cadastre uma credencial médica ativa vinculada ao seu usuário para registrar
                conclusão.
              </p>
            ) : readOnly && selectedRecord ? (
              <div className="grid gap-3 text-sm">
                <p className="font-semibold text-emerald-800">
                  Conclusão preparada ({selectedRecord.signatureStatus}).
                </p>
                <p>
                  <span className="font-medium">Código:</span>{" "}
                  {conclusionCodeLabels[selectedRecord.conclusionCode]}
                </p>
                {selectedRecord.restrictions.length > 0 ? (
                  <p>
                    <span className="font-medium">Restrições:</span>{" "}
                    {selectedRecord.restrictions.join("; ")}
                  </p>
                ) : null}
                {selectedRecord.notes ? (
                  <p>
                    <span className="font-medium">Observações:</span> {selectedRecord.notes}
                  </p>
                ) : null}
              </div>
            ) : (
              <form action={action} className="grid gap-4">
                <input
                  name="consultationId"
                  type="hidden"
                  value={selectedEncounter.consultationId ?? ""}
                />
                <input name="encounterId" type="hidden" value={selectedEncounter.encounterId} />
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-800">Credencial médica</span>
                  <select
                    className="rounded border border-slate-300 px-3 py-2"
                    defaultValue={defaultPhysicianId}
                    name="physicianCredentialId"
                    required
                  >
                    {physicians.map((physician: PhysicianOption) => (
                      <option key={physician.id} value={physician.id}>
                        {physician.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-800">Conclusão</span>
                  <select
                    className="rounded border border-slate-300 px-3 py-2"
                    defaultValue="fit"
                    name="conclusionCode"
                    required
                  >
                    {Object.entries(conclusionCodeLabels).map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-800">Restrições (uma por linha)</span>
                  <textarea
                    className="min-h-20 rounded border border-slate-300 px-3 py-2"
                    defaultValue={restrictionsDefault}
                    name="restrictions"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-800">Observações</span>
                  <textarea
                    className="min-h-20 rounded border border-slate-300 px-3 py-2"
                    name="notes"
                  />
                </label>
                <button
                  className="rounded bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={pending || blockers.length > 0 || !selectedEncounter.consultationId}
                  type="submit"
                >
                  Preparar conclusão para assinatura
                </button>
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
          <p className="text-sm text-slate-500">Selecione um atendimento na fila para concluir.</p>
        )}
      </div>
    </section>
  );
}

function QueueButton({
  item,
  selected,
}: {
  item: ConclusionQueueItem;
  selected: boolean;
}) {
  const router = useRouter();

  return (
    <button
      className={`w-full rounded border px-3 py-2 text-left text-sm ${
        selected ? "border-emerald-700 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"
      }`}
      onClick={() => router.push(`/app/clinical?conclusion=${item.encounterId}`)}
      type="button"
    >
      <p className="font-semibold text-slate-900">{item.workerName}</p>
      <p className="text-xs text-slate-600">
        {item.companyName} · {item.examTypeLabel}
      </p>
      <p className="text-xs text-slate-500">
        Espera {item.waitLabel}
        {item.pendingExams > 0 ? ` · ${item.pendingExams} exame(s) pendente(s)` : ""}
        {item.hasConclusion ? " · conclusão registrada" : ""}
      </p>
    </button>
  );
}
