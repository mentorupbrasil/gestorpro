import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readEmbeddedRelation } from "@/lib/supabase/relations";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { FinanceWorkspaceForms } from "./finance-forms";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(cents / 100);
}

export default async function FinancePage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "finance.read");

  const supabase = await createServerSupabaseClient();
  const [
    contractsResult,
    priceTablesResult,
    priceItemsResult,
    snapshotsResult,
    billingResult,
    invoicesResult,
    portalUsersResult,
  ] = await Promise.all([
    supabase
      .from("commercial_contracts")
      .select("id, code, name, status, companies(legal_name)")
      .eq("tenant_id", context.tenantId)
      .order("code"),
    supabase
      .from("commercial_price_tables")
      .select("id, version, status, contract_id, commercial_contracts(code)")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("commercial_price_items")
      .select("billable_code, description, unit_price_cents, price_table_id")
      .eq("tenant_id", context.tenantId)
      .order("billable_code")
      .limit(120),
    supabase
      .from("encounter_price_snapshots")
      .select("id, encounter_id, created_at, content_hash")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("billing_items")
      .select("id, company_id, description, amount_cents, billable, status, companies(legal_name)")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("invoices")
      .select("id, status, total_cents, due_on, issued_at, companies(legal_name)")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("company_portal_users")
      .select("id, status, companies(legal_name), user_profiles(display_name)")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  if (
    contractsResult.error ||
    priceTablesResult.error ||
    priceItemsResult.error ||
    snapshotsResult.error ||
    billingResult.error ||
    invoicesResult.error ||
    portalUsersResult.error
  ) {
    throw new Error("Não foi possível carregar financeiro.");
  }

  const contracts = contractsResult.data ?? [];
  const priceTables = priceTablesResult.data ?? [];
  const priceItems = priceItemsResult.data ?? [];
  const snapshots = snapshotsResult.data ?? [];
  const billing = billingResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const portalUsers = portalUsersResult.data ?? [];
  const openBilling = billing.reduce(
    (total, item) => total + (item.billable && item.status !== "invoiced" ? item.amount_cents : 0),
    0,
  );
  const invoicedTotal = invoices.reduce((total, invoice) => total + invoice.total_cents, 0);

  return (
    <div>
      <PageHeader
        description="Preço comercial é snapshot imutável e não altera regra clínica. Ciclo: snapshot → billing → fatura → pagamento (AAL2)."
        eyebrow="Financeiro e portal empresarial"
        title="Contratos, faturamento e acesso da empresa"
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-4">
        <Card label="Contratos" value={contracts.length} />
        <Card label="A faturar" value={money(openBilling)} />
        <Card label="Faturado" value={money(invoicedTotal)} />
        <Card label="Usuários portal" value={portalUsers.length} />
      </section>

      <FinanceWorkspaceForms
        billingOptions={billing
          .filter((item) => item.billable && ["pending", "ready"].includes(item.status))
          .map((item) => ({
            id: `${item.id}|${item.company_id}`,
            label: `${item.description} · ${money(item.amount_cents)}`,
          }))}
        contractOptions={contracts.map((item) => ({
          id: item.id,
          label: `${item.code} · ${readEmbeddedRelation(item.companies)?.legal_name ?? "Empresa"}`,
        }))}
        invoiceOptions={invoices
          .filter((item) => ["issued", "partially_paid", "overdue"].includes(item.status))
          .map((item) => ({
            id: item.id,
            label: `${money(item.total_cents)} · ${item.status}`,
          }))}
        priceItemOptions={priceItems.map((item) => ({
          id: item.billable_code,
          label: `${item.billable_code} · ${item.description} · ${money(item.unit_price_cents)}`,
        }))}
        priceTableOptions={priceTables.map((item) => {
          const contract = Array.isArray(item.commercial_contracts)
            ? item.commercial_contracts[0]
            : item.commercial_contracts;
          return {
            id: item.id,
            label: `${contract?.code ?? "CTR"} · v${item.version} (${item.status})`,
          };
        })}
        snapshotOptions={snapshots.map((item) => ({
          id: item.id,
          label: `${item.encounter_id.slice(0, 8)}… · ${new Date(item.created_at).toLocaleString("pt-BR")}`,
        }))}
      />

      <Surface className="mt-4 overflow-x-auto p-0">
        <div className="border-b border-gp-border px-4 py-3">
          <h2 className="text-base font-semibold text-gp-text">Itens de faturamento</h2>
        </div>
        {billing.length === 0 ? (
          <p className="p-4 text-sm text-gp-text-muted">Nenhum item de faturamento criado.</p>
        ) : (
          <table className="gp-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {billing.map((item) => (
                <tr key={item.id}>
                  <td>{readEmbeddedRelation(item.companies)?.legal_name ?? "Empresa"}</td>
                  <td>{item.description}</td>
                  <td className="font-semibold text-gp-text">{money(item.amount_cents)}</td>
                  <td>
                    <span className="gp-badge">{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Surface>
    </div>
  );
}

function Card({ label, value }: Readonly<{ label: string; value: number | string }>) {
  return (
    <Surface className="p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gp-text-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-gp-text">{value}</p>
    </Surface>
  );
}
