begin;

create extension if not exists pgcrypto;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text,
  status text not null default 'active' check (status in ('active', 'suspended', 'inactive')),
  timezone text not null default 'America/Fortaleza',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clinic_units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null,
  name text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinic_units_tenant_code_uq unique (tenant_id, code)
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null,
  status text not null default 'active' check (status in ('active', 'blocked', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  user_id uuid not null references public.user_profiles(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'blocked', 'inactive')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_memberships_tenant_user_uq unique (tenant_id, user_id),
  constraint tenant_memberships_valid_period_ck check (valid_until is null or valid_until > valid_from)
);

create index tenant_memberships_user_status_idx
  on public.tenant_memberships (user_id, status);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete restrict,
  code text not null,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index roles_global_code_uq on public.roles(code) where tenant_id is null;
create unique index roles_tenant_code_uq on public.roles(tenant_id, code) where tenant_id is not null;

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete restrict,
  permission_id uuid not null references public.permissions(id) on delete restrict,
  primary key (role_id, permission_id)
);

create table public.membership_roles (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.tenant_memberships(id) on delete restrict,
  role_id uuid not null references public.roles(id) on delete restrict,
  clinic_unit_id uuid references public.clinic_units(id) on delete restrict
);

create unique index membership_roles_tenant_scope_uq
  on public.membership_roles (membership_id, role_id)
  where clinic_unit_id is null;
create unique index membership_roles_unit_scope_uq
  on public.membership_roles (membership_id, role_id, clinic_unit_id)
  where clinic_unit_id is not null;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete restrict,
  actor_user_id uuid references public.user_profiles(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  request_id text not null check (char_length(request_id) between 1 and 128),
  metadata_redacted jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx
  on public.audit_logs (tenant_id, entity_type, entity_id, created_at desc);

insert into public.permissions (code, description)
values
  ('tenant.read', 'Visualizar dados administrativos do tenant'),
  ('tenant.manage', 'Alterar dados administrativos do tenant'),
  ('units.read', 'Visualizar unidades'),
  ('units.manage', 'Gerenciar unidades'),
  ('memberships.read', 'Visualizar vínculos de usuários'),
  ('memberships.manage', 'Gerenciar vínculos de usuários'),
  ('roles.read', 'Visualizar papéis e permissões'),
  ('roles.manage', 'Gerenciar papéis e permissões'),
  ('audit.read', 'Consultar auditoria administrativa')
on conflict (code) do update set description = excluded.description;

insert into public.roles (id, tenant_id, code, name, is_system)
select gen_random_uuid(), null, 'tenant_admin', 'Administrador do tenant', true
where not exists (
  select 1 from public.roles where tenant_id is null and code = 'tenant_admin'
);

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
on conflict do nothing;

create or replace function public.is_active_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_memberships membership
    join public.user_profiles profile on profile.id = membership.user_id
    where membership.tenant_id = target_tenant_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and profile.status = 'active'
      and membership.valid_from <= now()
      and (membership.valid_until is null or membership.valid_until > now())
  );
$$;

create or replace function public.has_tenant_permission(target_tenant_id uuid, permission_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_memberships membership
    join public.user_profiles profile on profile.id = membership.user_id
    join public.membership_roles membership_role on membership_role.membership_id = membership.id
    join public.roles role on role.id = membership_role.role_id
    join public.role_permissions role_permission on role_permission.role_id = role.id
    join public.permissions permission on permission.id = role_permission.permission_id
    where membership.tenant_id = target_tenant_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and profile.status = 'active'
      and membership.valid_from <= now()
      and (membership.valid_until is null or membership.valid_until > now())
      and (role.tenant_id = target_tenant_id or role.tenant_id is null)
      and permission.code = permission_code
  );
$$;

