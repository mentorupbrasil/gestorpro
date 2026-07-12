"use client";

import { useActionState } from "react";
import { unenrollTotpFactor, type TotpVerificationState } from "./actions";

type TotpUnenrollFormProps = {
  factorId: string;
};

const initialState: TotpVerificationState = {};

export function TotpUnenrollForm({ factorId }: TotpUnenrollFormProps) {
  const [state, action, pending] = useActionState(unenrollTotpFactor, initialState);

  return (
    <form
      action={action}
      className="grid gap-2"
      onSubmit={(event) => {
        if (!window.confirm("Remover este fator MFA da sua conta?")) event.preventDefault();
      }}
    >
      <input name="factorId" type="hidden" value={factorId} />
      <button
        className="text-sm font-semibold text-red-700 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Removendo…" : "Remover"}
      </button>
      {state.error ? (
        <span role="alert" className="text-xs text-red-700">
          {state.error}
        </span>
      ) : null}
      {state.success ? (
        <span role="status" className="text-xs text-emerald-800">
          {state.success}
        </span>
      ) : null}
    </form>
  );
}
