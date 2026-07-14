import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireTenantOrUnitPermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { examOrderListSchema, visualAcuityResultListSchema } from "@/features/exams/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-chrome";
import { VisualAcuityForms } from "./visual-acuity-forms";

export default async function VisualAcuityPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requireTenantOrUnitPermission(context, "exams.read");

  const supabase = await createServerSupabaseClient();
  const [ordersResult, resultsResult] = await Promise.all([
    supabase
      .from("exam_orders")
      .select("id, encounter_id, status, exam_catalog(name)")
      .eq("tenant_id", context.tenantId)
      .in("status", ["ordered", "collected"]),
    supabase
      .from("visual_acuity_results")
      .select("id, exam_order_id, status, current_version")
      .eq("tenant_id", context.tenantId)
      .in("status", ["in_progress", "repeated"]),
  ]);

  if (ordersResult.error || resultsResult.error) {
    throw new Error("Não foi possível carregar acuidade visual.");
  }

  const orders = examOrderListSchema.parse(ordersResult.data);
  const results = visualAcuityResultListSchema.parse(resultsResult.data);

  return (
    <div>
      <PageHeader
        description="Registra medidas por olho, binocular, com/sem correção, condições de teste e conclusão profissional. Correções criam nova versão; nada é apagado."
        eyebrow="Exames complementares"
        title="Acuidade visual"
      />

      <VisualAcuityForms
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
