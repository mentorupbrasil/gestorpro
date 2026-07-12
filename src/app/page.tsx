import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section
        aria-labelledby="page-title"
        className="w-full border-l-4 border-emerald-700 bg-white p-8 shadow-sm"
      >
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-800">
          GestorPro · Unimetra
        </p>
        <h1 id="page-title" className="text-3xl font-semibold">
          Fundação segura da plataforma
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-700">
          A base técnica está sendo preparada. Nenhum atendimento, dado clínico ou decisão médica é
          processado nesta etapa.
        </p>
        <Link
          className="mt-6 inline-flex rounded bg-emerald-800 px-4 py-2 font-semibold text-white"
          href="/sign-in"
        >
          Acessar a plataforma
        </Link>
      </section>
    </main>
  );
}
