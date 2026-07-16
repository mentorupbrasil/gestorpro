"use client";

import { useActionState } from "react";
import { verifyTotpChallenge, type TotpVerificationState } from "./actions";

type TotpChallengeFormProps = {
  factorId: string;
};

const initialState: TotpVerificationState = {};

export function TotpChallengeForm({ factorId }: TotpChallengeFormProps) {
  const [state, action, pending] = useActionState(verifyTotpChallenge, initialState);

  return (
    <form action={action} className="mt-4 grid max-w-sm gap-3">
      <input name="factorId" type="hidden" value={factorId} />
      <label className="grid gap-1 text-sm font-medium">
        Código do autenticador
        <input
          className="gp-input"
          inputMode="numeric"
          maxLength={6}
          name="code"
          pattern="[0-9]{6}"
          required
        />
      </label>
      <button className="gp-btn gp-btn-primary" disabled={pending} type="submit">
        {pending ? "Confirmando…" : "Confirmar sessão"}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
