import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { tenantOptionListSchema } from "@/features/platform/schemas";
import {
  formatTenantLabel,
  isDemoTenant,
} from "@/features/platform/tenant-presentation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuthCookie } from "@/lib/supabase/auth-cookie";
import { selectTenant } from "./actions";
import { CreateOrganizationForm } from "./create-organization-form";

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
  const realTenants = tenantOptions.filter((membership) => !isDemoTenant(membership.tenants));
  const demoTenants = tenantOptions.filter((membership) => isDemoTenant(membership.tenants));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Sua organização</h1>
      <p className="mt-2 text-sm text-slate-600">
        Para uso real, crie sua clínica abaixo ou escolha uma organização à qual você já tenha acesso.
      </p>

      {error ? (
        <p className="mt-6 border-l-4 border-red-700 bg-red-50 p-4 text-sm text-red-900" role="alert">
          {error}
        </p>
      ) : null}

      <CreateOrganizationForm />

      {realTenants.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Organizações disponíveis</h2>
          <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
            {realTenants.map((membership) => (
              <li key={membership.tenant_id} className="flex items-center justify-between gap-4 py-4">
                <span className="font-medium">{formatTenantLabel(membership.tenants)}</span>
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
        </section>
      ) : null}

      {demoTenants.length > 0 ? (
        <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
            Ambientes de teste (opcional)
          </h2>
          <p className="mt-1 text-xs text-amber-900">
            Organizações E2E são só para testes automatizados. Ignore se você quer usar o sistema de
            verdade.
          </p>
          <ul className="mt-4 divide-y divide-amber-100">
            {demoTenants.map((membership) => (
              <li key={membership.tenant_id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm">{formatTenantLabel(membership.tenants)}</span>
                <form action={selectTenant}>
                  <input type="hidden" name="tenantId" value={membership.tenant_id} />
                  <button
                    className="rounded border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900"
                    type="submit"
                  >
                    Abrir teste
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-8 text-sm text-slate-600">
        Primeiro acesso?{" "}
        <Link className="font-semibold text-emerald-900 underline-offset-4 hover:underline" href="/sign-up">
          Criar conta
        </Link>{" "}
        ·{" "}
        <Link className="font-semibold text-emerald-900 underline-offset-4 hover:underline" href="/sign-in">
          Trocar de usuário
        </Link>
      </p>
    </main>
  );
}
