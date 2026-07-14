import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageLoadError, describeSupabaseFailure } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readEmbeddedRelation } from "@/lib/supabase/relations";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { SstWorkspaceForms } from "./sst-forms";

export default async function SstPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "sst.read");
  if ("error" in auth) {
    return <PageLoadError title="Incidentes, EPI e CIPA (scaffold)" detail={auth.error} />;
  }
  const context = auth.context;

  const supabase = await createServerSupabaseClient();
  const [companiesResult, workersResult, incidentsResult, epiResult, cipaResult] =
    await Promise.all([
      supabase
        .from("companies")
        .select("id, legal_name")
        .eq("tenant_id", context.tenantId)
        .order("legal_name")
        .limit(80),
      supabase
        .from("workers")
        .select("id, full_name")
        .eq("tenant_id", context.tenantId)
        .order("full_name")
        .limit(80),
      supabase
        .from("sst_incidents")
        .select("id, incident_type, severity, status, occurred_at, companies(legal_name)")
        .eq("tenant_id", context.tenantId)
        .order("occurred_at", { ascending: false })
        .limit(30),
      supabase
        .from("sst_epi_issues")
        .select("id, epi_code, epi_name, status, issued_at, workers(full_name)")
        .eq("tenant_id", context.tenantId)
        .order("issued_at", { ascending: false })
        .limit(30),
      supabase
        .from("sst_cipa_memberships")
        .select(
          "id, role_label, status, mandate_starts_on, workers(full_name), companies(legal_name)",
        )
        .eq("tenant_id", context.tenantId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  if (
    companiesResult.error ||
    workersResult.error ||
    incidentsResult.error ||
    epiResult.error ||
    cipaResult.error
  ) {
    return (
      <PageLoadError
        title="Incidentes, EPI e CIPA (scaffold)"
        detail={describeSupabaseFailure(
          [companiesResult, workersResult, incidentsResult, epiResult, cipaResult],
          "Não foi possível carregar SST.",
        )}
      />
    );
  }

  const companies = companiesResult.data ?? [];
  const workers = workersResult.data ?? [];
  const incidents = incidentsResult.data ?? [];
  const epiIssues = epiResult.data ?? [];
  const cipa = cipaResult.data ?? [];

  return (
    <div>
      <PageHeader
        description="Registro operacional multi-tenant. Não é CAT, PPP, LTCAT nem PGR — sem pretensão jurídica/documental completa nesta fase."
        eyebrow="SST operacional"
        title="Incidentes, EPI e CIPA (scaffold)"
      />

      <SstWorkspaceForms
        companyOptions={companies.map((item) => ({ id: item.id, label: item.legal_name }))}
        workerOptions={workers.map((item) => ({ id: item.id, label: item.full_name }))}
      />

      <section className="mt-4 grid gap-3 lg:grid-cols-3">
        <Panel title="Incidentes">
          {incidents.length === 0 ? (
            <Empty text="Nenhum incidente." />
          ) : (
            incidents.map((item) => (
              <li className="py-2 text-sm" key={item.id}>
                <span className="font-semibold text-gp-text">
                  {item.incident_type} · {item.severity}
                </span>
                <span className="ml-2 text-gp-text-muted">
                  {readEmbeddedRelation(item.companies)?.legal_name ?? "Empresa"} · {item.status}
                </span>
              </li>
            ))
          )}
        </Panel>
        <Panel title="EPI">
          {epiIssues.length === 0 ? (
            <Empty text="Nenhuma entrega." />
          ) : (
            epiIssues.map((item) => (
              <li className="py-2 text-sm" key={item.id}>
                <span className="font-semibold text-gp-text">
                  {item.epi_code} · {item.epi_name}
                </span>
                <span className="ml-2 text-gp-text-muted">
                  {readEmbeddedRelation(item.workers)?.full_name ?? "Trabalhador"} · {item.status}
                </span>
              </li>
            ))
          )}
        </Panel>
        <Panel title="CIPA">
          {cipa.length === 0 ? (
            <Empty text="Nenhum membro." />
          ) : (
            cipa.map((item) => (
              <li className="py-2 text-sm" key={item.id}>
                <span className="font-medium text-gp-text">{item.role_label}</span>
                <span className="ml-2 text-gp-text-muted">
                  {readEmbeddedRelation(item.workers)?.full_name ?? "Trabalhador"} · {item.status}
                </span>
              </li>
            ))
          )}
        </Panel>
      </section>
    </div>
  );
}

function Panel({ children, title }: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <Surface className="p-4">
      <h2 className="text-base font-semibold text-gp-text">{title}</h2>
      <ul className="mt-3 divide-y divide-gp-border">{children}</ul>
    </Surface>
  );
}

function Empty({ text }: Readonly<{ text: string }>) {
  return <li className="py-2 text-sm text-gp-text-muted">{text}</li>;
}