create or replace function public.append_audit_log(
  target_tenant_id uuid,
  audit_action text,
  audit_entity_type text,
  audit_entity_id uuid,
  audit_request_id text,
  audit_metadata_redacted jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not public.is_active_tenant_member(target_tenant_id) then
    raise exception 'tenant access denied' using errcode = '42501';
  end if;

  if char_length(audit_request_id) not between 1 and 128 then
    raise exception 'invalid request id' using errcode = '22023';
  end if;

  insert into public.audit_logs (
    tenant_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    request_id,
    metadata_redacted
  ) values (
    target_tenant_id,
    auth.uid(),
    audit_action,
    audit_entity_type,
    audit_entity_id,
    audit_request_id,
    coalesce(audit_metadata_redacted, '{}'::jsonb)
  ) returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.get_my_authorization_context(target_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  membership_id uuid;
  permission_codes jsonb;
  unit_ids jsonb;
begin
  select membership.id into membership_id
  from public.tenant_memberships membership
  join public.user_profiles profile on profile.id = membership.user_id
  where membership.tenant_id = target_tenant_id
    and membership.user_id = auth.uid()
    and membership.status = 'active'
    and profile.status = 'active'
    and membership.valid_from <= now()
    and (membership.valid_until is null or membership.valid_until > now());

  if membership_id is null then
    raise exception 'tenant access denied' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(distinct permission.code), '[]'::jsonb)
    into permission_codes
  from public.membership_roles membership_role
  join public.roles role on role.id = membership_role.role_id
  join public.role_permissions role_permission on role_permission.role_id = role.id
  join public.permissions permission on permission.id = role_permission.permission_id
  where membership_role.membership_id = membership_id
    and (role.tenant_id = target_tenant_id or role.tenant_id is null);

  select coalesce(jsonb_agg(distinct unit_scope.id), '[]'::jsonb)
    into unit_ids
  from public.clinic_units unit_scope
  where unit_scope.tenant_id = target_tenant_id
    and (
      exists (
        select 1 from public.membership_roles tenant_wide
        where tenant_wide.membership_id = membership_id
          and tenant_wide.clinic_unit_id is null
      )
      or exists (
        select 1 from public.membership_roles scoped
        where scoped.membership_id = membership_id
          and scoped.clinic_unit_id = unit_scope.id
      )
    );

  return jsonb_build_object(
    'aal', coalesce(auth.jwt() ->> 'aal', 'aal1'),
    'clinicUnitIds', unit_ids,
    'permissions', permission_codes,
    'tenantId', target_tenant_id,
    'userId', auth.uid()
  );
end;
$$;

create or replace function public.create_clinic_unit(
  target_tenant_id uuid,
  unit_code text,
  unit_name text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  new_unit_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'units.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if unit_code !~ '^[A-Z0-9][A-Z0-9_-]{1,31}$' or char_length(trim(unit_name)) not between 2 and 160 then
    raise exception 'invalid unit data' using errcode = '22023';
  end if;

  insert into public.clinic_units (tenant_id, code, name)
  values (target_tenant_id, unit_code, trim(unit_name))
  returning id into new_unit_id;

  perform public.append_audit_log(
    target_tenant_id,
    'clinic_unit.created',
    'clinic_unit',
    new_unit_id,
    audit_request_id,
    jsonb_build_object('code', unit_code)
  );

  return new_unit_id;
end;
$$;

create or replace function public.set_membership_status(
  target_tenant_id uuid,
  target_membership_id uuid,
  new_status text,
  audit_request_id text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.has_tenant_permission(target_tenant_id, 'memberships.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if new_status not in ('active', 'blocked', 'inactive') then
    raise exception 'invalid membership status' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.tenant_memberships self_membership
    where self_membership.id = target_membership_id
      and self_membership.tenant_id = target_tenant_id
      and self_membership.user_id = auth.uid()
  ) then
    raise exception 'cannot change own membership status' using errcode = '42501';
  end if;

  update public.tenant_memberships
  set status = new_status, updated_at = now()
  where id = target_membership_id and tenant_id = target_tenant_id;

  if not found then
    raise exception 'membership not found' using errcode = 'P0002';
  end if;

  perform public.append_audit_log(
    target_tenant_id,
    'membership.status_changed',
    'tenant_membership',
    target_membership_id,
    audit_request_id,
    jsonb_build_object('status', new_status)
  );
end;
$$;

create or replace function public.provision_tenant_for_user(
  target_user_id uuid,
  tenant_legal_name text,
  tenant_trade_name text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  new_tenant_id uuid;
  new_membership_id uuid;
  tenant_admin_role_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;

  if char_length(trim(tenant_legal_name)) not between 2 and 200 then
    raise exception 'invalid tenant name' using errcode = '22023';
  end if;

  select id into tenant_admin_role_id
  from public.roles
  where tenant_id is null and code = 'tenant_admin';

  if tenant_admin_role_id is null then
    raise exception 'tenant admin role missing' using errcode = 'P0002';
  end if;

  insert into public.user_profiles (id, display_name)
  values (target_user_id, 'Usuário pendente de identificação')
  on conflict (id) do nothing;

  insert into public.tenants (legal_name, trade_name)
  values (trim(tenant_legal_name), nullif(trim(tenant_trade_name), ''))
  returning id into new_tenant_id;

  insert into public.tenant_memberships (tenant_id, user_id)
  values (new_tenant_id, target_user_id)
  returning id into new_membership_id;

  insert into public.membership_roles (membership_id, role_id)
  values (new_membership_id, tenant_admin_role_id);

  return new_tenant_id;
end;
$$;

create or replace function public.reject_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit logs are append-only' using errcode = '42501';
end;
$$;

create trigger audit_logs_append_only
before update or delete on public.audit_logs
for each row execute function public.reject_audit_mutation();

revoke all on function public.reject_audit_mutation() from public;

revoke all on function public.is_active_tenant_member(uuid) from public;
revoke all on function public.has_tenant_permission(uuid, text) from public;
revoke all on function public.append_audit_log(uuid, text, text, uuid, text, jsonb) from public;
revoke all on function public.get_my_authorization_context(uuid) from public;
revoke all on function public.create_clinic_unit(uuid, text, text, text) from public;
revoke all on function public.set_membership_status(uuid, uuid, text, text) from public;
revoke all on function public.provision_tenant_for_user(uuid, text, text) from public;
grant execute on function public.is_active_tenant_member(uuid) to authenticated;
grant execute on function public.has_tenant_permission(uuid, text) to authenticated;
grant execute on function public.get_my_authorization_context(uuid) to authenticated;
grant execute on function public.create_clinic_unit(uuid, text, text, text) to authenticated;
grant execute on function public.set_membership_status(uuid, uuid, text, text) to authenticated;
grant execute on function public.provision_tenant_for_user(uuid, text, text) to service_role;

alter table public.tenants enable row level security;
alter table public.clinic_units enable row level security;
alter table public.user_profiles enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.membership_roles enable row level security;
alter table public.audit_logs enable row level security;

create policy tenants_select on public.tenants for select to authenticated
  using (public.is_active_tenant_member(id));
create policy tenants_update on public.tenants for update to authenticated
  using (public.has_tenant_permission(id, 'tenant.manage'))
  with check (public.has_tenant_permission(id, 'tenant.manage'));

create policy clinic_units_select on public.clinic_units for select to authenticated
  using (
    public.has_tenant_permission(tenant_id, 'units.read')
    or public.has_tenant_permission(tenant_id, 'tenant.read')
  );
create policy clinic_units_insert on public.clinic_units for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'units.manage'));
create policy clinic_units_update on public.clinic_units for update to authenticated
  using (public.has_tenant_permission(tenant_id, 'units.manage'))
  with check (public.has_tenant_permission(tenant_id, 'units.manage'));

create policy user_profiles_self_select on public.user_profiles for select to authenticated
  using (id = auth.uid());
create policy user_profiles_peer_select on public.user_profiles for select to authenticated
  using (
    exists (
      select 1
      from public.tenant_memberships peer
      where peer.user_id = user_profiles.id
        and public.has_tenant_permission(peer.tenant_id, 'memberships.read')
    )
  );

create policy tenant_memberships_select on public.tenant_memberships for select to authenticated
  using (
    user_id = auth.uid()
    or public.has_tenant_permission(tenant_id, 'memberships.read')
  );
create policy tenant_memberships_insert on public.tenant_memberships for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'memberships.manage'));
create policy tenant_memberships_update on public.tenant_memberships for update to authenticated
  using (public.has_tenant_permission(tenant_id, 'memberships.manage'))
  with check (public.has_tenant_permission(tenant_id, 'memberships.manage'));

