begin;

create or replace function public.is_aal2()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

create or replace function public.has_tenant_permission(
  target_tenant_id uuid,
  permission_code text
)
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
      and membership_role.clinic_unit_id is null
      and (role.tenant_id = target_tenant_id or role.tenant_id is null)
      and permission.code = permission_code
  );
$$;

create or replace function public.has_unit_permission(
  target_unit_id uuid,
  permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clinic_units unit_scope
    where unit_scope.id = target_unit_id
      and (
        public.has_tenant_permission(unit_scope.tenant_id, permission_code)
        or exists (
          select 1
          from public.tenant_memberships membership
          join public.user_profiles profile on profile.id = membership.user_id
          join public.membership_roles membership_role on membership_role.membership_id = membership.id
          join public.roles role on role.id = membership_role.role_id
          join public.role_permissions role_permission on role_permission.role_id = role.id
          join public.permissions permission on permission.id = role_permission.permission_id
          where membership.tenant_id = unit_scope.tenant_id
            and membership.user_id = auth.uid()
            and membership.status = 'active'
            and profile.status = 'active'
            and membership.valid_from <= now()
            and (membership.valid_until is null or membership.valid_until > now())
            and membership_role.clinic_unit_id = unit_scope.id
            and (role.tenant_id = unit_scope.tenant_id or role.tenant_id is null)
            and permission.code = permission_code
        )
      )
  );
$$;

create or replace function public.has_company_permission(
  target_company_id uuid,
  permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.companies company
    where company.id = target_company_id
      and public.has_tenant_permission(company.tenant_id, permission_code)
  );
$$;

create or replace function public.has_professional_permission(
  target_professional_id uuid,
  permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clinical_professional_credentials professional
    where professional.id = target_professional_id
      and professional.status = 'active'
      and (
        (professional.clinic_unit_id is null
          and public.has_tenant_permission(professional.tenant_id, permission_code))
        or (professional.clinic_unit_id is not null
          and public.has_unit_permission(professional.clinic_unit_id, permission_code))
      )
  );
$$;

create or replace function public.has_encounter_permission(
  target_encounter_id uuid,
  permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.encounters encounter
    where encounter.id = target_encounter_id
      and public.has_unit_permission(encounter.clinic_unit_id, permission_code)
  );
$$;

create or replace function public.has_document_permission(
  target_document_id uuid,
  permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.generated_documents document
    where document.id = target_document_id
      and (
        (document.encounter_id is not null
          and public.has_encounter_permission(document.encounter_id, permission_code))
        or (document.encounter_id is null
          and public.has_tenant_permission(document.tenant_id, permission_code))
      )
  );
$$;

