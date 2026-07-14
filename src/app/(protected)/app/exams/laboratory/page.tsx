import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireTenantOrUnitPermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { LaboratoryForms } from "./laboratory-forms";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readEmbeddedRelation } from "@/lib/supabase/relations";
import { PageHeader, Surface } from "@/components/ui/page-chrome";

export default async function LaboratoryPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requireTenantOrUnitPermission(context, "exams.read");

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
    <div>
      <PageHeader
        description="Console para pedidos, amostras, eventos, resultados versionados e críticos. Resultado crítico só pode ser liberado com confirmação explícita."
        eyebrow="Exames complementares"
        title="Laboratório"
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-4">
        <Metric label="Pedidos" value={orders.length} />
        <Metric label="Amostras" value={samples.length} />
        <Metric label="Resultados" value={results.length} />
        <Metric label="Críticos abertos" value={criticalOpen} />
      </section>

      <section className="mb-4 grid gap-3 xl:grid-cols-2">
        <Panel empty="Nenhum pedido laboratorial criado." title="Pedidos recentes">
          {orders.map((order) => (
            <li className="py-2.5" key={order.id}>
              <span className="font-semibold text-gp-text">
                {readEmbeddedRelation(order.external_laboratories)?.name ?? "Laboratório interno"}
              </span>
              <span className="ml-2 text-sm text-gp-text-muted">
                {order.status}
                {order.barcode_value ? ` · código ${order.barcode_value}` : ""}
              </span>
            </li>
          ))}
        </Panel>
        <Panel empty="Nenhum laboratório externo cadastrado." title="Laboratórios externos">
          {laboratories.map((laboratory) => (
            <li className="flex justify-between gap-3 py-2.5" key={laboratory.id}>
              <span className="font-semibold text-gp-text">{laboratory.name}</span>
              <span className="gp-badge">{laboratory.status}</span>
            </li>
          ))}
        </Panel>
      </section>

      <LaboratoryForms />
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <Surface className="p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gp-text-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-gp-text">{value}</p>
    </Surface>
  );
}

function Panel({
  children,
  empty,
  title,
}: Readonly<{ children: React.ReactNode[]; empty: string; title: string }>) {
  return (
    <Surface className="p-4">
      <h2 className="text-base font-semibold text-gp-text">{title}</h2>
      {children.length === 0 ? (
        <p className="mt-3 text-sm text-gp-text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-gp-border text-sm">{children}</ul>
      )}
    </Surface>
  );
}
