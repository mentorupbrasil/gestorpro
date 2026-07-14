import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { PageHeader, Surface } from "@/components/ui/page-chrome";

const modules = [
  {
    description: "Empresas, trabalhadores, GHE, riscos, PCMSO, protocolos e catálogo.",
    href: "/app/occupational",
    label: "Domínio ocupacional",
    status: "operacional",
  },
  {
    description: "Encaminhamentos, recursos, agenda e lista operacional da recepção.",
    href: "/app/scheduling",
    label: "Encaminhamentos e agenda",
    status: "operacional",
  },
  {
    description: "Check-in transacional, snapshot, etapas, tickets e filas.",
    href: "/app/check-in",
    label: "Check-in e filas",
    status: "operacional",
  },
  {
    description: "Chamadas persistidas com payload mínimo para TV.",
    href: "/app/display",
    label: "Painel de chamadas",
    status: "operacional",
  },
  {
    description: "Triagem, consulta e conclusão humana com proteção clínica.",
    href: "/app/clinical",
    label: "Área clínica",
    status: "operacional",
  },
  {
    description: "Acuidade, audiometria, espirometria, diagnósticos e laboratório.",
    href: "/app/exams/visual-acuity",
    label: "Exames complementares",
    status: "operacional",
  },
  {
    description: "Templates, versões imutáveis, assinatura e auditoria.",
    href: "/app/documents",
    label: "Documentos",
    status: "operacional",
  },
  {
    description: "Contratos, preços, faturamento, faturas e pagamentos.",
    href: "/app/finance",
    label: "Financeiro",
    status: "operacional",
  },
  {
    description: "Visão sanitizada da empresa: status, documentos e faturas.",
    href: "/app/portal",
    label: "Portal empresarial",
    status: "operacional",
  },
  {
    description: "Webhooks, eSocial, mensagens, equipamentos e conector local.",
    href: "/app/integrations",
    label: "Integrações",
    status: "operacional",
  },
];

export default async function WorkspacePage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "tenant.read");

  return (
    <div>
      <PageHeader
        actions={
          <Link className="gp-btn gp-btn-primary" href="/app/check-in">
            Abrir operação
          </Link>
        }
        description="Mapa compacto dos módulos navegáveis. Produção permanece NO-GO até validações humanas."
        eyebrow="Central"
        title="Visão geral"
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Surface className="p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gp-text-muted">
            Segurança
          </p>
          <p className="mt-1 text-base font-semibold">MFA + RLS</p>
        </Surface>
        <Surface className="p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gp-text-muted">
            Produção
          </p>
          <p className="mt-1 text-base font-semibold text-gp-warning">NO-GO</p>
        </Surface>
        <Surface className="p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gp-text-muted">Layout</p>
          <p className="mt-1 text-base font-semibold">Em lapidação</p>
        </Surface>
      </div>

      <Surface className="overflow-x-auto">
        <table className="gp-table">
          <thead>
            <tr>
              <th>Módulo</th>
              <th>Cobertura</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module.href}>
                <td className="font-medium text-gp-text">{module.label}</td>
                <td className="max-w-xl text-gp-text-muted">{module.description}</td>
                <td>
                  <span className="gp-badge">{module.status}</span>
                </td>
                <td>
                  <Link
                    className="font-semibold text-gp-accent-strong underline-offset-2 hover:underline"
                    href={module.href}
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>
    </div>
  );
}
