"use client";

import { useActionState, useId } from "react";
import {
  createEsocialEventAction,
  enqueueJobAction,
  registerSpoolAction,
  requeueDeadLetterAction,
  type IntegrationsFormState,
} from "./actions";

type Option = { id: string; label: string };

export function IntegrationsWorkspaceForms({
  connectionOptions,
  connectorOptions,
  deadLetterOptions,
  layoutOptions,
}: {
  connectionOptions: Option[];
  connectorOptions: Option[];
  deadLetterOptions: Option[];
  layoutOptions: Option[];
}) {
  const idempotencySeed = useId();
  const [jobState, jobAction, jobPending] = useActionState(
    enqueueJobAction,
    {} as IntegrationsFormState,
  );
  const [esocialState, esocialAction, esocialPending] = useActionState(
    createEsocialEventAction,
    {} as IntegrationsFormState,
  );
  const [spoolState, spoolAction, spoolPending] = useActionState(
    registerSpoolAction,
    {} as IntegrationsFormState,
  );
  const [deadState, deadAction, deadPending] = useActionState(
    requeueDeadLetterAction,
    {} as IntegrationsFormState,
  );

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-2">
      <form action={jobAction} className="space-y-3 rounded-3xl border bg-white/90 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Enfileirar job</h2>
        <select className="w-full rounded border px-3 py-2 text-sm" name="connectionId" required>
          <option value="">Conexão…</option>
          {connectionOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="webhook_delivery"
          name="jobType"
          required
        />
        <input
          name="idempotencyKey"
          type="hidden"
          value={`job-${idempotencySeed.replace(/:/g, "")}-${Date.now()}`}
        />
        <button
          className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={jobPending || connectionOptions.length === 0}
          type="submit"
        >
          Enfileirar
        </button>
        {jobState.error ? <p className="text-sm text-red-700">{jobState.error}</p> : null}
        {jobState.success ? <p className="text-sm text-emerald-700">{jobState.success}</p> : null}
      </form>

      <form
        action={esocialAction}
        className="space-y-3 rounded-3xl border bg-white/90 p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold">eSocial sandbox</h2>
        <select className="w-full rounded border px-3 py-2 text-sm" name="layoutVersionId" required>
          <option value="">Layout…</option>
          {layoutOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="S-2220"
          name="eventType"
          required
        />
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          name="businessKey"
          placeholder="chave de negócio fictícia"
          required
        />
        <button
          className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={esocialPending || layoutOptions.length === 0}
          type="submit"
        >
          Criar evento (sem envio)
        </button>
        {esocialState.error ? <p className="text-sm text-red-700">{esocialState.error}</p> : null}
        {esocialState.success ? (
          <p className="text-sm text-emerald-700">{esocialState.success}</p>
        ) : null}
      </form>

      <form action={spoolAction} className="space-y-3 rounded-3xl border bg-white/90 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Spool / pasta monitorada</h2>
        <select className="w-full rounded border px-3 py-2 text-sm" name="connectorId" required>
          <option value="">Conector…</option>
          {connectorOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="C:/spool/gestorpro"
          name="monitoredFolder"
          required
        />
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="arquivo-entrada.bin"
          name="fileName"
          required
        />
        <button
          className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={spoolPending || connectorOptions.length === 0}
          type="submit"
        >
          Registrar arquivo
        </button>
        {spoolState.error ? <p className="text-sm text-red-700">{spoolState.error}</p> : null}
        {spoolState.success ? (
          <p className="text-sm text-emerald-700">{spoolState.success}</p>
        ) : null}
      </form>

      <form action={deadAction} className="space-y-3 rounded-3xl border bg-white/90 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Reprocessar dead-letter</h2>
        <select className="w-full rounded border px-3 py-2 text-sm" name="deadLetterId" required>
          <option value="">Dead-letter…</option>
          {deadLetterOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          className="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={deadPending || deadLetterOptions.length === 0}
          type="submit"
        >
          Reenfileirar
        </button>
        {deadState.error ? <p className="text-sm text-red-700">{deadState.error}</p> : null}
        {deadState.success ? <p className="text-sm text-emerald-700">{deadState.success}</p> : null}
      </form>
    </section>
  );
}
