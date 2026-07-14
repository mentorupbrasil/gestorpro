import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readEmbeddedRelation } from "@/lib/supabase/relations";
import { SstWorkspaceForms } from "./sst-forms";

export default async function SstPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "sst.read");

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
        .select("id, role_label, status, mandate_starts_on, workers(full_name), companies(legal_name)")
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
    throw new Error("Não foi possível carregar SST.");
  }

  const companies = companiesResult.data ?? [];
  const workers = workersResult.data ?? [];
  const incidents = incidentsResult.data ?? [];
  const epiIssues = epiResult.data ?? [];
  const cipa = cipaResult.data ?? [];

  return (
    <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4">
      <header className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          SST operacional
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Incidentes, EPI e CIPA (scaffold)
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Registro operacional multi-tenant. Não é CAT, PPP, LTCAT nem PGR — sem pretensão
          jurídica/documental completa nesta fase.
        </p>
      </header>

      <SstWorkspaceForms
        companyOptions={companies.map((item) => ({ id: item.id, label: item.legal_name }))}
        workerOptions={workers.map((item) => ({ id: item.id, label: item.full_name }))}
      />

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <Panel title="Incidentes">
          {incidents.length === 0 ? (
            <Empty text="Nenhum incidente." />
          ) : (
            incidents.map((item) => (
              <li className="py-2 text-sm" key={item.id}>
                <span className="font-medium">
                  {item.incident_type} · {item.severity}
                </span>
                <span className="ml-2 text-slate-500">
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
                <span className="font-medium">
                  {item.epi_code} · {item.epi_name}
                </span>
                <span className="ml-2 text-slate-500">
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
                <span className="font-medium">{item.role_label}</span>
                <span className="ml-2 text-slate-500">
                  {readEmbeddedRelation(item.workers)?.full_name ?? "Trabalhador"} · {item.status}
                </span>
              </li>
            ))
          )}
        </Panel>
      </section>
    </main>
  );
}

function Panel({
  children,
  title,
}: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-3 divide-y divide-slate-100">{children}</ul>
    </div>
  );
}

function Empty({ text }: Readonly<{ text: string }>) {
  return <li className="py-2 text-sm text-slate-600">{text}</li>;
}
