"use client";

import { useActionState } from "react";
import { upsertPortalUserAction, upsertReleaseRuleAction, type PortalFormState } from "./actions";

type Option = { id: string; label: string };

export function PortalAdminForms({
  companyOptions,
  membershipOptions,
}: {
  companyOptions: Option[];
  membershipOptions: Option[];
}) {
  const [userState, userAction, userPending] = useActionState(
    upsertPortalUserAction,
    {} as PortalFormState,
  );
  const [ruleState, ruleAction, rulePending] = useActionState(
    upsertReleaseRuleAction,
    {} as PortalFormState,
  );

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-2">
      <form action={userAction} className="space-y-3 rounded-3xl border bg-white/90 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Usuário do portal</h2>
        <p className="text-xs text-slate-600">
          Só vínculos ativos do tenant. UUID livre não é aceito.
        </p>
        <select className="w-full rounded border px-3 py-2 text-sm" name="companyId" required>
          <option value="">Empresa…</option>
          {companyOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="w-full rounded border px-3 py-2 text-sm" name="userId" required>
          <option value="">Membro do tenant…</option>
          {membershipOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="active"
          name="status"
        >
          <option value="active">active</option>
          <option value="suspended">suspended</option>
          <option value="revoked">revoked</option>
        </select>
        <button
          className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={userPending || companyOptions.length === 0 || membershipOptions.length === 0}
          type="submit"
        >
          Gravar acesso
        </button>
        {userState.error ? <p className="text-sm text-red-700">{userState.error}</p> : null}
        {userState.success ? <p className="text-sm text-emerald-700">{userState.success}</p> : null}
      </form>

      <form action={ruleAction} className="space-y-3 rounded-3xl border bg-white/90 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Matriz de documentos</h2>
        <select className="w-full rounded border px-3 py-2 text-sm" name="companyId" required>
          <option value="">Empresa…</option>
          {companyOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="aso"
          name="documentType"
        >
          <option value="aso">aso</option>
          <option value="exam_report">exam_report</option>
          <option value="triage_form">triage_form</option>
          <option value="generic">generic</option>
        </select>
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          defaultValue="operational"
          name="redactionProfile"
        >
          <option value="operational">operational</option>
          <option value="minimal">minimal</option>
          <option value="full_allowed">full_allowed</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input defaultChecked name="releaseToCompany" type="checkbox" /> Liberar para a empresa
        </label>
        <button
          className="rounded bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={rulePending || companyOptions.length === 0}
          type="submit"
        >
          Gravar regra
        </button>
        {ruleState.error ? <p className="text-sm text-red-700">{ruleState.error}</p> : null}
        {ruleState.success ? <p className="text-sm text-emerald-700">{ruleState.success}</p> : null}
      </form>
    </section>
  );
}
