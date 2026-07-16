import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-chrome";
import { PageLoadError } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function OperationsPendenciesPage() {
  const tenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!tenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(tenantId, "audit.read", "tenantOrUnit");
  if ("error" in auth) {
    const fallback = await loadWorkspaceAuth(tenantId, "tenant.manage", "tenant");
    if ("error" in fallback) {
      return <PageLoadError title="Pendências operacionais" detail={auth.error} />;
    }
  }

  const supabase = await createServerSupabaseClient();
  const [pendingDocs, openSteps, offlinePanels, deadLetters] = await Promise.all([
    supabase
      .from("document_versions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("render_status", "pending"),
    supabase
      .from("encounter_steps")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["available", "in_progress", "blocked", "pending"]),
    supabase
      .from("display_panels")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "active"),
    supabase
      .from("integration_dead_letters")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
  ]);

  const cards = [
    {
      label: "Documentos pending (render)",
      value: pendingDocs.count ?? 0,
      hint: "PDF ainda não gravado/finalizado",
    },
    {
      label: "Etapas abertas",
      value: openSteps.count ?? 0,
      hint: "Inclui blocked/available/in_progress",
    },
    {
      label: "Painéis cadastrados ativos",
      value: offlinePanels.count ?? 0,
      hint: "Status active no cadastro; sessões online exigem heartbeat separado",
    },
    {
      label: "Integrações em dead letter",
      value: deadLetters.error ? null : (deadLetters.count ?? 0),
      hint: deadLetters.error
        ? "Tabela ausente ou sem permissão de leitura"
        : "Reprocessar com auditoria",
    },
  ];

  return (
    <div>
      <PageHeader
        description="Visão operacional sem PHI: contagens e bloqueios técnicos apenas."
        eyebrow="Operações"
        title="Pendências operacionais"
      />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {cards.map((card) => (
          <div className="gp-surface p-4" key={card.label}>
            <p className="text-sm text-gp-text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value === null ? "—" : card.value}</p>
            <p className="mt-1 text-sm text-gp-text-muted">{card.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
