"use client";

import { useActionState } from "react";
import {
  createCipaAction,
  createEpiAction,
  createIncidentAction,
  type SstFormState,
} from "./actions";

type Option = { id: string; label: string };

export function SstWorkspaceForms({
  companyOptions,
  workerOptions,
}: {
  companyOptions: Option[];
  workerOptions: Option[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [incidentState, incidentAction, incidentPending] = useActionState(
    createIncidentAction,
    {} as SstFormState,
  );
  const [epiState, epiAction, epiPending] = useActionState(createEpiAction, {} as SstFormState);
  const [cipaState, cipaAction, cipaPending] = useActionState(createCipaAction, {} as SstFormState);

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-3">
      <form
        action={incidentAction}
        className="space-y-3 rounded-3xl border bg-white/90 p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Incidente</h2>
        <select className="w-full rounded border px-3 py-2 text-sm" name="companyId" required>
          <option value="">Empresa…</option>
          {companyOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="w-full rounded border px-3 py-2 text-sm" name="workerId">
          <option value="">Trabalhador (opc.)…</option>
          {workerOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="near_miss"
          name="incidentType"
        >
          <option value="near_miss">near_miss</option>
          <option value="injury">injury</option>
          <option value="illness">illness</option>
          <option value="property">property</option>
          <option value="other">other</option>
        </select>
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="low"
          name="severity"
        >
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>
        <textarea
          className="w-full rounded border px-3 py-2 text-sm"
          name="descriptionRedacted"
          placeholder="Descrição redigida"
          required
          rows={3}
        />
        <button
          className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={incidentPending || companyOptions.length === 0}
          type="submit"
        >
          Registrar
        </button>
        {incidentState.error ? <p className="text-sm text-red-700">{incidentState.error}</p> : null}
        {incidentState.success ? (
          <p className="text-sm text-emerald-700">{incidentState.success}</p>
        ) : null}
      </form>

      <form action={epiAction} className="space-y-3 rounded-3xl border bg-white/90 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Entrega de EPI</h2>
        <select className="w-full rounded border px-3 py-2 text-sm" name="companyId" required>
          <option value="">Empresa…</option>
          {companyOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="w-full rounded border px-3 py-2 text-sm" name="workerId" required>
          <option value="">Trabalhador…</option>
          {workerOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="EPI-001"
          name="epiCode"
          required
        />
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="Óculos de proteção"
          name="epiName"
          required
        />
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue={today}
          name="issuedAt"
          required
          type="date"
        />
        <button
          className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={epiPending || companyOptions.length === 0}
          type="submit"
        >
          Registrar
        </button>
        {epiState.error ? <p className="text-sm text-red-700">{epiState.error}</p> : null}
        {epiState.success ? <p className="text-sm text-emerald-700">{epiState.success}</p> : null}
      </form>

      <form action={cipaAction} className="space-y-3 rounded-3xl border bg-white/90 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">CIPA</h2>
        <select className="w-full rounded border px-3 py-2 text-sm" name="companyId" required>
          <option value="">Empresa…</option>
          {companyOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="w-full rounded border px-3 py-2 text-sm" name="workerId" required>
          <option value="">Trabalhador…</option>
          {workerOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="Membro eleito"
          name="roleLabel"
          required
        />
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue={today}
          name="mandateStartsOn"
          required
          type="date"
        />
        <button
          className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={cipaPending || companyOptions.length === 0}
          type="submit"
        >
          Registrar
        </button>
        {cipaState.error ? <p className="text-sm text-red-700">{cipaState.error}</p> : null}
        {cipaState.success ? <p className="text-sm text-emerald-700">{cipaState.success}</p> : null}
      </form>
    </section>
  );
}
