import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageLoadError, describeSupabaseFailure } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { examOrderListSchema, visualAcuityResultListSchema } from "@/features/exams/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-chrome";
import { VisualAcuityForms } from "./visual-acuity-forms";

export default async function VisualAcuityPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "exams.read", "tenantOrUnit");
  if ("error" in auth) {
    return <PageLoadError title="Acuidade visual" detail={auth.error} />;
  }
  const context = auth.context;

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
    return (
      <PageLoadError
        title="Acuidade visual"
        detail={describeSupabaseFailure(
          [ordersResult, resultsResult],
          "Não foi possível carregar acuidade visual.",
        )}
      />
    );
  }

  const parsedOrders = examOrderListSchema.safeParse(ordersResult.data);
  const parsedResults = visualAcuityResultListSchema.safeParse(resultsResult.data);
  if (!parsedOrders.success || !parsedResults.success) {
    return (
      <PageLoadError
        title="Acuidade visual"
        detail="Dados inconsistentes retornados pelo Supabase (relação/embed). Atualize migrations ou contate suporte."
      />
    );
  }
  const orders = parsedOrders.data;
  const results = parsedResults.data;

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
