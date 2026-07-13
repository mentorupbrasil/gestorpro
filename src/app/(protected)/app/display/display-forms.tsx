"use client";

import { useActionState } from "react";
import { createCallEventAction, createDisplayPanelAction, type DisplayFormState } from "./actions";

type Option = { id: string; name: string };

const initialState: DisplayFormState = {};

export function DisplayForms({
  clinicUnits,
  panels,
  tickets,
}: {
  clinicUnits: readonly Option[];
  panels: readonly Option[];
  tickets: readonly Option[];
}) {
  const [panelState, panelAction, panelPending] = useActionState(
    createDisplayPanelAction,
    initialState,
  );
  const [callState, callAction, callPending] = useActionState(createCallEventAction, initialState);

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <form action={panelAction} className="grid gap-3 border-t border-slate-200 pt-5">
        <h2 className="text-lg font-semibold">Painel</h2>
        <Select label="Unidade" name="clinicUnitId" options={clinicUnits} />
        <label className="grid gap-1 text-sm font-medium">
          Código
          <input
            className="rounded border border-slate-300 px-3 py-2 uppercase"
            name="code"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Nome
          <input className="rounded border border-slate-300 px-3 py-2" name="name" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Canal privado
          <input
            className="rounded border border-slate-300 px-3 py-2"
            name="channelName"
            required
          />
        </label>
        <button
          className="w-fit rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
          disabled={panelPending}
          type="submit"
        >
          {panelPending ? "Criando…" : "Criar painel"}
        </button>
        <StateMessage state={panelState} />
      </form>

      <form action={callAction} className="grid gap-3 border-t border-slate-200 pt-5">
        <h2 className="text-lg font-semibold">Chamar ticket</h2>
        <Select label="Painel" name="displayPanelId" options={panels} />
        <Select label="Ticket" name="queueTicketId" options={tickets} />
        <label className="grid gap-1 text-sm font-medium">
          Ação
          <select className="rounded border border-slate-300 px-3 py-2" name="action" required>
            <option value="call">Chamar</option>
            <option value="recall">Rechamar</option>
            <option value="arrived">Compareceu</option>
            <option value="start">Iniciar</option>
            <option value="return">Devolver</option>
            <option value="no_show">Não compareceu</option>
            <option value="redirect">Redirecionar</option>
          </select>
        </label>
        <button
          className="w-fit rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
          disabled={callPending}
          type="submit"
        >
          {callPending ? "Chamando…" : "Persistir chamada"}
        </button>
        <StateMessage state={callState} />
      </form>
    </section>
  );
}

function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: readonly Option[];
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
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

function StateMessage({ state }: { state: DisplayFormState }) {
  if (state.error) return <p className="text-sm text-red-700">{state.error}</p>;
  if (state.success) return <p className="text-sm text-emerald-800">{state.success}</p>;
  return null;
}
