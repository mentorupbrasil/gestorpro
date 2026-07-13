import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import {
  companyListSchema,
  examCatalogListSchema,
  pcmsoVersionListSchema,
  workerListSchema,
} from "@/features/occupational/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CompanyForm } from "./company-form";
import { ExamCatalogForm } from "./exam-catalog-form";
import { PcmsoVersionForm } from "./pcmso-version-form";
import { StructureForm } from "./structure-form";
import { WorkerForm } from "./worker-form";

function maskTaxId(taxId: string) {
  return `••••••••••${taxId.slice(-4)}`;
}

export default async function OccupationalPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "occupational.read");

  const supabase = await createServerSupabaseClient();
  const [companiesResult, workersResult, pcmsoResult, catalogResult] = await Promise.all([
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
      .select("id, version_number, valid_from, valid_until, status, companies(legal_name)")
      .eq("tenant_id", context.tenantId)
      .order("valid_from", { ascending: false }),
    supabase
      .from("exam_catalog")
      .select("id, code, name, result_type, active")
      .eq("tenant_id", context.tenantId)
      .order("code"),
  ]);

  if (companiesResult.error || workersResult.error || pcmsoResult.error || catalogResult.error) {
    throw new Error("Não foi possível carregar o domínio ocupacional.");
  }

  const companies = companyListSchema.parse(companiesResult.data);
  const workers = workerListSchema.parse(workersResult.data);
  const pcmsoVersions = pcmsoVersionListSchema.parse(pcmsoResult.data);
  const examCatalog = examCatalogListSchema.parse(catalogResult.data);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Domínio ocupacional
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Empresas, trabalhadores e PCMSO</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Cadastros da Fase 2 com isolamento por tenant, versionamento e regras de protocolo
          separadas de preço.
        </p>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
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

      <section className="mt-10 grid gap-8">
        <div>
          <h2 className="text-lg font-semibold">Empresas</h2>
          {companies.length === 0 ? (
            <p className="mt-3 rounded bg-slate-100 p-4 text-sm text-slate-700">
              Nenhuma empresa cadastrada neste tenant.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="px-2 py-3">Razão social</th>
                    <th className="px-2 py-3">CNPJ</th>
                    <th className="px-2 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr className="border-b border-slate-200" key={company.id}>
                      <td className="px-2 py-3">
                        {company.legal_name}
                        {company.trade_name ? (
                          <span className="block text-xs text-slate-500">{company.trade_name}</span>
                        ) : null}
                      </td>
                      <td className="px-2 py-3 font-mono">
                        {maskTaxId(company.tax_id_normalized)}
                      </td>
                      <td className="px-2 py-3">
                        {company.status === "active" ? "Ativa" : "Inativa"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Trabalhadores</h2>
          {workers.length === 0 ? (
            <p className="mt-3 rounded bg-slate-100 p-4 text-sm text-slate-700">
              Nenhum trabalhador cadastrado neste tenant.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="px-2 py-3">Nome</th>
                    <th className="px-2 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => (
                    <tr className="border-b border-slate-200" key={worker.id}>
                      <td className="px-2 py-3">{worker.full_name}</td>
                      <td className="px-2 py-3">
                        {worker.status === "active" ? "Ativo" : "Inativo"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold">PCMSO vigente/versionado</h2>
          {pcmsoVersions.length === 0 ? (
            <p className="mt-3 rounded bg-slate-100 p-4 text-sm text-slate-700">
              Nenhuma versão de PCMSO cadastrada.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200 text-sm">
              {pcmsoVersions.map((version) => (
                <li className="py-3" key={version.id}>
                  <span className="font-semibold">
                    {version.companies?.legal_name ?? "Empresa não informada"} · v
                    {version.version_number}
                  </span>
                  <span className="ml-2 text-slate-600">
                    {version.status} · {version.valid_from}
                    {version.valid_until ? ` até ${version.valid_until}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Catálogo de exames</h2>
          {examCatalog.length === 0 ? (
            <p className="mt-3 rounded bg-slate-100 p-4 text-sm text-slate-700">
              Nenhum exame cadastrado no catálogo.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200 text-sm">
              {examCatalog.map((exam) => (
                <li className="flex items-center justify-between gap-4 py-3" key={exam.id}>
                  <span>
                    <span className="font-mono">{exam.code}</span> · {exam.name}
                  </span>
                  <span className="text-slate-600">{exam.active ? "Ativo" : "Inativo"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
