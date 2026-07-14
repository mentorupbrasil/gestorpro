import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { clinicUnitListSchema } from "@/features/platform/schemas";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { CreateUnitForm } from "./create-unit-form";

export default async function UnitsPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "units.read");
  const supabase = await createServerSupabaseClient();
  const { data: units, error } = await supabase
    .from("clinic_units")
    .select("id, code, name, status")
    .eq("tenant_id", context.tenantId)
    .order("name");
  if (error) throw new Error("Não foi possível carregar as unidades autorizadas.");
  const clinicUnits = clinicUnitListSchema.parse(units);

  return (
    <div>
      <PageHeader eyebrow="Administração" title="Unidades da clínica" />

      {clinicUnits.length === 0 ? (
        <Surface className="p-4">
          <p className="text-sm text-gp-text-muted">Nenhuma unidade cadastrada neste tenant.</p>
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
