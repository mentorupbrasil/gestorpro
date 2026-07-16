"use client";

import { useActionState } from "react";
import {
  createAppointmentAction,
  createReferralAction,
  createScheduleResourceAction,
  type SchedulingFormState,
} from "./actions";

type Option = { id: string; name: string };

type SchedulingFormsProps = {
  clinicUnits: readonly Option[];
  companies: readonly Option[];
  referrals: readonly Option[];
  resources: readonly Option[];
  workers: readonly Option[];
};

const initialState: SchedulingFormState = {};

export function SchedulingForms({
  clinicUnits,
  companies,
  referrals,
  resources,
  workers,
}: SchedulingFormsProps) {
  const [referralState, referralAction, referralPending] = useActionState(
    createReferralAction,
    initialState,
  );
  const [resourceState, resourceAction, resourcePending] = useActionState(
    createScheduleResourceAction,
    initialState,
  );
  const [appointmentState, appointmentAction, appointmentPending] = useActionState(
    createAppointmentAction,
    initialState,
  );

  return (
    <section className="mt-4 grid gap-3 lg:grid-cols-3">
      <form action={referralAction} className="grid gap-3 gp-surface p-4">
        <h2 className="text-lg font-semibold">Novo encaminhamento</h2>
        <Select label="Empresa" name="companyId" options={companies} />
        <Select label="Trabalhador" name="workerId" options={workers} />
        <label className="grid gap-1 text-sm font-medium">
          Tipo ocupacional
          <select className="gp-input" name="occupationalExamType" required>
            <option value="admission">Admissional</option>
            <option value="periodic">Periódico</option>
            <option value="dismissal">Demissional</option>
            <option value="return_to_work">Retorno ao trabalho</option>
            <option value="change_of_risk">Mudança de risco</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Validade
          <input className="gp-input" name="validUntil" type="date" />
        </label>
        <SubmitButton
          disabled={referralPending}
          label="Criar encaminhamento"
          pendingLabel="Criando…"
        />
        <StateMessage state={referralState} />
      </form>

      <form action={resourceAction} className="grid gap-3 gp-surface p-4">
        <h2 className="text-lg font-semibold">Recurso de agenda</h2>
        <Select label="Unidade" name="clinicUnitId" options={clinicUnits} />
        <label className="grid gap-1 text-sm font-medium">
          Tipo
          <select className="gp-input" name="resourceType" required>
            <option value="room">Sala</option>
            <option value="professional">Profissional</option>
            <option value="equipment">Equipamento</option>
            <option value="procedure">Procedimento</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Código
          <input className="gp-input uppercase" name="code" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Nome
          <input className="gp-input" name="name" required />
        </label>
        <SubmitButton disabled={resourcePending} label="Criar recurso" pendingLabel="Criando…" />
        <StateMessage state={resourceState} />
      </form>

      <form action={appointmentAction} className="grid gap-3 gp-surface p-4">
        <h2 className="text-lg font-semibold">Agendar</h2>
        <Select label="Unidade" name="clinicUnitId" options={clinicUnits} />
        <Select label="Recurso" name="resourceId" options={resources} />
        <Select label="Encaminhamento" name="referralId" options={referrals} optional />
        <label className="grid gap-1 text-sm font-medium">
          Início
          <input className="gp-input" name="startsAt" type="datetime-local" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Fim
          <input className="gp-input" name="endsAt" type="datetime-local" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Preparo
          <textarea className="gp-input" name="preparationInstructions" rows={3} />
        </label>
        <SubmitButton disabled={appointmentPending} label="Agendar" pendingLabel="Agendando…" />
        <StateMessage state={appointmentState} />
      </form>
    </section>
  );
}

function Select({
  label,
  name,
  optional,
  options,
}: {
  label: string;
  name: string;
  optional?: boolean;
  options: readonly Option[];
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select className="gp-input" name={name} required={!optional}>
        <option value="">{optional ? "Sem vínculo" : "Selecione"}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({
  disabled,
  label,
  pendingLabel,
}: {
  disabled: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button className="gp-btn gp-btn-primary w-fit" disabled={disabled} type="submit">
      {disabled ? pendingLabel : label}
    </button>
  );
}

function StateMessage({ state }: { state: SchedulingFormState }) {
  if (state.error) return <p className="text-sm text-red-700">{state.error}</p>;
  if (state.success) return <p className="text-sm text-emerald-800">{state.success}</p>;
  return null;
}
