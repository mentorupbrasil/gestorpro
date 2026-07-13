"use client";

import { useActionState } from "react";
import { checkInAction, type CheckInFormState } from "./actions";

type AppointmentOption = { id: string; label: string };

const initialState: CheckInFormState = {};

export function CheckInForm({ appointments }: { appointments: readonly AppointmentOption[] }) {
  const [state, action, pending] = useActionState(checkInAction, initialState);

  return (
    <form action={action} className="mt-8 grid gap-4 border-t border-slate-200 pt-5">
      <h2 className="text-lg font-semibold">Check-in</h2>
      <label className="grid gap-1 text-sm font-medium">
        Agendamento
        <select className="rounded border border-slate-300 px-3 py-2" name="appointmentId" required>
          <option value="">Selecione</option>
          {appointments.map((appointment) => (
            <option key={appointment.id} value={appointment.id}>
              {appointment.label}
            </option>
          ))}
        </select>
      </label>
      <button
        className="w-fit rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Registrando…" : "Realizar check-in"}
      </button>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-800">{state.success}</p> : null}
    </form>
  );
}
