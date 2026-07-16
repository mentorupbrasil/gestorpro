import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageLoadError } from "@/components/ui/page-load-error";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BootstrapOperationsPanel } from "../_components/bootstrap-operations-panel";

export default async function ClinicalHubPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "clinical.read", "tenantOrUnit");
  if ("error" in auth) {
    return <PageLoadError title="Clínica ocupacional" detail={auth.error} />;
  }

  const permissions = auth.context.permissions;
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
  const stations = [
    {
      href: "/app/clinical/triage",
      label: "Triagem",
      enabled: permissions.has("triage.manage") || permissions.has("clinical.read"),
      detail: "Sinais vitais, fila e conclusão de etapa de enfermagem.",
    },
    {
      href: "/app/clinical/consultation",
      label: "Consulta",
      enabled: permissions.has("consultations.manage") || permissions.has("clinical.read"),
      detail: "Consulta ocupacional com credencial e SOAP estruturado.",
    },
    {
      href: "/app/clinical/conclusion",
      label: "Conclusão / ASO",
      enabled: permissions.has("conclusions.manage") || permissions.has("clinical.read"),
      detail: "Conclusão médica humana — sem aptidão automática.",
    },
  ].filter((station) => station.enabled);

  if (stations.length === 1) {
    redirect(stations[0]!.href);
  }

  return (
    <div>
      <PageHeader
        description="Estações separadas por perfil. Dados clínicos exigem MFA na escrita e não aparecem na recepção nem no portal empresarial."
        eyebrow="Clínica ocupacional"
        title="Estações clínicas"
      />
      {needsBootstrap ? (
        <BootstrapOperationsPanel
          canBootstrap={permissions.has("roles.manage")}
          reason="Tenant sem unidade e/ou formulário de triagem aprovado — as estações abrem, mas não operam."
        />
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {stations.map((station) => (
          <Surface className="p-4" key={station.href}>
            <h2 className="text-base font-semibold text-gp-text">{station.label}</h2>
            <p className="mt-2 text-sm text-gp-text-muted">{station.detail}</p>
            <Link className="gp-btn gp-btn-primary mt-4 inline-flex" href={station.href}>
              Abrir estação
            </Link>
          </Surface>
        ))}
      </div>
      {stations.length === 0 ? (
        <p className="mt-4 text-sm text-gp-text-muted">
          Seu perfil não possui estação clínica habilitada.
        </p>
      ) : null}
    </div>
  );
}
