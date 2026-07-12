"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePassword, type UpdatePasswordState } from "./actions";

const initialState: UpdatePasswordState = {};

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={action} className="grid gap-4" noValidate>
      <label className="grid gap-1 text-sm font-medium">
        Nova senha
        <input
          className="rounded border border-slate-300 px-3 py-2"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Confirmar nova senha
        <input
          className="rounded border border-slate-300 px-3 py-2"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={12}
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
        {pending ? "Atualizando…" : "Atualizar senha"}
      </button>
      <Link className="text-sm text-slate-700 underline-offset-4 hover:underline" href="/sign-in">
        Voltar para o acesso
      </Link>
    </form>
  );
}
