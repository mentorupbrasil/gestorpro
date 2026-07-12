import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <section
        className="w-full rounded border border-slate-200 bg-white p-8 shadow-sm"
        aria-labelledby="forgot-password-title"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          GestorPro · Unimetra
        </p>
        <h1 id="forgot-password-title" className="mt-2 text-2xl font-semibold">
          Recuperar acesso
        </h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">
          Enviaremos um link seguro para redefinir sua senha, se a conta estiver ativa.
        </p>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
