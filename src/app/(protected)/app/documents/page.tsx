import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { recordSensitiveRead } from "@/features/audit/sensitive-read";
import { getRequestId } from "@/lib/http/request-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DocumentsWorkspaceForms } from "./documents-forms";

export default async function DocumentsPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "documents.read");
  const requestId = getRequestId(await headers());

  const supabase = await createServerSupabaseClient();
  const [
    templatesResult,
    templateVersionsResult,
    documentsResult,
    versionsResult,
    deliveriesResult,
  ] = await Promise.all([
    supabase
      .from("document_templates")
      .select("id, code, name, document_type, status")
      .eq("tenant_id", context.tenantId)
      .order("code"),
    supabase
      .from("document_template_versions")
      .select("id, version, status, document_templates(code, name)")
      .eq("tenant_id", context.tenantId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("generated_documents")
      .select("id, document_type, status, current_version, created_at")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("document_versions")
      .select(
        "id, generated_document_id, version, render_status, storage_bucket, content_hash, created_at",
      )
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
    templateVersionsResult.error ||
    documentsResult.error ||
    versionsResult.error ||
    deliveriesResult.error
  ) {
    throw new Error("Não foi possível carregar documentos.");
  }

  await recordSensitiveRead({
    action: "document.list_viewed",
    entityType: "document_collection",
    requestId,
    tenantId: context.tenantId,
  });

  const templates = templatesResult.data ?? [];
  const templateVersions = templateVersionsResult.data ?? [];
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

      <DocumentsWorkspaceForms
        templateVersions={templateVersions.map((item) => {
          const template = Array.isArray(item.document_templates)
            ? item.document_templates[0]
            : item.document_templates;
          return {
            id: item.id,
            label: `${template?.code ?? "TPL"} · v${item.version}`,
          };
        })}
        versions={versions.map((item) => ({
          contentHash: item.content_hash,
          id: item.id,
          label: `doc ${item.generated_document_id.slice(0, 8)} · v${item.version}`,
        }))}
      />

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
