"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type SignUpState } from "./actions";

const initialState: SignUpState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initialState);

  return (
    <form action={action} className="grid gap-4" noValidate>
      <label className="grid gap-1 text-sm font-medium">
        Seu nome
        <input
          autoComplete="name"
          className="rounded border border-slate-300 px-3 py-2"
          name="displayName"
          required
          type="text"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        E-mail
        <input
          autoComplete="email"
          className="rounded border border-slate-300 px-3 py-2"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Senha
        <input
          autoComplete="new-password"
          className="rounded border border-slate-300 px-3 py-2"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Razão social da clínica/empresa
        <input
          className="rounded border border-slate-300 px-3 py-2"
          name="legalName"
          placeholder="Nome jurídico da organização"
          required
          type="text"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Nome fantasia (opcional)
        <input
          className="rounded border border-slate-300 px-3 py-2"
          name="tradeName"
          placeholder="Como aparece no dia a dia"
          type="text"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-800" role="status">
          {state.success}
        </p>
      ) : null}
      <button
        className="rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Criando conta…" : "Criar conta e organização"}
      </button>
      <Link
        className="text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline"
        href="/sign-in"
      >
        Já tenho conta
      </Link>
    </form>
  );
}
