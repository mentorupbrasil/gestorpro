import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { tenantOptionListSchema } from "@/features/platform/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuthCookie } from "@/lib/supabase/auth-cookie";
import { selectTenant } from "./actions";

function formatTenantLabel(
  tenant: { legal_name: string; trade_name: string | null } | null | undefined,
) {
  if (!tenant) return "Organização autorizada";

  const tradeName = tenant.trade_name?.trim();
  const legalName = tenant.legal_name.trim();

  if (tradeName && tradeName !== legalName) {
    return `${legalName} (${tradeName})`;
  }

  return legalName || tradeName || "Organização autorizada";
}

function isDemoTenant(tenant: { legal_name: string; trade_name: string | null } | null | undefined) {
  const tradeName = tenant?.trade_name?.trim().toUpperCase();
  const legalName = tenant?.legal_name?.trim().toUpperCase() ?? "";
  return tradeName === "E2E" || legalName.includes("E2E") || legalName.includes("FICT");
}

export default async function SelectTenantPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ error?: string }>;
}>) {
  const { error } = await searchParams;

  if (!hasSupabaseAuthCookie((await cookies()).getAll())) redirect("/sign-in");
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: memberships, error: membershipsError } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, tenants(legal_name, trade_name)")
    .eq("status", "active");

  if (membershipsError) throw new Error("Não foi possível carregar os vínculos autorizados.");
  const tenantOptions = tenantOptionListSchema.parse(memberships);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Selecione a organização</h1>
      <p className="mt-2 text-sm text-slate-600">
        Cada organização representa uma clínica ou empresa atendida no sistema. Escolha onde deseja
        trabalhar nesta sessão.
      </p>

      {error ? (
        <p className="mt-6 border-l-4 border-red-700 bg-red-50 p-4 text-sm text-red-900" role="alert">
          {error}
        </p>
      ) : null}

      {tenantOptions.length === 0 ? (
        <p className="mt-6 border-l-4 border-amber-600 bg-amber-50 p-4">
          Sua conta não possui vínculo ativo. Procure um administrador para criar sua organização ou
          atribuir um acesso.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {tenantOptions.map((membership) => {
            const demoTenant = isDemoTenant(membership.tenants);

            return (
              <li key={membership.tenant_id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <span className="font-medium">{formatTenantLabel(membership.tenants)}</span>
                  {demoTenant ? (
                    <p className="mt-1 text-xs text-amber-800">
                      Organização de teste automatizado (E2E). Use apenas com dados fictícios.
                    </p>
                  ) : null}
                </div>
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
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-sm text-slate-600">
        Viu apenas &quot;E2E&quot; e não deveria? Isso costuma vir do seed de testes. Se o acesso
        falhar, aplique as migrations do projeto no Supabase e confirme que seu usuário tem um papel
        com permissões.{" "}
        <Link className="font-semibold text-emerald-900 underline-offset-4 hover:underline" href="/sign-in">
          Voltar ao login
        </Link>
      </p>
    </main>
  );
}
