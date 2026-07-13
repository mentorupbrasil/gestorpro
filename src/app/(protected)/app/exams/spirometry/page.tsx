import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readEmbeddedRelation } from "@/lib/supabase/relations";
import { SpirometryForms } from "./spirometry-forms";

export default async function SpirometryPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "exams.read");

  const supabase = await createServerSupabaseClient();
  const [ordersResult, resultsResult, calibrationsResult, predictedSetsResult] = await Promise.all([
    supabase
      .from("exam_orders")
      .select("id, encounter_id, status, exam_catalog(name, result_type)")
      .eq("tenant_id", context.tenantId)
      .in("status", ["ordered", "collected", "resulted"]),
    supabase
      .from("spirometry_results")
      .select("id, exam_order_id, status, current_version, started_at, completed_at")
      .eq("tenant_id", context.tenantId)
      .order("started_at", { ascending: false })
      .limit(30),
    supabase
      .from("spirometry_calibrations")
      .select("id, equipment_name, equipment_serial, valid_until, status")
      .eq("tenant_id", context.tenantId)
      .order("valid_until", { ascending: true })
      .limit(20),
    supabase
      .from("spirometry_predicted_value_sets")
      .select("id, code, name, status")
      .eq("tenant_id", context.tenantId)
      .order("code"),
  ]);

  if (
    ordersResult.error ||
    resultsResult.error ||
    calibrationsResult.error ||
    predictedSetsResult.error
  ) {
    throw new Error("Não foi possível carregar espirometria.");
  }

  const orders = ordersResult.data ?? [];
  const results = resultsResult.data ?? [];
  const calibrations = calibrationsResult.data ?? [];
  const predictedSets = predictedSetsResult.data ?? [];
  const spirometryOrders = orders.filter(
    (order) => readEmbeddedRelation(order.exam_catalog)?.result_type === "spirometry",
  );

  return (
    <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4">
      <header className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Exames complementares
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Espirometria</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Console inicial para acompanhar pedidos, calibrações, valores previstos e resultados
          versionados. O cálculo técnico não interpreta clinicamente nem decide aptidão.
        </p>
      </header>

      <section className="mt-5 grid gap-4 lg:grid-cols-4">
        <MetricCard label="Pedidos relacionados" value={spirometryOrders.length} />
        <MetricCard label="Resultados" value={results.length} />
        <MetricCard label="Calibrações" value={calibrations.length} />
        <MetricCard label="Conjuntos previstos" value={predictedSets.length} />
      </section>

      <SpirometryForms
        calibrations={calibrations
          .filter((calibration) => calibration.status === "valid")
          .map((calibration) => ({
            id: calibration.id,
            name: `${calibration.equipment_name} · ${calibration.equipment_serial}`,
          }))}
        orders={spirometryOrders.map((order) => ({
          id: order.id,
          name: readEmbeddedRelation(order.exam_catalog)?.name ?? order.id,
        }))}
        predictedSets={predictedSets
          .filter((set) => set.status === "active")
          .map((set) => ({ id: set.id, name: `${set.code} · ${set.name}` }))}
        results={results.map((result) => ({
          id: result.id,
          name: `${result.exam_order_id} · ${result.status} · v${result.current_version}`,
        }))}
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <DataPanel empty="Nenhum resultado de espirometria iniciado." title="Resultados recentes">
          {results.map((result) => (
            <li className="grid gap-1 py-3 sm:grid-cols-[1fr_auto]" key={result.id}>
              <span className="font-mono text-xs text-slate-600">{result.exam_order_id}</span>
              <span className="text-sm font-semibold text-slate-900">
                {result.status} · v{result.current_version}
              </span>
            </li>
          ))}
        </DataPanel>

        <DataPanel empty="Nenhuma calibração cadastrada." title="Calibrações do espirômetro">
          {calibrations.map((calibration) => (
            <li className="grid gap-1 py-3 sm:grid-cols-[1fr_auto]" key={calibration.id}>
              <span className="font-semibold text-slate-900">
                {calibration.equipment_name} · {calibration.equipment_serial}
              </span>
              <span className="text-sm text-slate-600">
                {calibration.status} · válido até{" "}
                {new Date(calibration.valid_until).toLocaleDateString("pt-BR")}
              </span>
            </li>
          ))}
        </DataPanel>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-emerald-950">{value}</p>
    </div>
  );
}

function DataPanel({
  children,
  empty,
  title,
}: Readonly<{ children: React.ReactNode; empty: string; title: string }>) {
  const list = Array.isArray(children) ? children.filter(Boolean) : children;

  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      {Array.isArray(list) && list.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">{empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">{list}</ul>
      )}
    </div>
  );
}
