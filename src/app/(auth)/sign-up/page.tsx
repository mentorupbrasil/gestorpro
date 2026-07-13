import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <section
        className="w-full rounded border border-slate-200 bg-white p-8 shadow-sm"
        aria-labelledby="sign-up-title"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          GestorPro · Unimetra
        </p>
        <h1 id="sign-up-title" className="mt-2 text-2xl font-semibold">
          Começar agora
        </h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">
          Crie sua conta e sua primeira organização. Você será administrador inicial da clínica.
        </p>
        <SignUpForm />
      </section>
    </main>
  );
}
