import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireTenantOrUnitPermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { DiagnosticExamForm } from "./diagnostic-form";

export default async function DiagnosticExamsPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requireTenantOrUnitPermission(context, "exams.read");

  const supabase = await createServerSupabaseClient();
  const [resultsResult, versionsResult] = await Promise.all([
    supabase
      .from("diagnostic_exam_results")
      .select("id, exam_order_id, modality, status, current_version, requested_at, updated_at")
      .eq("tenant_id", context.tenantId)
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("diagnostic_exam_result_versions")
      .select("id, diagnostic_exam_result_id, version, created_at")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  if (resultsResult.error || versionsResult.error) {
    throw new Error("Não foi possível carregar exames diagnósticos.");
  }

  const results = resultsResult.data ?? [];
  const versions = versionsResult.data ?? [];

  return (
    <div>
      <PageHeader
        description="Acompanhamento de preparo, execução, laudo humano, validação externa e versões. Arquivos clínicos devem permanecer privados e sem diagnóstico no nome físico."
        eyebrow="Exames complementares"
        title="ECG, EEG e radiologia"
      />

      <Surface className="p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gp-text">Resultados diagnósticos</h2>
            <p className="mt-1 text-sm text-gp-text-muted">
              {versions.length} versões registradas para {results.length} resultados.
            </p>
          </div>
          <span className="gp-badge">laudo sempre humano</span>
        </div>

        {results.length === 0 ? (
          <p className="mt-4 text-sm text-gp-text-muted">
            Nenhum ECG, EEG ou exame radiológico registrado.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="gp-table">
              <thead>
                <tr>
                  <th>Modalidade</th>
                  <th>Pedido</th>
                  <th>Status</th>
                  <th>Versão</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id}>
                    <td className="font-semibold uppercase text-gp-text">{result.modality}</td>
                    <td className="font-mono text-xs text-gp-text-muted">{result.exam_order_id}</td>
                    <td>
                      <span className="gp-badge">{result.status}</span>
                    </td>
                    <td>v{result.current_version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DiagnosticExamForm />
      </Surface>
    </div>
  );
}
