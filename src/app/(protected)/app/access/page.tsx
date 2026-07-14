import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { accessMembershipListSchema, assignableRoleListSchema } from "@/features/platform/schemas";
import { MembershipRoleControls } from "./membership-role-controls";
import { MembershipStatusForm } from "./membership-status-form";

export default async function AccessPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");
  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "memberships.read");

  const supabase = await createServerSupabaseClient();
  const [{ data: memberships, error }, { data: roles, error: rolesError }] = await Promise.all([
    supabase
      .from("tenant_memberships")
      .select(
        "id, user_id, status, user_profiles(display_name), membership_roles(id, roles(id, code, name))",
      )
      .eq("tenant_id", context.tenantId)
      .order("created_at"),
    supabase
      .from("roles")
      .select("id, code, name, tenant_id")
      .or(`tenant_id.is.null,tenant_id.eq.${context.tenantId}`)
      .order("name"),
  ]);
  if (error) throw new Error("Não foi possível carregar os vínculos autorizados.");
  if (rolesError) throw new Error("Não foi possível carregar os papéis autorizados.");
  const accessMemberships = accessMembershipListSchema.parse(memberships);
  const assignableRoles = assignableRoleListSchema.parse(roles);
  const canManageRoles = context.permissions.has("roles.manage");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Administração
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Acessos e vínculos</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Concessão e remoção de papéis exigem MFA (AAL2), não permitem autoelevação e protegem o
          último administrador ativo do tenant.
        </p>
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
                const membershipRoles = membership.membership_roles
                  .map((item) =>
                    item.roles
                      ? {
                          id: item.id,
                          name: item.roles.name,
                          roleId: item.roles.id,
                        }
                      : null,
                  )
                  .filter((item): item is { id: string; name: string; roleId: string } =>
                    Boolean(item),
                  );
                return (
                  <tr className="border-b border-slate-200" key={membership.id}>
                    <td className="px-2 py-3 align-top">
                      {membership.user_profiles?.display_name ?? "Usuário autorizado"}
                      {isSelf ? " (você)" : ""}
                    </td>
                    <td className="px-2 py-3 align-top">
                      <MembershipRoleControls
                        assignedRoleIds={membershipRoles.map((role) => role.roleId)}
                        canManageRoles={canManageRoles}
                        isSelf={isSelf}
                        membershipId={membership.id}
                        membershipRoles={membershipRoles.map((role) => ({
                          id: role.id,
                          name: role.name,
                        }))}
                        roles={assignableRoles}
                      />
                    </td>
                    <td className="px-2 py-3 align-top">
                      {membership.status === "active"
                        ? "Ativo"
                        : membership.status === "blocked"
                          ? "Bloqueado"
                          : "Inativo"}
                    </td>
                    <td className="px-2 py-3 text-right align-top">
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
