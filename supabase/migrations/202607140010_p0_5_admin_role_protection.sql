begin;

-- P0.5 — concessão/remoção auditada de papéis: AAL2, anti-autoelevação,
-- proteção do último tenant_admin e escopo multi-tenant na mesma transação.

create or replace function public.assign_membership_role(
  target_tenant_id uuid,
  target_membership_id uuid,
  target_role_id uuid,
  target_clinic_unit_id uuid,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  membership_user_id uuid;
  role_code text;
  role_tenant_id uuid;
  new_membership_role_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'roles.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select membership.user_id
    into membership_user_id
  from public.tenant_memberships membership
  where membership.id = target_membership_id
    and membership.tenant_id = target_tenant_id
  for update;

  if membership_user_id is null then
    raise exception 'membership not found' using errcode = 'P0002';
  end if;

  if membership_user_id = auth.uid() then
    raise exception 'cannot change own membership roles' using errcode = '42501';
  end if;

  select role.code, role.tenant_id
    into role_code, role_tenant_id
  from public.roles role
  where role.id = target_role_id
  for share;

  if role_code is null then
    raise exception 'role not found' using errcode = 'P0002';
  end if;

  if role_tenant_id is not null and role_tenant_id <> target_tenant_id then
    raise exception 'role not found' using errcode = 'P0002';
  end if;

  if target_clinic_unit_id is not null then
    if not exists (
      select 1
      from public.clinic_units unit
      where unit.id = target_clinic_unit_id
        and unit.tenant_id = target_tenant_id
    ) then
      raise exception 'clinic unit not found' using errcode = 'P0002';
    end if;
  end if;

  insert into public.membership_roles (membership_id, role_id, clinic_unit_id)
  values (target_membership_id, target_role_id, target_clinic_unit_id)
  returning id into new_membership_role_id;

  perform public.append_audit_log(
    target_tenant_id,
    'membership_role.assigned',
    'membership_role',
    new_membership_role_id,
    audit_request_id,
    jsonb_build_object(
      'after', jsonb_build_object(
        'clinic_unit_id', target_clinic_unit_id,
        'membership_id', target_membership_id,
        'role_code', role_code,
        'role_id', target_role_id
      )
    )
  );

  return new_membership_role_id;
end;
$$;

create or replace function public.revoke_membership_role(
  target_tenant_id uuid,
  target_membership_role_id uuid,
  audit_request_id text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  membership_id uuid;
  membership_user_id uuid;
  role_id uuid;
  role_code text;
  clinic_unit_id uuid;
  active_tenant_admins bigint;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'roles.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select
    membership_role.membership_id,
    membership.user_id,
    membership_role.role_id,
    role.code,
    membership_role.clinic_unit_id
  into
    membership_id,
    membership_user_id,
    role_id,
    role_code,
    clinic_unit_id
  from public.membership_roles membership_role
  join public.tenant_memberships membership
    on membership.id = membership_role.membership_id
  join public.roles role on role.id = membership_role.role_id
  where membership_role.id = target_membership_role_id
    and membership.tenant_id = target_tenant_id
  for update of membership_role, membership;

  if membership_id is null then
    raise exception 'membership role not found' using errcode = 'P0002';
  end if;

  if membership_user_id = auth.uid() then
    raise exception 'cannot change own membership roles' using errcode = '42501';
  end if;

  if role_code = 'tenant_admin' and clinic_unit_id is null then
    select count(distinct membership.id) into active_tenant_admins
    from public.tenant_memberships membership
    join public.user_profiles profile on profile.id = membership.user_id
    join public.membership_roles membership_role on membership_role.membership_id = membership.id
    join public.roles role on role.id = membership_role.role_id
    where membership.tenant_id = target_tenant_id
      and membership.status = 'active'
      and profile.status = 'active'
      and membership.valid_from <= now()
      and (membership.valid_until is null or membership.valid_until > now())
      and membership_role.clinic_unit_id is null
      and role.code = 'tenant_admin'
      and (role.tenant_id = target_tenant_id or role.tenant_id is null)
      and membership_role.id <> target_membership_role_id;

    if active_tenant_admins < 1 then
      raise exception 'cannot revoke the last active tenant administrator role'
        using errcode = '42501';
    end if;
  end if;

  delete from public.membership_roles
  where id = target_membership_role_id;

  perform public.append_audit_log(
    target_tenant_id,
    'membership_role.revoked',
    'membership_role',
    target_membership_role_id,
    audit_request_id,
    jsonb_build_object(
      'before', jsonb_build_object(
        'clinic_unit_id', clinic_unit_id,
        'membership_id', membership_id,
        'role_code', role_code,
        'role_id', role_id
      )
    )
  );
end;
$$;

revoke all on function public.assign_membership_role(uuid, uuid, uuid, uuid, text) from public;
revoke all on function public.revoke_membership_role(uuid, uuid, text) from public;
grant execute on function public.assign_membership_role(uuid, uuid, uuid, uuid, text) to authenticated;
grant execute on function public.revoke_membership_role(uuid, uuid, text) to authenticated;

commit;
