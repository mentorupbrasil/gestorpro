"use client";

import { useActionState } from "react";
import {
  createExamProtocolPackageAction,
  createManualExamOverrideAction,
  simulateRequiredExamsAction,
  type OccupationalFormState,
} from "./actions";

type Option = { id: string; label: string };

type ProtocolWorkspaceProps = {
  catalogs: ReadonlyArray<Option>;
  pcmsoVersions: ReadonlyArray<Option>;
  protocols: ReadonlyArray<Option>;
  workers: ReadonlyArray<Option>;
};

const initialState: OccupationalFormState = {};

const examTypes = [
  ["admission", "Admissional"],
  ["periodic", "Periódico"],
  ["dismissal", "Demissional"],
  ["return_to_work", "Retorno ao trabalho"],
  ["change_of_risk", "Mudança de risco"],
] as const;

export function ProtocolWorkspace({
  catalogs,
  pcmsoVersions,
  protocols,
  workers,
}: ProtocolWorkspaceProps) {
  const [protocolState, protocolAction, protocolPending] = useActionState(
    createExamProtocolPackageAction,
    initialState,
  );
  const [simulateState, simulateAction, simulatePending] = useActionState(
    simulateRequiredExamsAction,
    initialState,
  );
  const [overrideState, overrideAction, overridePending] = useActionState(
    createManualExamOverrideAction,
    initialState,
  );

  return (
    <section className="mt-4 grid gap-3 lg:grid-cols-3">
      <form action={protocolAction} className="grid gap-3 gp-surface p-4">
        <h2 className="text-base font-semibold text-gp-text">Pacote de protocolo</h2>
        <p className="text-sm text-gp-text-muted">Cria itens e ativa protocolo na versão PCMSO.</p>
        <label className="grid gap-1 text-sm font-medium">
          Versão PCMSO
          <select className="gp-input" name="pcmsoVersionId" required>
            <option value="">Selecione</option>
            {pcmsoVersions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Tipo de exame ocupacional
          <select className="gp-input" name="occupationalExamType" required>
            {examTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Exames do catálogo
          <select className="min-h-28 gp-input" multiple name="examCatalogIds" required>
            {catalogs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Códigos de risco (opcional, vírgula)
          <input className="gp-input" name="riskCodes" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input defaultChecked name="activate" type="checkbox" value="true" />
          Ativar imediatamente
        </label>
        <button
          className="gp-btn gp-btn-primary"
          disabled={protocolPending || catalogs.length === 0 || pcmsoVersions.length === 0}
          type="submit"
        >
          {protocolPending ? "Salvando…" : "Criar protocolo"}
        </button>
        {protocolState.error ? (
          <p className="text-sm text-red-700" role="alert">
            {protocolState.error}
          </p>
        ) : null}
        {protocolState.success ? (
          <p className="text-sm text-emerald-800" role="status">
            {protocolState.success}
          </p>
        ) : null}
      </form>

      <form action={simulateAction} className="grid gap-3 gp-surface p-4">
        <h2 className="text-base font-semibold text-gp-text">Simular exames</h2>
        <p className="text-sm text-gp-text-muted">
          Motor `calculateRequiredExams` com protocolo vigente.
        </p>
        <label className="grid gap-1 text-sm font-medium">
          Tipo
          <select className="gp-input" name="occupationalExamType" required>
            {examTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Data de referência
          <input
            className="gp-input"
            defaultValue={new Date().toISOString().slice(0, 10)}
            name="asOf"
            required
            type="date"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Riscos (vírgula)
          <input className="gp-input" name="riskCodes" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Trabalhador (overrides)
          <select className="gp-input" name="workerId">
            <option value="">Nenhum</option>
            {workers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button className="gp-btn gp-btn-secondary" disabled={simulatePending} type="submit">
          {simulatePending ? "Calculando…" : "Simular"}
        </button>
        {simulateState.error ? (
          <p className="text-sm text-red-700" role="alert">
            {simulateState.error}
          </p>
        ) : null}
        {simulateState.result ? (
          <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-xs text-slate-800">
            {simulateState.result}
          </pre>
        ) : null}
      </form>

      <form action={overrideAction} className="grid gap-3 gp-surface p-4">
        <h2 className="text-base font-semibold text-gp-text">Override manual</h2>
        <p className="text-sm text-gp-text-muted">
          Add/remove auditado com justificativa (≥10). Sem aptidão.
        </p>
        <label className="grid gap-1 text-sm font-medium">
          Ação
          <select className="gp-input" name="action" required>
            <option value="add">Adicionar exame</option>
            <option value="remove">Remover exame</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Exame
          <select className="gp-input" name="examCatalogId" required>
            <option value="">Selecione</option>
            {catalogs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Trabalhador
          <select className="gp-input" name="workerId" required>
            <option value="">Selecione</option>
            {workers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Protocolo (opcional)
          <select className="gp-input" name="examProtocolId">
            <option value="">Nenhum</option>
            {protocols.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Justificativa
          <textarea className="min-h-20 gp-input" name="justification" required />
        </label>
        <button
          className="rounded bg-amber-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={overridePending}
          type="submit"
        >
          {overridePending ? "Registrando…" : "Registrar override"}
        </button>
        {overrideState.error ? (
          <p className="text-sm text-red-700" role="alert">
            {overrideState.error}
          </p>
        ) : null}
        {overrideState.success ? (
          <p className="text-sm text-emerald-800" role="status">
            {overrideState.success}
          </p>
        ) : null}
      </form>
    </section>
  );
}
