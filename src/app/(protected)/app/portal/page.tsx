import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AuthorizationContext } from "@/core/auth/authorization";
import { hasTenantOrUnitPermission, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { PageLoadError, describeSupabaseFailure } from "@/components/ui/page-load-error";
import { loadCompanyPortalOverview } from "@/features/portal/service";
import { PORTAL_USER_COMPANY_EMBED } from "@/lib/supabase/embeds";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
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

  let context: AuthorizationContext;
  try {
    context = await resolveAuthorizationContext(selectedTenantId);
  } catch (error) {
    return (
      <PageLoadError
        title="Visão da empresa"
        detail={error instanceof Error ? error.message : "Falha ao validar sessão ou permissões."}
      />
    );
  }
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
      .select(`company_id, ${PORTAL_USER_COMPANY_EMBED}(legal_name)`)
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
    return (
      <PageLoadError
        title="Visão da empresa"
        detail={describeSupabaseFailure(
          [companiesResult, membershipsResult, tenantMembersResult],
          "Não foi possível carregar o portal empresarial.",
        )}
      />
    );
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
    try {
      requirePermission(context, "company_portal.read");
    } catch (error) {
      return (
        <PageLoadError
          title="Visão da empresa"
          detail={
            error instanceof Error
              ? error.message
              : "Você não possui permissão para acessar o portal."
          }
        />
      );
    }
  }

  const resolved = searchParams ? await searchParams : undefined;
  const requestedCompany = resolved?.company
    ? z.uuid().safeParse(resolved.company).data
    : undefined;
  const companyId =
    requestedCompany && selectableCompanies.some((item) => item.id === requestedCompany)
      ? requestedCompany
      : selectableCompanies[0]?.id;

  let overview: Awaited<ReturnType<typeof loadCompanyPortalOverview>> | null = null;
  let overviewError: string | null = null;
  if (companyId) {
    try {
      overview = await loadCompanyPortalOverview(selectedTenantId, companyId);
    } catch (error) {
      overviewError =
        error instanceof Error ? error.message : "Não foi possível carregar os dados da empresa.";
    }
  }

  return (
    <div>
      <PageHeader
        description="Sem prontuário clínico. Status operacional sanitizado, documentos só pela matriz de liberação e faturas da empresa selecionada."
        eyebrow="Portal empresarial"
        title="Visão da empresa"
      />

      {selectableCompanies.length > 0 ? (
        <nav className="mb-4 flex flex-wrap gap-2">
          {selectableCompanies.map((company) => (
            <Link
              className={`rounded border px-3 py-1.5 text-sm font-medium ${
                company.id === companyId
                  ? "border-gp-accent-strong bg-gp-accent-strong text-[#04150f]"
                  : "border-gp-border-strong bg-gp-surface text-gp-text hover:bg-gp-bg"
              }`}
              href={`/app/portal?company=${company.id}`}
              key={company.id}
            >
              {company.label}
            </Link>
          ))}
        </nav>
      ) : (
        <Surface className="mb-4 p-4">
          <p className="text-sm text-gp-text-muted">
            Nenhum vínculo de portal ativo para este usuário.
          </p>
        </Surface>
      )}

      {canManage ? (
        <PortalAdminForms companyOptions={adminCompanies} membershipOptions={membershipOptions} />
      ) : null}

      {overviewError ? (
        <div role="alert">
          <Surface className="mt-4 border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">
              Não foi possível carregar a visão da empresa
            </p>
            <p className="mt-1 text-sm text-red-800">{overviewError}</p>
          </Surface>
        </div>
      ) : null}

      {overview ? (
        <section className="mt-4 grid gap-3 lg:grid-cols-3">
          <Panel title="Atendimentos (sanitizado)">
            {overview.encountersSafe.length === 0 ? (
              <Empty text="Nenhum atendimento." />
            ) : (
              overview.encountersSafe.map((item) => (
                <li className="py-2 text-sm" key={item.id}>
                  <span className="font-medium text-gp-text">{item.statusLabel}</span>
                  <span className="ml-2 text-gp-text-muted">
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
                  <span className="font-medium text-gp-text">{item.documentType}</span>
                  <span className="ml-2 text-gp-text-muted">
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
                  <span className="font-medium text-gp-text">{money(item.totalCents)}</span>
                  <span className="ml-2 text-gp-text-muted">{item.status}</span>
                </li>
              ))
            )}
          </Panel>
        </section>
      ) : null}

      {overview && overview.releaseRules.length > 0 ? (
        <Surface className="mt-4 p-4">
          <h2 className="text-base font-semibold text-gp-text">Matriz vigente</h2>
          <ul className="mt-3 divide-y divide-gp-border text-sm">
            {overview.releaseRules.map((rule) => (
              <li className="flex justify-between gap-3 py-2" key={rule.documentType}>
                <span>{rule.documentType}</span>
                <span className="text-gp-text-muted">
                  {rule.releaseToCompany ? "liberado" : "bloqueado"} · {rule.redactionProfile}
                </span>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}
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
