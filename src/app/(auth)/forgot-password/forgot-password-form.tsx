"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <form action={action} className="grid gap-4" noValidate>
      <label className="grid gap-1 text-sm font-medium">
        E-mail
        <input
          className="rounded border border-slate-300 px-3 py-2"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      {state.error ? (
        <p role="alert" aria-live="polite" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p role="status" aria-live="polite" className="text-sm text-emerald-800">
          {state.message}
        </p>
      ) : null}
      <button
        className="rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Enviando…" : "Enviar instruções"}
      </button>
      <Link className="text-sm text-slate-700 underline-offset-4 hover:underline" href="/sign-in">
        Voltar para o acesso
      </Link>
    </form>
  );
}
