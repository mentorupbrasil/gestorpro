import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <section
        className="w-full rounded border border-slate-200 bg-white p-8 shadow-sm"
        aria-labelledby="sign-in-title"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          GestorPro · Unimetra
        </p>
        <h1 id="sign-in-title" className="mt-2 text-2xl font-semibold">
          Acesso seguro
        </h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">
          Use sua conta autorizada. Ações sensíveis são auditadas.
        </p>
        <SignInForm />
      </section>
    </main>
  );
}
