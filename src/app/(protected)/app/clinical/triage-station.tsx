"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef } from "react";
import type { TriageQueueItem } from "@/features/clinical/service";
import {
  computeBmi,
  triageInputFromStored,
  type TriageStoredPayload,
} from "@/features/clinical/triage-payload";
import { saveTriageRecordAction, type ClinicalFormState } from "./actions";

type TriageStationProps = {
  formVersionId: string;
  formVersionLabel: string;
  professionalName: string;
  queue: readonly TriageQueueItem[];
  selectedEncounter: TriageQueueItem | null;
  selectedRecord: {
    currentVersion: number;
    payload: TriageStoredPayload;
    status: string;
  } | null;
};

const initialState: ClinicalFormState = {};

const smokingOptions = ["Não informado", "Não fumante", "Ex-fumante", "Fumante"];
const alcoholOptions = ["Não informado", "Não consome", "Social", "Frequente"];

function fieldValue(value: string | number | null | undefined) {
  return value ?? "";
}

function Field({
  defaultValue = "",
  hint,
  inputMode,
  label,
  max,
  min,
  name,
  readOnly = false,
  required = false,
  step,
  type = "text",
}: {
  defaultValue?: string | number | null | undefined;
  hint?: string;
  inputMode?: "decimal" | "numeric";
  label: string;
  max?: number;
  min?: number;
  name: string;
  readOnly?: boolean;
  required?: boolean;
  step?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      <input
        className="rounded border border-slate-300 px-3 py-2 read-only:bg-slate-50"
        defaultValue={fieldValue(defaultValue)}
        inputMode={inputMode}
        max={max}
        min={min}
        name={name}
        readOnly={readOnly}
        required={required}
        step={step}
        type={type}
      />
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function TextArea({
  defaultValue = "",
  label,
  name,
  readOnly = false,
}: {
  defaultValue?: string | null | undefined;
  label: string;
  name: string;
  readOnly?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      <textarea
        className="min-h-20 rounded border border-slate-300 px-3 py-2 read-only:bg-slate-50"
        defaultValue={fieldValue(defaultValue)}
        name={name}
        readOnly={readOnly}
      />
    </label>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-900">{title}</h3>
      <div className="mt-3 grid gap-3">{children}</div>
    </section>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const label =
    status === "closed"
      ? "Concluída"
      : status === "draft"
        ? "Rascunho"
        : status === "reopened"
          ? "Alteração pendente"
          : "Aguardando";

  const tone =
    status === "closed"
      ? "bg-emerald-100 text-emerald-900"
      : status === "reopened"
        ? "bg-amber-100 text-amber-900"
        : status === "draft"
          ? "bg-sky-100 text-sky-900"
          : "bg-slate-100 text-slate-700";

  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>;
}

export function TriageStation({
  formVersionId,
  formVersionLabel,
  professionalName,
  queue,
  selectedEncounter,
  selectedRecord,
}: TriageStationProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [triageState, triageAction, triagePending] = useActionState(
    saveTriageRecordAction,
    initialState,
  );

  const selectedEncounterId = selectedEncounter?.encounterId;
  const inputDefaults = useMemo(
    () => (selectedRecord ? triageInputFromStored(selectedRecord.payload) : null),
    [selectedRecord],
  );
  const isClosed = selectedRecord?.status === "closed";
  const previewBmi =
    selectedRecord?.payload.anthropometry.bmi ??
    computeBmi(
      inputDefaults?.anthropometry.weightKg ?? null,
      inputDefaults?.anthropometry.heightCm ?? null,
    );

  useEffect(() => {
    if (triageState.success) {
      router.refresh();
    }
  }, [router, triageState.success]);

  return (
    <section className="mt-8 rounded-lg border border-slate-200">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Estação de triagem</h2>
            <p className="mt-1 text-sm text-slate-600">
              {formVersionLabel} · Responsável: {professionalName}
            </p>
            {!formVersionId ? (
              <p className="mt-2 text-sm font-medium text-amber-800">
                Não há formulário de triagem aprovado para este tenant.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {triagePending ? (
              <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-700">
                Salvando…
              </span>
            ) : null}
            {triageState.success ? (
              <span className="rounded bg-emerald-100 px-2 py-1 font-medium text-emerald-900">
                {triageState.success}
              </span>
            ) : null}
            {triageState.error ? (
              <span className="rounded bg-red-100 px-2 py-1 font-medium text-red-800">
                {triageState.error}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(280px,340px)_1fr]">
        <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Fila aguardando triagem</h3>
            <p className="mt-1 text-xs text-slate-500">
              {queue.length === 0
                ? "Nenhum atendimento aguardando triagem nesta unidade."
                : `${queue.length} atendimento(s) na fila`}
            </p>
          </div>
          {queue.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-slate-600">
              Quando houver check-in real no ambiente autorizado, os atendimentos aparecerão aqui
              automaticamente.
            </p>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
              {queue.map((item) => {
                const isSelected = item.encounterId === selectedEncounterId;
                return (
                  <li key={item.encounterId}>
                    <button
                      className={`w-full px-4 py-3 text-left transition hover:bg-emerald-50 ${
                        isSelected ? "bg-emerald-50 ring-1 ring-inset ring-emerald-200" : ""
                      }`}
                      onClick={() => router.push(`/app/clinical?encounter=${item.encounterId}`)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{item.workerName}</p>
                          <p className="mt-1 text-xs text-slate-600">{item.companyName}</p>
                        </div>
                        <StatusBadge status={item.recordStatus} />
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                        <div>
                          <dt className="inline">Exame: </dt>
                          <dd className="inline font-medium text-slate-700">
                            {item.examTypeLabel}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline">Espera: </dt>
                          <dd className="inline font-medium text-slate-700">{item.waitLabel}</dd>
                        </div>
                        <div>
                          <dt className="inline">Prioridade: </dt>
                          <dd className="inline font-medium text-slate-700">
                            {item.priority ?? "Padrão"}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline">Unidade: </dt>
                          <dd className="inline font-medium text-slate-700">
                            {item.clinicUnitName}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline">Etapa: </dt>
                          <dd className="inline font-medium text-slate-700">{item.stepStatus}</dd>
                        </div>
                        <div>
                          <dt className="inline">Status: </dt>
                          <dd className="inline font-medium text-slate-700">{item.status}</dd>
                        </div>
                      </dl>
                      {item.hasPendingItems ? (
                        <p className="mt-2 text-xs font-semibold text-amber-800">
                          Pendência operacional
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="px-5 py-4">
          {!selectedEncounter ? (
            <p className="rounded bg-slate-50 px-4 py-8 text-sm text-slate-600">
              Selecione um atendimento na fila para iniciar ou continuar a triagem.
            </p>
          ) : (
            <form
              action={triageAction}
              className="grid gap-5"
              key={selectedEncounterId}
              ref={formRef}
            >
              <input name="encounterId" type="hidden" value={selectedEncounterId} />
              <input name="formVersionId" type="hidden" value={formVersionId} />

              <section className="rounded bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold">{selectedEncounter.workerName}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedEncounter.companyName} · {selectedEncounter.examTypeLabel} ·{" "}
                      {selectedEncounter.clinicUnitName}
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>
                      Check-in: {new Date(selectedEncounter.checkedInAt).toLocaleString("pt-BR")}
                    </p>
                    <p>Espera: {selectedEncounter.waitLabel}</p>
                    {selectedRecord ? (
                      <p className="mt-1">Versão {selectedRecord.currentVersion}</p>
                    ) : null}
                  </div>
                </div>
              </section>

              <Section title="Sinais vitais">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Field
                    defaultValue={inputDefaults?.vitals.systolicBp}
                    inputMode="numeric"
                    label="Pressão sistólica (mmHg)"
                    min={40}
                    max={300}
                    name="systolicBp"
                    readOnly={isClosed}
                    type="number"
                  />
                  <Field
                    defaultValue={inputDefaults?.vitals.diastolicBp}
                    inputMode="numeric"
                    label="Pressão diastólica (mmHg)"
                    min={20}
                    max={200}
                    name="diastolicBp"
                    readOnly={isClosed}
                    type="number"
                  />
                  <Field
                    defaultValue={inputDefaults?.vitals.heartRate}
                    inputMode="numeric"
                    label="Frequência cardíaca (bpm)"
                    min={20}
                    max={300}
                    name="heartRate"
                    readOnly={isClosed}
                    type="number"
                  />
                  <Field
                    defaultValue={inputDefaults?.vitals.respiratoryRate}
                    inputMode="numeric"
                    label="Frequência respiratória (irpm)"
                    min={4}
                    max={80}
                    name="respiratoryRate"
                    readOnly={isClosed}
                    type="number"
                  />
                  <Field
                    defaultValue={inputDefaults?.vitals.temperature}
                    inputMode="decimal"
                    label="Temperatura (°C)"
                    min={30}
                    max={45}
                    name="temperature"
                    readOnly={isClosed}
                    step="0.1"
                    type="number"
                  />
                  <Field
                    defaultValue={inputDefaults?.vitals.oxygenSaturation}
                    inputMode="numeric"
                    label="Saturação de oxigênio (%)"
                    min={50}
                    max={100}
                    name="oxygenSaturation"
                    readOnly={isClosed}
                    type="number"
                  />
                  <Field
                    defaultValue={inputDefaults?.vitals.capillaryGlucose}
                    hint="Opcional"
                    inputMode="numeric"
                    label="Glicemia capilar (mg/dL)"
                    min={20}
                    max={600}
                    name="capillaryGlucose"
                    readOnly={isClosed}
                    type="number"
                  />
                </div>
              </Section>

              <Section title="Antropometria">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Field
                    defaultValue={inputDefaults?.anthropometry.weightKg}
                    inputMode="decimal"
                    label="Peso (kg)"
                    max={500}
                    min={1}
                    name="weightKg"
                    readOnly={isClosed}
                    step="0.1"
                    type="number"
                  />
                  <Field
                    defaultValue={inputDefaults?.anthropometry.heightCm}
                    inputMode="decimal"
                    label="Altura (cm)"
                    max={250}
                    min={30}
                    name="heightCm"
                    readOnly={isClosed}
                    step="0.1"
                    type="number"
                  />
                  <Field
                    hint="Prévia local; valor oficial é calculado no servidor."
                    label="IMC (prévia)"
                    name="bmiPreview"
                    readOnly
                    defaultValue={previewBmi ?? selectedRecord?.payload.anthropometry.bmi ?? ""}
                  />
                  <Field
                    defaultValue={selectedRecord?.payload.anthropometry.bmiClassification ?? "—"}
                    hint="Classificação auxiliar depende de configuração aprovada."
                    label="Classificação do IMC"
                    name="bmiClassificationPreview"
                    readOnly
                  />
                  <Field
                    defaultValue={inputDefaults?.anthropometry.abdominalCircumference}
                    hint="Opcional"
                    inputMode="numeric"
                    label="Circunferência abdominal (cm)"
                    min={30}
                    max={200}
                    name="abdominalCircumference"
                    readOnly={isClosed}
                    type="number"
                  />
                </div>
              </Section>

              <Section title="Informações clínicas">
                <div className="grid gap-3">
                  <Field
                    defaultValue={inputDefaults?.clinical.painScale}
                    inputMode="numeric"
                    label="Escala de dor (0 a 10)"
                    max={10}
                    min={0}
                    name="painScale"
                    readOnly={isClosed}
                    type="number"
                  />
                  <TextArea
                    defaultValue={inputDefaults?.clinical.currentComplaint}
                    label="Queixa atual"
                    name="currentComplaint"
                    readOnly={isClosed}
                  />
                  <TextArea
                    defaultValue={inputDefaults?.clinical.allergies}
                    label="Alergias"
                    name="allergies"
                    readOnly={isClosed}
                  />
                  <TextArea
                    defaultValue={inputDefaults?.clinical.medications}
                    label="Medicamentos em uso"
                    name="medications"
                    readOnly={isClosed}
                  />
                  <TextArea
                    defaultValue={inputDefaults?.clinical.relevantHistory}
                    label="Antecedentes relevantes"
                    name="relevantHistory"
                    readOnly={isClosed}
                  />
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium text-slate-800">Tabagismo</span>
                    <select
                      className="rounded border border-slate-300 px-3 py-2 read-only:bg-slate-50"
                      defaultValue={inputDefaults?.clinical.smoking ?? "Não informado"}
                      disabled={isClosed}
                      name="smoking"
                    >
                      {smokingOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium text-slate-800">Consumo de álcool</span>
                    <select
                      className="rounded border border-slate-300 px-3 py-2 read-only:bg-slate-50"
                      defaultValue={inputDefaults?.clinical.alcoholConsumption ?? "Não informado"}
                      disabled={isClosed}
                      name="alcoholConsumption"
                    >
                      {alcoholOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <TextArea
                    defaultValue={inputDefaults?.clinical.pregnancyStatus}
                    label="Gestação ou possibilidade (quando aplicável)"
                    name="pregnancyStatus"
                    readOnly={isClosed}
                  />
                </div>
              </Section>

              <Section title="Observações e operação">
                <div className="grid gap-3">
                  <TextArea
                    defaultValue={inputDefaults?.clinical.observations}
                    label="Observações"
                    name="observations"
                    readOnly={isClosed}
                  />
                  <Field
                    defaultValue={inputDefaults?.operational.equipmentUsed}
                    label="Equipamentos utilizados"
                    name="equipmentUsed"
                    readOnly={isClosed}
                  />
                  <Field
                    defaultValue={selectedRecord?.payload.operational.startedAt ?? ""}
                    label="Início do registro"
                    name="startedAtPreview"
                    readOnly
                  />
                  <Field
                    defaultValue={selectedRecord?.payload.operational.completedAt ?? ""}
                    label="Conclusão"
                    name="completedAtPreview"
                    readOnly
                  />
                  {!isClosed ? (
                    <Field
                      hint={
                        selectedRecord?.status === "closed" || selectedRecord?.status === "reopened"
                          ? "Obrigatório para correção após conclusão."
                          : "Opcional em rascunho."
                      }
                      label="Motivo da alteração"
                      name="changeReason"
                    />
                  ) : null}
                  {!isClosed ? (
                    <Field
                      hint="Obrigatório ao concluir a triagem."
                      label="Motivo da conclusão"
                      name="reason"
                    />
                  ) : null}
                </div>
              </Section>

              {!isClosed && formVersionId ? (
                <div className="sticky bottom-0 -mx-5 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      disabled={triagePending}
                      name="intent"
                      type="submit"
                      value="draft"
                    >
                      {triagePending ? "Salvando…" : "Salvar rascunho"}
                    </button>
                    <button
                      className="rounded bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      disabled={triagePending}
                      name="intent"
                      type="submit"
                      value="complete"
                    >
                      {triagePending ? "Concluindo…" : "Concluir triagem"}
                    </button>
                  </div>
                </div>
              ) : !isClosed ? (
                <p className="rounded bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  A triagem ficará disponível após aprovação de um formulário versionado no tenant.
                </p>
              ) : (
                <p className="rounded bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Triagem concluída. Correções exigem permissão de reabertura clínica e novo motivo.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
