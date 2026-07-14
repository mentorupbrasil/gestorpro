import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hasTenantOrUnitPermission, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { loadCompanyPortalOverview } from "@/features/portal/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PortalAdminForms } from "./portal-admin-forms";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(cents / 100);
}

type PortalPageProps = {
  searchParams?: Promise<{ company?: string }>;
};

export default async function CompanyPortalPage({ searchParams }: PortalPageProps) {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  const canManage = hasTenantOrUnitPermission(context, "company_portal.manage");
  const canReadTenant = hasTenantOrUnitPermission(context, "company_portal.read");

  const supabase = await createServerSupabaseClient();
  const [companiesResult, membershipsResult, tenantMembersResult] = await Promise.all([
    canReadTenant || canManage
      ? supabase
          .from("companies")
          .select("id, legal_name")
          .eq("tenant_id", context.tenantId)
          .order("legal_name")
          .limit(80)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("company_portal_users")
      .select("company_id, companies(legal_name)")
      .eq("tenant_id", context.tenantId)
      .eq("user_id", context.userId)
      .eq("status", "active"),
    canManage
      ? supabase
          .from("tenant_memberships")
          .select("user_id, user_profiles(display_name)")
          .eq("tenant_id", context.tenantId)
          .eq("status", "active")
          .order("created_at")
          .limit(120)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (companiesResult.error || membershipsResult.error || tenantMembersResult.error) {
    throw new Error("Não foi possível carregar o portal empresarial.");
  }

  const membershipCompanies = (membershipsResult.data ?? []).map((row) => {
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    return {
      id: row.company_id,
      label: company?.legal_name ?? row.company_id,
    };
  });

  const adminCompanies = (companiesResult.data ?? []).map((row) => ({
    id: row.id,
    label: row.legal_name,
  }));

  const membershipOptions = (tenantMembersResult.data ?? []).map((row) => {
    const profile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles;
    return {
      id: row.user_id,
      label: profile?.display_name ?? row.user_id,
    };
  });

  const selectableCompanies =
    canReadTenant || canManage
      ? adminCompanies.length > 0
        ? adminCompanies
        : membershipCompanies
      : membershipCompanies;

  if (!canReadTenant && !canManage && selectableCompanies.length === 0) {
    requirePermission(context, "company_portal.read");
  }

  const resolved = searchParams ? await searchParams : undefined;
  const requestedCompany = resolved?.company
    ? z.uuid().safeParse(resolved.company).data
    : undefined;
  const companyId =
    requestedCompany && selectableCompanies.some((item) => item.id === requestedCompany)
      ? requestedCompany
      : selectableCompanies[0]?.id;

  const overview = companyId ? await loadCompanyPortalOverview(selectedTenantId, companyId) : null;

  return (
    <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4">
      <header className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Portal empresarial
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Visão da empresa</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Sem prontuário clínico. Status operacional sanitizado, documentos só pela matriz de
          liberação e faturas da empresa selecionada.
        </p>
      </header>

      {selectableCompanies.length > 0 ? (
        <nav className="mt-5 flex flex-wrap gap-2">
          {selectableCompanies.map((company) => (
            <Link
              className={`rounded-full border px-3 py-1 text-sm ${
                company.id === companyId
                  ? "border-emerald-800 bg-emerald-900 text-white"
                  : "border-slate-200 bg-white"
              }`}
              href={`/app/portal?company=${company.id}`}
              key={company.id}
            >
              {company.label}
            </Link>
          ))}
        </nav>
      ) : (
        <p className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
          Nenhum vínculo de portal ativo para este usuário.
        </p>
      )}

      {canManage ? (
        <PortalAdminForms companyOptions={adminCompanies} membershipOptions={membershipOptions} />
      ) : null}

      {overview ? (
        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <Panel title="Atendimentos (sanitizado)">
            {overview.encountersSafe.length === 0 ? (
              <Empty text="Nenhum atendimento." />
            ) : (
              overview.encountersSafe.map((item) => (
                <li className="py-2 text-sm" key={item.id}>
                  <span className="font-medium">{item.statusLabel}</span>
                  <span className="ml-2 text-slate-500">
                    {item.checkedInAt ? new Date(item.checkedInAt).toLocaleString("pt-BR") : "—"}
                  </span>
                </li>
              ))
            )}
          </Panel>
          <Panel title="Documentos liberados">
            {overview.releasedDocuments.length === 0 ? (
              <Empty text="Nenhum documento na matriz." />
            ) : (
              overview.releasedDocuments.map((item) => (
                <li className="py-2 text-sm" key={item.id}>
                  <span className="font-medium">{item.documentType}</span>
                  <span className="ml-2 text-slate-500">
                    {item.status} · v{item.currentVersion ?? 1}
                  </span>
                </li>
              ))
            )}
          </Panel>
          <Panel title="Faturas">
            {overview.invoices.length === 0 ? (
              <Empty text="Nenhuma fatura." />
            ) : (
              overview.invoices.map((item) => (
                <li className="py-2 text-sm" key={item.id}>
                  <span className="font-medium">{money(item.totalCents)}</span>
                  <span className="ml-2 text-slate-500">{item.status}</span>
                </li>
              ))
            )}
          </Panel>
        </section>
      ) : null}

      {overview && overview.releaseRules.length > 0 ? (
        <section className="mt-5 rounded-3xl border bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Matriz vigente</h2>
          <ul className="mt-3 divide-y text-sm">
            {overview.releaseRules.map((rule) => (
              <li className="flex justify-between gap-3 py-2" key={rule.documentType}>
                <span>{rule.documentType}</span>
                <span className="text-slate-600">
                  {rule.releaseToCompany ? "liberado" : "bloqueado"} · {rule.redactionProfile}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function Panel({ children, title }: Readonly<{ children: React.ReactNode; title: string }>) {
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
