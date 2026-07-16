import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BootstrapOperationsPanel } from "./_components/bootstrap-operations-panel";

const modules = [
  {
    description: "Empresas, trabalhadores, GHE, riscos, PCMSO, protocolos e catálogo.",
    href: "/app/occupational",
    label: "Domínio ocupacional",
    status: "código pronto",
  },
  {
    description: "Encaminhamentos, recursos, agenda e lista operacional da recepção.",
    href: "/app/scheduling",
    label: "Encaminhamentos e agenda",
    status: "código pronto",
  },
  {
    description: "Check-in transacional, snapshot, etapas, tickets e filas.",
    href: "/app/check-in",
    label: "Check-in e filas",
    status: "código pronto",
  },
  {
    description: "Chamadas persistidas com payload mínimo para TV.",
    href: "/app/display",
    label: "Painel de chamadas",
    status: "código pronto",
  },
  {
    description: "Triagem, consulta e conclusão humana com proteção clínica.",
    href: "/app/clinical",
    label: "Área clínica",
    status: "código pronto",
  },
  {
    description: "Acuidade, audiometria, espirometria, diagnósticos e laboratório.",
    href: "/app/exams/visual-acuity",
    label: "Exames complementares",
    status: "código pronto",
  },
  {
    description: "Templates, versões imutáveis, assinatura e auditoria.",
    href: "/app/documents",
    label: "Documentos",
    status: "código pronto",
  },
  {
    description: "Contratos, preços, faturamento, faturas e pagamentos.",
    href: "/app/finance",
    label: "Financeiro",
    status: "código pronto",
  },
  {
    description: "Visão sanitizada da empresa: status, documentos e faturas.",
    href: "/app/portal",
    label: "Portal empresarial",
    status: "código pronto",
  },
  {
    description: "Webhooks, eSocial, mensagens, equipamentos e conector local.",
    href: "/app/integrations",
    label: "Integrações",
    status: "código pronto",
  },
];

export default async function WorkspacePage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "tenant.read");

  const supabase = await createServerSupabaseClient();
  const [{ count: unitCount }, { count: formCount }] = await Promise.all([
    supabase
      .from("clinic_units")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", selectedTenantId)
      .eq("status", "active"),
    supabase
      .from("triage_form_versions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", selectedTenantId)
      .eq("status", "approved"),
  ]);
  const needsBootstrap = (unitCount ?? 0) === 0 || (formCount ?? 0) === 0;

  return (
    <div>
      <PageHeader
        actions={
          <Link className="gp-btn gp-btn-primary" href="/app/check-in">
            Abrir operação
          </Link>
        }
        description="Código na branch ≠ tenant configurado. Produção permanece NO-GO até validações humanas."
        eyebrow="Central"
        title="Visão geral"
      />

      {needsBootstrap ? (
        <BootstrapOperationsPanel
          canBootstrap={context.permissions.has("roles.manage")}
          reason="Este tenant ainda não está operacional: falta unidade e/ou formulário de triagem aprovado."
        />
      ) : null}

      <div className="mb-4 mt-4 grid gap-3 sm:grid-cols-3">
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
          <p className="text-xs font-semibold uppercase tracking-wide text-gp-text-muted">
            Tenant
          </p>
          <p className="mt-1 text-base font-semibold">
            {needsBootstrap ? "Setup pendente" : "Base ok"}
          </p>
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