create or replace function public.get_my_authorization_context(target_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_membership_id uuid;
  permission_codes jsonb;
  unit_ids jsonb;
  unit_permissions jsonb;
begin
  select membership.id into current_membership_id
  from public.tenant_memberships membership
  join public.user_profiles profile on profile.id = membership.user_id
  where membership.tenant_id = target_tenant_id
    and membership.user_id = auth.uid()
    and membership.status = 'active'
    and profile.status = 'active'
    and membership.valid_from <= now()
    and (membership.valid_until is null or membership.valid_until > now());

  if current_membership_id is null then
    raise exception 'tenant access denied' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(distinct permission.code), '[]'::jsonb)
    into permission_codes
  from public.membership_roles membership_role
  join public.roles role on role.id = membership_role.role_id
  join public.role_permissions role_permission on role_permission.role_id = role.id
  join public.permissions permission on permission.id = role_permission.permission_id
  where membership_role.membership_id = current_membership_id
    and membership_role.clinic_unit_id is null
    and (role.tenant_id = target_tenant_id or role.tenant_id is null);

  select coalesce(jsonb_agg(distinct unit_scope.id), '[]'::jsonb)
    into unit_ids
  from public.clinic_units unit_scope
  where unit_scope.tenant_id = target_tenant_id
    and (
      exists (
        select 1 from public.membership_roles tenant_wide
        where tenant_wide.membership_id = current_membership_id
          and tenant_wide.clinic_unit_id is null
      )
      or exists (
        select 1 from public.membership_roles scoped
        where scoped.membership_id = current_membership_id
          and scoped.clinic_unit_id = unit_scope.id
      )
    );

  select coalesce(jsonb_object_agg(scoped.unit_id::text, scoped.permission_codes), '{}'::jsonb)
    into unit_permissions
  from (
    select membership_role.clinic_unit_id as unit_id,
      jsonb_agg(distinct permission.code) as permission_codes
    from public.membership_roles membership_role
    join public.roles role on role.id = membership_role.role_id
    join public.role_permissions role_permission on role_permission.role_id = role.id
    join public.permissions permission on permission.id = role_permission.permission_id
    join public.clinic_units unit_scope on unit_scope.id = membership_role.clinic_unit_id
    where membership_role.membership_id = current_membership_id
      and membership_role.clinic_unit_id is not null
      and unit_scope.tenant_id = target_tenant_id
      and (role.tenant_id = target_tenant_id or role.tenant_id is null)
    group by membership_role.clinic_unit_id
  ) scoped;

  return jsonb_build_object(
    'aal', coalesce(auth.jwt() ->> 'aal', 'aal1'),
    'authorizationVersion', 2,
    'clinicUnitIds', unit_ids,
    'permissions', permission_codes,
    'tenantId', target_tenant_id,
    'unitPermissions', unit_permissions,
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
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'units.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if unit_code !~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'
    or char_length(trim(unit_name)) not between 2 and 160 then
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
declare
  previous_status text;
  target_is_tenant_admin boolean;
  active_tenant_admins bigint;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'memberships.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if new_status not in ('active', 'blocked', 'inactive') then
    raise exception 'invalid membership status' using errcode = '22023';
  end if;

  select membership.status into previous_status
  from public.tenant_memberships membership
  where membership.id = target_membership_id
    and membership.tenant_id = target_tenant_id
  for update;

  if previous_status is null then
    raise exception 'membership not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.tenant_memberships self_membership
    where self_membership.id = target_membership_id
      and self_membership.user_id = auth.uid()
  ) then
    raise exception 'cannot change own membership status' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.membership_roles membership_role
    join public.roles role on role.id = membership_role.role_id
    where membership_role.membership_id = target_membership_id
      and membership_role.clinic_unit_id is null
      and role.code = 'tenant_admin'
      and (role.tenant_id = target_tenant_id or role.tenant_id is null)
  ) into target_is_tenant_admin;

  if previous_status = 'active' and new_status <> 'active' and target_is_tenant_admin then
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
      and (role.tenant_id = target_tenant_id or role.tenant_id is null);

    if active_tenant_admins <= 1 then
      raise exception 'cannot block or remove the last active tenant administrator'
        using errcode = '42501';
    end if;
  end if;

  update public.tenant_memberships
  set status = new_status, updated_at = now()
  where id = target_membership_id and tenant_id = target_tenant_id;

  perform public.append_audit_log(
    target_tenant_id,
    'membership.status_changed',
    'tenant_membership',
    target_membership_id,
    audit_request_id,
    jsonb_build_object(
      'after', jsonb_build_object('status', new_status),
      'before', jsonb_build_object('status', previous_status)
    )
  );
end;
$$;

-- Policies never grant table privileges. Removing write policies as well as
-- table DML grants makes the intended RPC-only mutation boundary explicit.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_catalog.pg_policies
    where schemaname = 'public' and cmd <> 'SELECT'
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

revoke insert, update, delete on all tables in schema public from anon, authenticated;
alter default privileges in schema public
  revoke insert, update, delete on tables from anon, authenticated;

-- Freeze every previously published mutating security-definer RPC. Only the
-- read-only authorization helpers and the two functions hardened above remain.
do $$
declare
  routine_record record;
begin
  for routine_record in
    select namespace.nspname as schema_name,
      proc.proname as function_name,
      pg_catalog.pg_get_function_identity_arguments(proc.oid) as arguments
    from pg_catalog.pg_proc proc
    join pg_catalog.pg_namespace namespace on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.prosecdef
      and proc.proname <> all (array[
        'create_clinic_unit',
        'get_my_authorization_context',
        'has_company_permission',
        'has_document_permission',
        'has_encounter_permission',
        'has_professional_permission',
        'has_tenant_permission',
        'has_unit_permission',
        'is_active_tenant_member',
        'set_membership_status'
      ])
  loop
    execute format(
      'revoke execute on function %I.%I(%s) from authenticated',
      routine_record.schema_name,
      routine_record.function_name,
      routine_record.arguments
    );
  end loop;
end;
$$;

revoke all on function public.is_aal2() from public;
revoke all on function public.has_unit_permission(uuid, text) from public;
revoke all on function public.has_company_permission(uuid, text) from public;
revoke all on function public.has_professional_permission(uuid, text) from public;
revoke all on function public.has_encounter_permission(uuid, text) from public;
revoke all on function public.has_document_permission(uuid, text) from public;

grant execute on function public.is_aal2() to authenticated;
grant execute on function public.has_unit_permission(uuid, text) to authenticated;
grant execute on function public.has_company_permission(uuid, text) to authenticated;
grant execute on function public.has_professional_permission(uuid, text) to authenticated;
grant execute on function public.has_encounter_permission(uuid, text) to authenticated;
grant execute on function public.has_document_permission(uuid, text) to authenticated;

commit;
