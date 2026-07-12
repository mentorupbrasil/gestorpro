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
          className="rounded border border-slate-300 px-3 py-2"
          inputMode="numeric"
          maxLength={6}
          name="code"
          pattern="[0-9]{6}"
          required
        />
      </label>
      <button
        className="rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
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
