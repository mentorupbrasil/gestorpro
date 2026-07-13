import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireTenantOrUnitPermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4">
      <header className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Exames complementares
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">ECG, EEG e radiologia</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Acompanhamento de preparo, execução, laudo humano, validação externa e versões. Arquivos
          clínicos devem permanecer privados e sem diagnóstico no nome físico.
        </p>
      </header>

      <section className="mt-5 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Resultados diagnósticos</h2>
            <p className="mt-1 text-sm text-slate-600">
              {versions.length} versões registradas para {results.length} resultados.
            </p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            laudo sempre humano
          </span>
        </div>

        {results.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
            Nenhum ECG, EEG ou exame radiológico registrado.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Modalidade</th>
                  <th className="px-3 py-3">Pedido</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Versão</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr className="border-b border-slate-100 last:border-0" key={result.id}>
                    <td className="px-3 py-3 font-semibold uppercase">{result.modality}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-600">
                      {result.exam_order_id}
                    </td>
                    <td className="px-3 py-3">{result.status}</td>
                    <td className="px-3 py-3">v{result.current_version}</td>
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
