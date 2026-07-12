import { redirect } from "next/navigation";
import { tenantOptionListSchema } from "@/features/platform/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { selectTenant } from "./actions";

export default async function SelectTenantPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: memberships, error } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, tenants(legal_name, trade_name)")
    .eq("status", "active");

  if (error) throw new Error("Não foi possível carregar os vínculos autorizados.");
  const tenantOptions = tenantOptionListSchema.parse(memberships);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Selecione a organização</h1>
      {tenantOptions.length === 0 ? (
        <p className="mt-6 border-l-4 border-amber-600 bg-amber-50 p-4">
          Sua conta não possui vínculo ativo. Procure um administrador.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {tenantOptions.map((membership) => (
            <li key={membership.tenant_id} className="flex items-center justify-between gap-4 py-4">
              <span>
                {membership.tenants?.trade_name ??
                  membership.tenants?.legal_name ??
                  "Organização autorizada"}
              </span>
              <form action={selectTenant}>
                <input type="hidden" name="tenantId" value={membership.tenant_id} />
                <button
                  className="rounded bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"
                  type="submit"
                >
                  Acessar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
