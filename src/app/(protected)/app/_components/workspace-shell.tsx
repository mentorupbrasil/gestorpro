import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "../actions";

const navigationGroups = [
  {
    items: [
      { href: "/app", label: "Visão geral" },
      { href: "/app/units", label: "Unidades" },
      { href: "/app/access", label: "Acessos" },
      { href: "/app/security", label: "Segurança" },
    ],
    label: "Plataforma",
  },
  {
    items: [
      { href: "/app/occupational", label: "Empresas e PCMSO" },
      { href: "/app/scheduling", label: "Encaminhamentos" },
      { href: "/app/check-in", label: "Check-in e filas" },
      { href: "/app/display", label: "Painel de chamadas" },
    ],
    label: "Operação",
  },
  {
    items: [
      { href: "/app/clinical", label: "Clínica" },
      { href: "/app/exams/visual-acuity", label: "Acuidade" },
      { href: "/app/exams/audiometry", label: "Audiometria" },
      { href: "/app/exams/spirometry", label: "Espirometria" },
      { href: "/app/exams/diagnostics", label: "ECG/EEG/RX" },
      { href: "/app/exams/laboratory", label: "Laboratório" },
    ],
    label: "Atendimento",
  },
  {
    items: [
      { href: "/app/documents", label: "Documentos" },
      { href: "/app/finance", label: "Financeiro" },
      { href: "/app/portal", label: "Portal empresa" },
      { href: "/app/integrations", label: "Integrações" },
    ],
    label: "Fechamento",
  },
];

export function WorkspaceShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d8f3e5_0,#f5f7f6_36rem,#eef2f0_100%)] text-slate-950">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-emerald-900 focus:px-4 focus:py-2 focus:text-white"
        href="#conteudo-principal"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-4 rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
            <div className="rounded-2xl bg-emerald-950 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
                GestorPro
              </p>
              <p className="mt-2 text-xl font-semibold">Unimetra Ocupacional</p>
              <p className="mt-2 text-xs text-emerald-100">
                Operação clínica com rastreabilidade, segurança e isolamento por tenant.
              </p>
            </div>

            <nav className="mt-5 space-y-5" aria-label="Módulos do sistema">
              {navigationGroups.map((group) => (
                <section key={group.label}>
                  <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {group.label}
                  </h2>
                  <ul className="mt-2 space-y-1">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          href={item.href}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-4 rounded-3xl border border-white/70 bg-white/85 px-4 py-4 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">
                  Ambiente seguro
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Dados fictícios em desenvolvimento. Produção segue bloqueada até GO formal.
                </p>
              </div>
              <form action={signOut}>
                <button
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  type="submit"
                >
                  Sair
                </button>
              </form>
            </div>
            <nav className="mt-4 overflow-x-auto lg:hidden" aria-label="Navegação compacta">
              <ul className="flex min-w-max gap-2">
                {navigationGroups.flatMap((group) =>
                  group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        className="block rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                        href={item.href}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )),
                )}
              </ul>
            </nav>
          </header>

          <div id="conteudo-principal">{children}</div>
        </div>
      </div>
    </div>
  );
}
