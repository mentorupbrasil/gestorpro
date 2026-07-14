"use client";

import { useActionState } from "react";
import { checkInAction, type CheckInFormState } from "./actions";

type AppointmentOption = { id: string; label: string };

const initialState: CheckInFormState = {};

export function CheckInForm({ appointments }: { appointments: readonly AppointmentOption[] }) {
  const [state, action, pending] = useActionState(checkInAction, initialState);

  return (
    <form action={action} className="mt-0 grid gap-3 gp-surface p-4">
      <h2 className="text-base font-semibold text-gp-text">Check-in</h2>
      <label className="grid gap-1 text-sm font-medium">
        Agendamento
        <select className="gp-input" name="appointmentId" required>
          <option value="">Selecione</option>
          {appointments.map((appointment) => (
            <option key={appointment.id} value={appointment.id}>
              {appointment.label}
            </option>
          ))}
        </select>
      </label>
      <button className="gp-btn gp-btn-primary w-fit" disabled={pending} type="submit">
        {pending ? "Registrando…" : "Realizar check-in"}
      </button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-800">{state.success}</p> : null}
    </form>
  );
}
