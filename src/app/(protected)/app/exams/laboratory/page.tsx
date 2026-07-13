import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readEmbeddedRelation } from "@/lib/supabase/relations";

export default async function LaboratoryPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "exams.read");

  const supabase = await createServerSupabaseClient();
  const [ordersResult, samplesResult, resultsResult, laboratoriesResult] = await Promise.all([
    supabase
      .from("laboratory_orders")
      .select("id, status, barcode_value, created_at, external_laboratories(name)")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("laboratory_samples")
      .select("id, sample_code, sample_type, status, collected_at, received_at")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("laboratory_results")
      .select("id, status, version, critical_flag, critical_confirmed_at, created_at")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("external_laboratories")
      .select("id, name, status")
      .eq("tenant_id", context.tenantId)
      .order("name"),
  ]);

  if (
    ordersResult.error ||
    samplesResult.error ||
    resultsResult.error ||
    laboratoriesResult.error
  ) {
    throw new Error("Não foi possível carregar laboratório.");
  }

  const orders = ordersResult.data ?? [];
  const samples = samplesResult.data ?? [];
  const results = resultsResult.data ?? [];
  const laboratories = laboratoriesResult.data ?? [];
  const criticalOpen = results.filter(
    (result) => result.critical_flag && !result.critical_confirmed_at,
  ).length;

  return (
    <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4">
      <header className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Exames complementares
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Laboratório</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Console para pedidos, amostras, eventos, resultados versionados e críticos. Resultado
          crítico só pode ser liberado com confirmação explícita.
        </p>
      </header>

      <section className="mt-5 grid gap-4 md:grid-cols-4">
        <Metric label="Pedidos" value={orders.length} />
        <Metric label="Amostras" value={samples.length} />
        <Metric label="Resultados" value={results.length} />
        <Metric label="Críticos abertos" value={criticalOpen} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel empty="Nenhum pedido laboratorial criado." title="Pedidos recentes">
          {orders.map((order) => (
            <li className="py-3" key={order.id}>
              <span className="font-semibold">
                {readEmbeddedRelation(order.external_laboratories)?.name ?? "Laboratório interno"}
              </span>
              <span className="ml-2 text-sm text-slate-600">
                {order.status}
                {order.barcode_value ? ` · código ${order.barcode_value}` : ""}
              </span>
            </li>
          ))}
        </Panel>
        <Panel empty="Nenhum laboratório externo cadastrado." title="Laboratórios externos">
          {laboratories.map((laboratory) => (
            <li className="flex justify-between gap-3 py-3" key={laboratory.id}>
              <span className="font-semibold">{laboratory.name}</span>
              <span className="text-sm text-slate-600">{laboratory.status}</span>
            </li>
          ))}
        </Panel>
      </section>
    </main>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-emerald-950">{value}</p>
    </div>
  );
}

function Panel({
  children,
  empty,
  title,
}: Readonly<{ children: React.ReactNode[]; empty: string; title: string }>) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">{empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">{children}</ul>
      )}
    </div>
  );
}
