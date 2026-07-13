import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DocumentsPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "documents.read");

  const supabase = await createServerSupabaseClient();
  const [templatesResult, documentsResult, versionsResult, deliveriesResult] = await Promise.all([
    supabase
      .from("document_templates")
      .select("id, code, name, document_type, status")
      .eq("tenant_id", context.tenantId)
      .order("code"),
    supabase
      .from("generated_documents")
      .select("id, document_type, status, current_version, created_at")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("document_versions")
      .select("id, generated_document_id, version, render_status, storage_bucket, created_at")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("document_deliveries")
      .select("id, recipient_type, status, created_at")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (
    templatesResult.error ||
    documentsResult.error ||
    versionsResult.error ||
    deliveriesResult.error
  ) {
    throw new Error("Não foi possível carregar documentos.");
  }

  const templates = templatesResult.data ?? [];
  const documents = documentsResult.data ?? [];
  const versions = versionsResult.data ?? [];
  const deliveries = deliveriesResult.data ?? [];

  return (
    <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4">
      <header className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Documentos</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Templates, versões e entregas
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Documento emitido é imutável. Correção gera nova versão, hash preservado e acesso
          auditado. ASO incompleto permanece bloqueado.
        </p>
      </header>

      <section className="mt-5 grid gap-4 md:grid-cols-4">
        <Stat label="Templates" value={templates.length} />
        <Stat label="Documentos" value={documents.length} />
        <Stat label="Versões" value={versions.length} />
        <Stat label="Entregas" value={deliveries.length} />
      </section>

      <section className="mt-5 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Documentos recentes</h2>
        {documents.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
            Nenhum documento gerado.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Versão atual</th>
                  <th className="px-3 py-3">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr className="border-b border-slate-100 last:border-0" key={document.id}>
                    <td className="px-3 py-3 font-semibold">{document.document_type}</td>
                    <td className="px-3 py-3">{document.status}</td>
                    <td className="px-3 py-3">v{document.current_version}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {new Date(document.created_at).toLocaleString("pt-BR")}
                    </td>
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

function Stat({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-emerald-950">{value}</p>
    </div>
  );
}
