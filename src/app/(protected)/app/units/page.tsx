import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageLoadError, describeSupabaseFailure } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { clinicUnitListSchema } from "@/features/platform/schemas";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { BootstrapOperationsPanel } from "../_components/bootstrap-operations-panel";
import { CreateUnitForm } from "./create-unit-form";

export default async function UnitsPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "units.read");
  if ("error" in auth) {
    return <PageLoadError title="Unidades da clínica" detail={auth.error} />;
  }
  const context = auth.context;
  const supabase = await createServerSupabaseClient();
  const { data: units, error } = await supabase
    .from("clinic_units")
    .select("id, code, name, status")
    .eq("tenant_id", context.tenantId)
    .order("name");
  if (error) {
    return (
      <PageLoadError
        title="Unidades da clínica"
        detail={describeSupabaseFailure(
          [{ error }],
          "Não foi possível carregar as unidades autorizadas.",
        )}
      />
    );
  }
  const parsedUnits = clinicUnitListSchema.safeParse(units);
  if (!parsedUnits.success) {
    return (
      <PageLoadError
        title="Unidades da clínica"
        detail="Dados inconsistentes retornados pelo Supabase (relação/embed). Atualize migrations ou contate suporte."
      />
    );
  }
  const clinicUnits = parsedUnits.data;

  return (
    <div>
      <PageHeader eyebrow="Administração" title="Unidades da clínica" />

      {clinicUnits.length === 0 ? (
        <BootstrapOperationsPanel
          canBootstrap={context.permissions.has("roles.manage")}
          reason="Nenhuma unidade cadastrada — check-in, filas e clínica ficam sem contexto."
        />
      ) : null}

      {clinicUnits.length === 0 ? (
        <Surface className="mt-4 p-4">
          <p className="text-sm text-gp-text-muted">
            Ou crie manualmente abaixo (também exige MFA), se preferir.
          </p>
        </Surface>
      ) : (
        <Surface className="overflow-x-auto">
          <table className="gp-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clinicUnits.map((unit) => (
                <tr key={unit.id}>
                  <td className="font-mono">{unit.code}</td>
                  <td>{unit.name}</td>
                  <td>
                    <span className="gp-badge">
                      {unit.status === "active" ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      )}

      {context.permissions.has("units.manage") ? <CreateUnitForm /> : null}
    </div>
  );
}
