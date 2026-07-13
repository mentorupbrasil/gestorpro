-- Corrige acesso quando o usuário tem vínculo ativo, mas sem papel/permissões.
-- Substitua o e-mail pelo da sua conta antes de executar no SQL Editor do Supabase.

insert into public.membership_roles (membership_id, role_id)
select membership.id, role.id
from public.tenant_memberships membership
join auth.users auth_user on auth_user.id = membership.user_id
join public.roles role on role.tenant_id is null and role.code = 'tenant_admin'
where auth_user.email = 'seu-email@exemplo.com'
  and membership.status = 'active'
  and not exists (
    select 1
    from public.membership_roles existing
    where existing.membership_id = membership.id
  );