create policy roles_select on public.roles for select to authenticated
  using (tenant_id is null or public.has_tenant_permission(tenant_id, 'roles.read'));
create policy roles_insert on public.roles for insert to authenticated
  with check (tenant_id is not null and public.has_tenant_permission(tenant_id, 'roles.manage'));
create policy roles_update on public.roles for update to authenticated
  using (tenant_id is not null and public.has_tenant_permission(tenant_id, 'roles.manage'))
  with check (tenant_id is not null and public.has_tenant_permission(tenant_id, 'roles.manage'));

create policy permissions_select on public.permissions for select to authenticated using (true);

create policy role_permissions_select on public.role_permissions for select to authenticated
  using (
    exists (
      select 1 from public.roles role
      where role.id = role_permissions.role_id
        and (role.tenant_id is null or public.has_tenant_permission(role.tenant_id, 'roles.read'))
    )
  );
create policy role_permissions_insert on public.role_permissions for insert to authenticated
  with check (
    exists (
      select 1 from public.roles role
      where role.id = role_permissions.role_id
        and role.tenant_id is not null
        and public.has_tenant_permission(role.tenant_id, 'roles.manage')
    )
  );
create policy role_permissions_delete on public.role_permissions for delete to authenticated
  using (
    exists (
      select 1 from public.roles role
      where role.id = role_permissions.role_id
        and role.tenant_id is not null
        and public.has_tenant_permission(role.tenant_id, 'roles.manage')
    )
  );

create policy membership_roles_select on public.membership_roles for select to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships membership
      where membership.id = membership_roles.membership_id
        and (
          membership.user_id = auth.uid()
          or public.has_tenant_permission(membership.tenant_id, 'roles.read')
        )
    )
  );
create policy membership_roles_insert on public.membership_roles for insert to authenticated
  with check (
    exists (
      select 1 from public.tenant_memberships membership
      join public.roles role on role.id = membership_roles.role_id
      where membership.id = membership_roles.membership_id
        and (role.tenant_id = membership.tenant_id or role.tenant_id is null)
        and (
          membership_roles.clinic_unit_id is null
          or exists (
            select 1 from public.clinic_units unit_scope
            where unit_scope.id = membership_roles.clinic_unit_id
              and unit_scope.tenant_id = membership.tenant_id
          )
        )
        and public.has_tenant_permission(membership.tenant_id, 'roles.manage')
    )
  );
create policy membership_roles_delete on public.membership_roles for delete to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships membership
      where membership.id = membership_roles.membership_id
        and public.has_tenant_permission(membership.tenant_id, 'roles.manage')
    )
  );

create policy audit_logs_select on public.audit_logs for select to authenticated
  using (tenant_id is not null and public.has_tenant_permission(tenant_id, 'audit.read'));

commit;
