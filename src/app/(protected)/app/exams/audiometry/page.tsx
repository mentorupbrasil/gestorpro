import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import {
  audiometryCalibrationListSchema,
  audiometryResultListSchema,
  examOrderListSchema,
} from "@/features/exams/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AudiometryForms } from "./audiometry-forms";

export default async function AudiometryPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "exams.read");

  const supabase = await createServerSupabaseClient();
  const [ordersResult, resultsResult, calibrationsResult] = await Promise.all([
    supabase
      .from("exam_orders")
      .select("id, encounter_id, status, exam_catalog(name)")
      .eq("tenant_id", context.tenantId)
      .in("status", ["ordered", "collected"]),
    supabase
      .from("audiometry_results")
      .select("id, exam_order_id, status, current_version")
      .eq("tenant_id", context.tenantId)
      .in("status", ["in_progress", "repeated"]),
    supabase
      .from("audiometry_calibrations")
      .select("id, equipment_name, equipment_serial, valid_until, status")
      .eq("tenant_id", context.tenantId)
      .eq("status", "valid"),
  ]);

  if (ordersResult.error || resultsResult.error || calibrationsResult.error) {
    throw new Error("Não foi possível carregar audiometria.");
  }

  const orders = examOrderListSchema.parse(ordersResult.data);
  const results = audiometryResultListSchema.parse(resultsResult.data);
  const calibrations = audiometryCalibrationListSchema.parse(calibrationsResult.data);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Exames complementares
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Audiometria</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Registra repouso auditivo, queixas, otoscopia futura, limiares por ouvido/frequência,
          equipamento, cabine, calibração e laudo. Importação futura preservará payload original.
        </p>
      </header>

      <AudiometryForms
        calibrations={calibrations.map((calibration) => ({
          id: calibration.id,
          name: `${calibration.equipment_name} ${calibration.equipment_serial} · válido até ${calibration.valid_until}`,
        }))}
        orders={orders.map((order) => ({
          id: order.id,
          name: `${order.exam_catalog?.name ?? "Exame"} · ${order.status}`,
        }))}
        results={results.map((result) => ({
          id: result.id,
          name: `${result.exam_order_id} · ${result.status} · v${result.current_version}`,
        }))}
      />
    </main>
  );
}
