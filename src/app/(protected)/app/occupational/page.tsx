import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageLoadError, describeSupabaseFailure } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import {
  companyListSchema,
  examCatalogListSchema,
  pcmsoVersionListSchema,
  workerListSchema,
} from "@/features/occupational/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PCMSO_VERSION_COMPANY_EMBED } from "@/lib/supabase/embeds";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { CompanyForm } from "./company-form";
import { ExamCatalogForm } from "./exam-catalog-form";
import { PcmsoVersionForm } from "./pcmso-version-form";
import { ProtocolWorkspace } from "./protocol-workspace";
import { StructureForm } from "./structure-form";
import { WorkerForm } from "./worker-form";

function maskTaxId(taxId: string) {
  return `••••••••••${taxId.slice(-4)}`;
}

export default async function OccupationalPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "occupational.read", "tenantOrUnit");
  if ("error" in auth) {
    return <PageLoadError title="Empresas, trabalhadores e PCMSO" detail={auth.error} />;
  }
  const context = auth.context;

  const supabase = await createServerSupabaseClient();
  const [companiesResult, workersResult, pcmsoResult, catalogResult, protocolsResult] =
    await Promise.all([
      supabase
        .from("companies")
        .select("id, legal_name, trade_name, tax_id_normalized, status")
        .eq("tenant_id", context.tenantId)
        .order("legal_name"),
      supabase
        .from("workers")
        .select("id, full_name, status")
        .eq("tenant_id", context.tenantId)
        .order("full_name"),
      supabase
        .from("pcmso_versions")
        .select(
          `id, version_number, valid_from, valid_until, status, ${PCMSO_VERSION_COMPANY_EMBED}(legal_name)`,
        )
        .eq("tenant_id", context.tenantId)
        .order("valid_from", { ascending: false }),
      supabase
        .from("exam_catalog")
        .select("id, code, name, result_type, active")
        .eq("tenant_id", context.tenantId)
        .order("code"),
      supabase
        .from("exam_protocols")
        .select("id, occupational_exam_type, status, pcmso_version_id")
        .eq("tenant_id", context.tenantId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  if (
    companiesResult.error ||
    workersResult.error ||
    pcmsoResult.error ||
    catalogResult.error ||
    protocolsResult.error
  ) {
    return (
      <PageLoadError
        title="Empresas, trabalhadores e PCMSO"
        detail={describeSupabaseFailure(
          [companiesResult, workersResult, pcmsoResult, catalogResult, protocolsResult],
          "Não foi possível carregar o domínio ocupacional.",
        )}
      />
    );
  }

  const parsedCompanies = companyListSchema.safeParse(companiesResult.data);
  const parsedWorkers = workerListSchema.safeParse(workersResult.data);
  const parsedPcmsoVersions = pcmsoVersionListSchema.safeParse(pcmsoResult.data);
  const parsedExamCatalog = examCatalogListSchema.safeParse(catalogResult.data);
  if (
    !parsedCompanies.success ||
    !parsedWorkers.success ||
    !parsedPcmsoVersions.success ||
    !parsedExamCatalog.success
  ) {
    return (
      <PageLoadError
        title="Empresas, trabalhadores e PCMSO"
        detail="Dados inconsistentes retornados pelo Supabase (relação/embed). Atualize migrations ou contate suporte."
      />
    );
  }
  const companies = parsedCompanies.data;
  const workers = parsedWorkers.data;
  const pcmsoVersions = parsedPcmsoVersions.data;
  const examCatalog = parsedExamCatalog.data;
  const protocols = protocolsResult.data ?? [];

  return (
    <div>
      <PageHeader
        description="Cadastros da Fase 2 com isolamento por tenant, versionamento e regras de protocolo separadas de preço."
        eyebrow="Domínio ocupacional"
        title="Empresas, trabalhadores e PCMSO"
      />

      <section className="grid gap-3 lg:grid-cols-2">
        {context.permissions.has("occupational.manage") ? <CompanyForm /> : null}
        {context.permissions.has("occupational.manage") ? <WorkerForm /> : null}
        {context.permissions.has("protocols.manage") ? <ExamCatalogForm /> : null}
        {context.permissions.has("protocols.manage") ? (
          <PcmsoVersionForm
            companies={companies.map((company) => ({
              id: company.id,
              legalName: company.legal_name,
            }))}
          />
        ) : null}
        {context.permissions.has("occupational.manage") ? (
          <StructureForm
            companies={companies.map((company) => ({
              id: company.id,
              legalName: company.legal_name,
            }))}
            workers={workers.map((worker) => ({
              fullName: worker.full_name,
              id: worker.id,
            }))}
          />
        ) : null}
      </section>

      {context.permissions.has("protocols.manage") ||
      context.permissions.has("occupational.read") ? (
        <ProtocolWorkspace
          catalogs={examCatalog.map((item) => ({
            id: item.id,
            label: `${item.code} · ${item.name}`,
          }))}
          pcmsoVersions={pcmsoVersions.map((version) => ({
            id: version.id,
            label: `${version.companies?.legal_name ?? "Empresa"} · v${version.version_number} (${version.status})`,
          }))}
          protocols={protocols.map((protocol) => ({
            id: protocol.id,
            label: `${protocol.occupational_exam_type} · ${protocol.status}`,
          }))}
          workers={workers.map((worker) => ({
            id: worker.id,
            label: worker.full_name,
          }))}
        />
      ) : null}

      <section className="mt-4 grid gap-3">
        <div>
          <h2 className="mb-2 text-base font-semibold text-gp-text">Empresas</h2>
          {companies.length === 0 ? (
            <Surface className="p-4">
              <p className="text-sm text-gp-text-muted">Nenhuma empresa cadastrada neste tenant.</p>
            </Surface>
          ) : (
            <Surface className="overflow-x-auto">
              <table className="gp-table">
                <thead>
                  <tr>
                    <th>Razão social</th>
                    <th>CNPJ</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id}>
                      <td className="font-medium text-gp-text">
                        {company.legal_name}
                        {company.trade_name ? (
                          <span className="block text-xs text-gp-text-muted">
                            {company.trade_name}
                          </span>
                        ) : null}
                      </td>
                      <td className="font-mono">{maskTaxId(company.tax_id_normalized)}</td>
                      <td>
                        <span className="gp-badge">
                          {company.status === "active" ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Surface>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-base font-semibold text-gp-text">Trabalhadores</h2>
          {workers.length === 0 ? (
            <Surface className="p-4">
              <p className="text-sm text-gp-text-muted">
                Nenhum trabalhador cadastrado neste tenant.
              </p>
            </Surface>
          ) : (
            <Surface className="overflow-x-auto">
              <table className="gp-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => (
                    <tr key={worker.id}>
                      <td className="font-medium text-gp-text">{worker.full_name}</td>
                      <td>
                        <span className="gp-badge">
                          {worker.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Surface>
          )}
        </div>

        <Surface className="p-4">
          <h2 className="text-base font-semibold text-gp-text">PCMSO vigente/versionado</h2>
          {pcmsoVersions.length === 0 ? (
            <p className="mt-3 text-sm text-gp-text-muted">Nenhuma versão de PCMSO cadastrada.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gp-border text-sm">
              {pcmsoVersions.map((version) => (
                <li className="py-2.5" key={version.id}>
                  <span className="font-semibold text-gp-text">
                    {version.companies?.legal_name ?? "Empresa não informada"} · v
                    {version.version_number}
                  </span>
                  <span className="ml-2 text-gp-text-muted">
                    {version.status} · {version.valid_from}
                    {version.valid_until ? ` até ${version.valid_until}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface className="p-4">
          <h2 className="text-base font-semibold text-gp-text">Catálogo de exames</h2>
          {examCatalog.length === 0 ? (
            <p className="mt-3 text-sm text-gp-text-muted">Nenhum exame cadastrado no catálogo.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gp-border text-sm">
              {examCatalog.map((exam) => (
                <li className="flex items-center justify-between gap-4 py-2.5" key={exam.id}>
                  <span>
                    <span className="font-mono">{exam.code}</span> · {exam.name}
                  </span>
                  <span className="gp-badge">{exam.active ? "Ativo" : "Inativo"}</span>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </section>
    </div>
  );
}
