"use client";

import { useActionState, useMemo, useState } from "react";
import { checkInAction, type CheckInFormState } from "./actions";

export type ReceptionRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  resourceName: string;
  workerName: string;
  companyName: string;
  examType: string;
  referralId: string | null;
};

const initialState: CheckInFormState = {};

export function ReceptionStation({ rows }: { rows: readonly ReceptionRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const [state, action, pending] = useActionState(checkInAction, initialState);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.workerName.toLowerCase().includes(q) ||
        row.companyName.toLowerCase().includes(q) ||
        row.resourceName.toLowerCase().includes(q) ||
        row.examType.toLowerCase().includes(q)
      );
    });
  }, [query, rows, statusFilter]);

  const selected = filtered.find((row) => row.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_320px]">
      <section className="gp-surface overflow-hidden">
        <div className="flex flex-wrap items-end gap-2 border-b border-gp-border p-3">
          <label className="grid min-w-[12rem] flex-1 gap-1 text-sm font-medium">
            Busca
            <input
              className="gp-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, empresa, recurso…"
              value={query}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Status
            <select
              className="gp-input"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value="all">Todos</option>
              <option value="scheduled">Agendado</option>
              <option value="confirmed">Confirmado</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gp-bg text-gp-text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Horário</th>
                <th className="px-3 py-2 font-medium">Trabalhador</th>
                <th className="px-3 py-2 font-medium">Empresa</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Recurso</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-gp-text-muted" colSpan={6}>
                    Nenhum agendamento elegível para check-in.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const active = selected?.id === row.id;
                  return (
                    <tr
                      className={`cursor-pointer border-t border-gp-border ${
                        active ? "bg-gp-accent/10" : "hover:bg-gp-bg"
                      }`}
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(row.startsAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-3 py-2 font-medium">{row.workerName}</td>
                      <td className="px-3 py-2">{row.companyName}</td>
                      <td className="px-3 py-2">{row.examType}</td>
                      <td className="px-3 py-2">{row.resourceName}</td>
                      <td className="px-3 py-2">{row.status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="gp-surface p-4">
        <h2 className="text-base font-semibold text-gp-text">Drawer operacional</h2>
        {!selected ? (
          <p className="mt-3 text-sm text-gp-text-muted">Selecione um agendamento.</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <span className="text-gp-text-muted">Trabalhador: </span>
              {selected.workerName}
            </p>
            <p>
              <span className="text-gp-text-muted">Empresa: </span>
              {selected.companyName}
            </p>
            <p>
              <span className="text-gp-text-muted">Tipo ocupacional: </span>
              {selected.examType}
            </p>
            <p>
              <span className="text-gp-text-muted">Recurso: </span>
              {selected.resourceName}
            </p>
            <p>
              <span className="text-gp-text-muted">Encaminhamento: </span>
              {selected.referralId ? "válido" : "ausente"}
            </p>
            <form action={action} className="mt-4 grid gap-2">
              <input name="appointmentId" type="hidden" value={selected.id} />
              <button className="gp-btn gp-btn-primary" disabled={pending} type="submit">
                {pending ? "Registrando…" : "Check-in"}
              </button>
              {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
              {state.success ? <p className="text-sm text-emerald-800">{state.success}</p> : null}
            </form>
          </div>
        )}
      </aside>
    </div>
  );
}
