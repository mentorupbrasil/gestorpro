import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageLoadError, describeSupabaseFailure } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import {
  audiometryCalibrationListSchema,
  audiometryResultListSchema,
  examOrderListSchema,
} from "@/features/exams/schemas";
import { EXAM_ORDER_CATALOG_EMBED } from "@/lib/supabase/embeds";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-chrome";
import { AudiometryForms } from "./audiometry-forms";

export default async function AudiometryPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "exams.read", "tenantOrUnit");
  if ("error" in auth) {
    return <PageLoadError title="Audiometria" detail={auth.error} />;
  }
  const context = auth.context;

  const supabase = await createServerSupabaseClient();
  const [ordersResult, resultsResult, calibrationsResult] = await Promise.all([
    supabase
      .from("exam_orders")
      .select(`id, encounter_id, status, ${EXAM_ORDER_CATALOG_EMBED}(name)`)
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
    return (
      <PageLoadError
        title="Audiometria"
        detail={describeSupabaseFailure(
          [ordersResult, resultsResult, calibrationsResult],
          "Não foi possível carregar audiometria.",
        )}
      />
    );
  }

  const parsedOrders = examOrderListSchema.safeParse(ordersResult.data);
  const parsedResults = audiometryResultListSchema.safeParse(resultsResult.data);
  const parsedCalibrations = audiometryCalibrationListSchema.safeParse(calibrationsResult.data);
  if (!parsedOrders.success || !parsedResults.success || !parsedCalibrations.success) {
    return (
      <PageLoadError
        title="Audiometria"
        detail="Dados inconsistentes retornados pelo Supabase (relação/embed). Atualize migrations ou contate suporte."
      />
    );
  }
  const orders = parsedOrders.data;
  const results = parsedResults.data;
  const calibrations = parsedCalibrations.data;

  return (
    <div>
      <PageHeader
        description="Registra repouso auditivo, queixas, otoscopia futura, limiares por ouvido/frequência, equipamento, cabine, calibração e laudo. Importação futura preservará payload original."
        eyebrow="Exames complementares"
        title="Audiometria"
      />

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
    </div>
  );
}
