import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { clinicUnitListSchema } from "@/features/platform/schemas";
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
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Administração
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Unidades da clínica</h1>
      </header>

      {clinicUnits.length === 0 ? (
        <p className="mt-6 bg-slate-100 p-4 text-slate-700">
          Nenhuma unidade cadastrada neste tenant.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="px-2 py-3">Código</th>
                <th className="px-2 py-3">Nome</th>
                <th className="px-2 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {clinicUnits.map((unit) => (
                <tr className="border-b border-slate-200" key={unit.id}>
                  <td className="px-2 py-3 font-mono">{unit.code}</td>
                  <td className="px-2 py-3">{unit.name}</td>
                  <td className="px-2 py-3">{unit.status === "active" ? "Ativa" : "Inativa"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {context.permissions.has("units.manage") ? <CreateUnitForm /> : null}
    </main>
  );
}
