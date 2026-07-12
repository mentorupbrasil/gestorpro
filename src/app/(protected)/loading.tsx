export default function ProtectedLoading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16" aria-busy="true" aria-live="polite">
      <p className="animate-pulse text-slate-600">Carregando contexto autorizado…</p>
    </main>
  );
}
