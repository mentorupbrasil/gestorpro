import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageLoadError, describeSupabaseFailure } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { accessMembershipListSchema, assignableRoleListSchema } from "@/features/platform/schemas";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { MembershipRoleControls } from "./membership-role-controls";
import { MembershipStatusForm } from "./membership-status-form";

export default async function AccessPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");
  const auth = await loadWorkspaceAuth(selectedTenantId, "memberships.read");
  if ("error" in auth) {
    return <PageLoadError title="Acessos e vínculos" detail={auth.error} />;
  }
  const context = auth.context;

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
  if (error || rolesError) {
    return (
      <PageLoadError
        title="Acessos e vínculos"
        detail={describeSupabaseFailure(
          [{ error }, { error: rolesError }],
          "Não foi possível carregar os acessos autorizados.",
        )}
      />
    );
  }
  const parsedMemberships = accessMembershipListSchema.safeParse(memberships);
  const parsedRoles = assignableRoleListSchema.safeParse(roles);
  if (!parsedMemberships.success || !parsedRoles.success) {
    return (
      <PageLoadError
        title="Acessos e vínculos"
        detail="Dados inconsistentes retornados pelo Supabase (relação/embed). Atualize migrations ou contate suporte."
      />
    );
  }
  const accessMemberships = parsedMemberships.data;
  const assignableRoles = parsedRoles.data;
  const canManageRoles = context.permissions.has("roles.manage");

  return (
    <div>
      <PageHeader
        description="Concessão e remoção de papéis exigem MFA (AAL2). Administradores podem autoatribuir papéis operacionais; papéis administrativos e o último tenant_admin permanecem protegidos."
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
                          code: item.roles.code,
                          id: item.id,
                          name: item.roles.name,
                          roleId: item.roles.id,
                        }
                      : null,
                  )
                  .filter(
                    (
                      item,
                    ): item is { code: string; id: string; name: string; roleId: string } =>
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
                          code: role.code,
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
