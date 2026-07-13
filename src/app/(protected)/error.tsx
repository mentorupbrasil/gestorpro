"use client";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const detail =
    error.message &&
    !error.message.includes("Server Components render") &&
    !error.message.includes("digest")
      ? error.message
      : "Verifique sua sessão, permissões e migrations do Supabase. Nenhuma alteração foi realizada.";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <section className="border-l-4 border-red-700 bg-red-50 p-6" aria-labelledby="error-title">
        <h1 id="error-title" className="text-xl font-semibold">
          Não foi possível carregar esta área
        </h1>
        <p className="mt-2 text-slate-700">{detail}</p>
        <button
          className="mt-5 rounded bg-slate-900 px-4 py-2 font-semibold text-white"
          onClick={reset}
          type="button"
        >
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
