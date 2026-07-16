"use client";

import { useActionState } from "react";
import {
  createCallEventAction,
  createDisplayPanelAction,
  revokeDisplayPanelAction,
  type DisplayFormState,
} from "./actions";

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
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeDisplayPanelAction,
    initialState,
  );

  return (
    <section className="mt-4 grid gap-3 lg:grid-cols-2">
      <form action={panelAction} className="grid gap-3 gp-surface p-4">
        <h2 className="text-lg font-semibold">Painel</h2>
        <Select label="Unidade" name="clinicUnitId" options={clinicUnits} />
        <label className="grid gap-1 text-sm font-medium">
          Código
          <input className="gp-input uppercase" name="code" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Nome
          <input className="gp-input" name="name" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Canal privado
          <input className="gp-input" name="channelName" required />
        </label>
        <button className="gp-btn gp-btn-primary w-fit" disabled={panelPending} type="submit">
          {panelPending ? "Criando…" : "Criar painel"}
        </button>
        <StateMessage state={panelState} />
        {panelState.deviceToken ? (
          <p className="break-all text-xs text-gp-text-muted">
            Token do dispositivo: {panelState.deviceToken}
          </p>
        ) : null}
      </form>

      <form action={callAction} className="grid gap-3 gp-surface p-4">
        <h2 className="text-lg font-semibold">Chamar ticket</h2>
        <Select label="Painel" name="displayPanelId" options={panels} />
        <Select label="Ticket" name="queueTicketId" options={tickets} />
        <Select
          label="Destino (redirect)"
          name="redirectPanelId"
          options={panels}
          required={false}
        />
        <label className="grid gap-1 text-sm font-medium">
          Versão esperada da etapa (start/return/no_show)
          <input className="gp-input" min={1} name="expectedVersion" type="number" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Ação
          <select className="gp-input" name="action" required>
            <option value="call">Chamar</option>
            <option value="recall">Rechamar</option>
            <option value="arrived">Compareceu</option>
            <option value="start">Iniciar</option>
            <option value="return">Devolver</option>
            <option value="no_show">Não compareceu</option>
            <option value="redirect">Redirecionar</option>
          </select>
        </label>
        <button className="gp-btn gp-btn-primary w-fit" disabled={callPending} type="submit">
          {callPending ? "Chamando…" : "Persistir chamada"}
        </button>
        <StateMessage state={callState} />
      </form>

      <form action={revokeAction} className="grid gap-3 gp-surface p-4 lg:col-span-2">
        <h2 className="text-lg font-semibold">Revogar painel</h2>
        <Select label="Painel" name="displayPanelId" options={panels} />
        <button className="gp-btn w-fit" disabled={revokePending} type="submit">
          {revokePending ? "Revogando…" : "Revogar token e painel"}
        </button>
        <StateMessage state={revokeState} />
      </form>
    </section>
  );
}

function Select({
  label,
  name,
  options,
  required = true,
}: {
  label: string;
  name: string;
  options: readonly Option[];
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select className="gp-input" name={name} required={required}>
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
