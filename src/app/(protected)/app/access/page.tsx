import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { accessMembershipListSchema } from "@/features/platform/schemas";
import { MembershipStatusForm } from "./membership-status-form";

export default async function AccessPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");
  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "memberships.read");

  const supabase = await createServerSupabaseClient();
  const { data: memberships, error } = await supabase
    .from("tenant_memberships")
    .select("id, user_id, status, user_profiles(display_name), membership_roles(roles(name))")
    .eq("tenant_id", context.tenantId)
    .order("created_at");
  if (error) throw new Error("Não foi possível carregar os vínculos autorizados.");
  const accessMemberships = accessMembershipListSchema.parse(memberships);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Administração
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Acessos e vínculos</h1>
      </header>
      {accessMemberships.length === 0 ? (
        <p className="mt-6 bg-slate-100 p-4">Nenhum vínculo encontrado.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="px-2 py-3">Usuário</th>
                <th className="px-2 py-3">Papéis</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {accessMemberships.map((membership) => {
                const isSelf = membership.user_id === context.userId;
                const roleNames = membership.membership_roles
                  .map((item) => item.roles?.name)
                  .filter(Boolean)
                  .join(", ");
                return (
                  <tr className="border-b border-slate-200" key={membership.id}>
                    <td className="px-2 py-3">
                      {membership.user_profiles?.display_name ?? "Usuário autorizado"}
                      {isSelf ? " (você)" : ""}
                    </td>
                    <td className="px-2 py-3">{roleNames || "Sem papel"}</td>
                    <td className="px-2 py-3">
                      {membership.status === "active"
                        ? "Ativo"
                        : membership.status === "blocked"
                          ? "Bloqueado"
                          : "Inativo"}
                    </td>
                    <td className="px-2 py-3 text-right">
                      {!isSelf && context.permissions.has("memberships.manage") ? (
                        <MembershipStatusForm
                          membershipId={membership.id}
                          nextStatus={membership.status === "active" ? "blocked" : "active"}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
