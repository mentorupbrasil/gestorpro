import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { signOut } from "./actions";

export default async function WorkspacePage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "tenant.read");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
            GestorPro · Unimetra
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Ambiente administrativo</h1>
        </div>
        <form action={signOut}>
          <button
            className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            type="submit"
          >
            Sair
          </button>
        </form>
      </header>
      <p className="mt-8 text-slate-700">
        Fundação de segurança ativa. Os módulos ocupacionais ainda não foram liberados.
      </p>
      <nav className="mt-8 border-y border-slate-200 py-4" aria-label="Administração da plataforma">
        <ul className="flex flex-wrap gap-6">
          <li>
            <Link
              className="font-semibold text-emerald-800 underline-offset-4 hover:underline"
              href="/app/units"
            >
              Gerenciar unidades
            </Link>
          </li>
          <li>
            <Link
              className="font-semibold text-emerald-800 underline-offset-4 hover:underline"
              href="/app/access"
            >
              Acessos e vínculos
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
