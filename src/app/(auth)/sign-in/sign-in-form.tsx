"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "./actions";

const initialState: SignInState = {};

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, initialState);

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
      <label className="grid gap-1 text-sm font-medium">
        Senha
        <input
          className="rounded border border-slate-300 px-3 py-2"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
        />
      </label>
      {state.error ? (
        <p role="alert" aria-live="polite" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        className="rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
