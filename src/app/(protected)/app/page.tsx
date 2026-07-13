import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";

const modules = [
  {
    description: "Empresas, trabalhadores, GHE, riscos, PCMSO, protocolos e catálogo.",
    href: "/app/occupational",
    label: "Domínio ocupacional",
    status: "operacional inicial",
  },
  {
    description: "Encaminhamentos, recursos, agenda e lista operacional da recepção.",
    href: "/app/scheduling",
    label: "Encaminhamentos e agenda",
    status: "operacional inicial",
  },
  {
    description: "Check-in transacional, snapshot, etapas, tickets e filas.",
    href: "/app/check-in",
    label: "Check-in e filas",
    status: "operacional inicial",
  },
  {
    description: "Chamadas persistidas com payload mínimo para TV.",
    href: "/app/display",
    label: "Painel de chamadas",
    status: "operacional inicial",
  },
  {
    description: "Triagem, consulta e conclusão humana com proteção clínica.",
    href: "/app/clinical",
    label: "Área clínica",
    status: "validação clínica futura",
  },
  {
    description: "Acuidade, audiometria, espirometria, diagnósticos e laboratório.",
    href: "/app/exams/spirometry",
    label: "Exames complementares",
    status: "fechamento em andamento",
  },
  {
    description: "Templates, versões imutáveis, assinatura, entrega e auditoria.",
    href: "/app/documents",
    label: "Documentos",
    status: "console inicial",
  },
  {
    description: "Contratos, preços, faturamento, faturas, pagamentos e portal.",
    href: "/app/finance",
    label: "Financeiro e portal",
    status: "console inicial",
  },
  {
    description: "Webhooks, eSocial, mensagens, equipamentos e conector local.",
    href: "/app/integrations",
    label: "Integrações",
    status: "console inicial",
  },
];

export default async function WorkspacePage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "tenant.read");

  return (
    <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4">
      <header className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
            GestorPro · Unimetra
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Central operacional da clínica
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Visão compacta dos módulos já estruturados. Checkpoints técnicos não substituem GO de
            produção: validações humanas, E2E ponta a ponta, carga, backup/restore e revisão de
            segurança continuam obrigatórios.
          </p>
        </div>
      </header>

      <section className="mt-5 grid gap-4 md:grid-cols-3" aria-label="Estado do projeto">
        <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Segurança</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">MFA + RLS</p>
          <p className="mt-2 text-sm text-slate-600">
            Isolamento tenant A/B validado anteriormente; typegen oficial ainda pendente.
          </p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Produção</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">NO-GO</p>
          <p className="mt-2 text-sm text-slate-600">
            Sem dados reais até validações humanas, pentest, carga e restauração.
          </p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">UX</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">Em revisão</p>
          <p className="mt-2 text-sm text-slate-600">
            Telas operacionais faltantes estão sendo fechadas em console inicial.
          </p>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Módulos do MVP</h2>
            <p className="mt-1 text-sm text-slate-600">
              Use esta lista como mapa rápido do que já tem base navegável.
            </p>
          </div>
          <Link
            className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            href="/app/check-in"
          >
            Abrir operação
          </Link>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3">Módulo</th>
                <th className="px-3 py-3">Cobertura</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <tr className="border-b border-slate-100 last:border-0" key={module.href}>
                  <td className="px-3 py-4 font-semibold text-slate-900">{module.label}</td>
                  <td className="max-w-xl px-3 py-4 text-slate-600">{module.description}</td>
                  <td className="px-3 py-4">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                      {module.status}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <Link
                      className="font-semibold text-emerald-800 underline-offset-4 hover:underline"
                      href={module.href}
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
