import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { accessMembershipListSchema, assignableRoleListSchema } from "@/features/platform/schemas";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
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
    <div>
      <PageHeader
        description="Concessão e remoção de papéis exigem MFA (AAL2), não permitem autoelevação e protegem o último administrador ativo do tenant."
        eyebrow="Administração"
        title="Acessos e vínculos"
      />
      {accessMemberships.length === 0 ? (
        <Surface className="p-4">
          <p className="text-sm text-gp-text-muted">Nenhum vínculo encontrado.</p>
        </Surface>
      ) : (
        <Surface className="overflow-x-auto">
          <table className="gp-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Papéis</th>
                <th>Status</th>
                <th>
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
                  <tr key={membership.id}>
                    <td className="align-top font-medium text-gp-text">
                      {membership.user_profiles?.display_name ?? "Usuário autorizado"}
                      {isSelf ? " (você)" : ""}
                    </td>
                    <td className="align-top">
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
                    <td className="align-top">
                      <span className="gp-badge">
                        {membership.status === "active"
                          ? "Ativo"
                          : membership.status === "blocked"
                            ? "Bloqueado"
                            : "Inativo"}
                      </span>
                    </td>
                    <td className="align-top text-right">
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
        </Surface>
      )}
    </div>
  );
}
