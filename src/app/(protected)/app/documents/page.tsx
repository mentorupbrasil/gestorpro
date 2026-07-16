import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageLoadError, describeSupabaseFailure } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { recordSensitiveRead } from "@/features/audit/sensitive-read";
import { getRequestId } from "@/lib/http/request-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { DocumentsWorkspaceForms } from "./documents-forms";

export default async function DocumentsPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "documents.read");
  if ("error" in auth) {
    return <PageLoadError title="Templates, versões e entregas" detail={auth.error} />;
  }
  const context = auth.context;
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
    return (
      <PageLoadError
        title="Templates, versões e entregas"
        detail={describeSupabaseFailure(
          [
            templatesResult,
            templateVersionsResult,
            documentsResult,
            versionsResult,
            deliveriesResult,
          ],
          "Não foi possível carregar documentos.",
        )}
      />
    );
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
    <div>
      <PageHeader
        description="Documento emitido é imutável. Correção gera nova versão, hash preservado e acesso auditado. ASO incompleto permanece bloqueado."
        eyebrow="Documentos"
        title="Templates, versões e entregas"
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-4">
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
          contentHash: item.content_hash ?? "",
          id: item.id,
          label: `doc ${item.generated_document_id.slice(0, 8)} · v${item.version}`,
        }))}
      />

      <Surface className="mt-4 overflow-x-auto p-0">
        <div className="border-b border-gp-border px-4 py-3">
          <h2 className="text-base font-semibold text-gp-text">Documentos recentes</h2>
        </div>
        {documents.length === 0 ? (
          <p className="p-4 text-sm text-gp-text-muted">Nenhum documento gerado.</p>
        ) : (
          <table className="gp-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Status</th>
                <th>Versão atual</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="font-medium text-gp-text">{document.document_type}</td>
                  <td>
                    <span className="gp-badge">{document.status}</span>
                  </td>
                  <td>v{document.current_version}</td>
                  <td className="text-gp-text-muted">
                    {new Date(document.created_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Surface>
    </div>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <Surface className="p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gp-text-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-gp-text">{value}</p>
    </Surface>
  );
}
