import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readEmbeddedRelation } from "@/lib/supabase/relations";
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
    snapshotsResult.error ||
    billingResult.error ||
    invoicesResult.error ||
    portalUsersResult.error
  ) {
    throw new Error("Não foi possível carregar financeiro.");
  }

  const contracts = contractsResult.data ?? [];
  const priceTables = priceTablesResult.data ?? [];
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
    <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4">
      <header className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Financeiro e portal empresarial
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Contratos, faturamento e acesso da empresa
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Preço comercial é snapshot imutável e não altera regra clínica. Ciclo: snapshot → billing →
          fatura → pagamento (AAL2).
        </p>
      </header>

      <section className="mt-5 grid gap-4 md:grid-cols-4">
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

      <section className="mt-5 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Itens de faturamento</h2>
        {billing.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
            Nenhum item de faturamento criado.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Empresa</th>
                  <th className="px-3 py-3">Descrição</th>
                  <th className="px-3 py-3">Valor</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {billing.map((item) => (
                  <tr className="border-b border-slate-100 last:border-0" key={item.id}>
                    <td className="px-3 py-3">
                      {readEmbeddedRelation(item.companies)?.legal_name ?? "Empresa"}
                    </td>
                    <td className="px-3 py-3">{item.description}</td>
                    <td className="px-3 py-3 font-semibold">{money(item.amount_cents)}</td>
                    <td className="px-3 py-3">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Card({ label, value }: Readonly<{ label: string; value: number | string }>) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-emerald-950">{value}</p>
    </div>
  );
}
