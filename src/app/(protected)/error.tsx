"use client";

export default function ProtectedError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <section className="border-l-4 border-red-700 bg-red-50 p-6" aria-labelledby="error-title">
        <h1 id="error-title" className="text-xl font-semibold">
          Não foi possível carregar esta área
        </h1>
        <p className="mt-2 text-slate-700">
          Verifique sua sessão e tente novamente. Nenhuma alteração foi realizada.
        </p>
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
