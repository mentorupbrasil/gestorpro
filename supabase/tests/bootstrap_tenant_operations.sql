begin;

select plan(4);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('21000000-0000-4000-8000-000000000021', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'boot-admin@example.invalid', '', now(), now());

insert into public.user_profiles (id, display_name)
values ('21000000-0000-4000-8000-000000000021', 'Admin Bootstrap');

insert into public.tenants (id, legal_name)
values ('c0000000-0000-4000-8000-000000000021', 'Tenant Bootstrap');

insert into public.tenant_memberships (id, tenant_id, user_id)
values ('c1000000-0000-4000-8000-000000000021', 'c0000000-0000-4000-8000-000000000021', '21000000-0000-4000-8000-000000000021');

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
on conflict do nothing;

insert into public.membership_roles (membership_id, role_id)
select
  'c1000000-0000-4000-8000-000000000021',
  role.id
from public.roles role
where role.tenant_id is null
  and role.code = 'tenant_admin'
limit 1;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000021', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.aal', 'aal1', true);

select throws_ok(
  $$select public.bootstrap_tenant_operations(
    'c0000000-0000-4000-8000-000000000021',
    'boot-aal1'
  )$$,
  '42501',
  'aal2 required',
  'bootstrap requires AAL2'
);

select set_config('request.jwt.claim.aal', 'aal2', true);

select lives_ok(
  $$select public.bootstrap_tenant_operations(
    'c0000000-0000-4000-8000-000000000021',
    'boot-ok'
  )$$,
  'admin can bootstrap tenant operations'
);

select ok(
  exists (
    select 1 from public.clinic_units
    where tenant_id = 'c0000000-0000-4000-8000-000000000021'
      and code = 'SEDE'
      and status = 'active'
  )
  and exists (
    select 1 from public.triage_form_versions
    where tenant_id = 'c0000000-0000-4000-8000-000000000021'
      and status = 'draft'
  )
  and exists (
    select 1 from public.document_template_versions version
    join public.document_templates template
      on template.id = version.template_id
     and template.tenant_id = version.tenant_id
    where version.tenant_id = 'c0000000-0000-4000-8000-000000000021'
      and template.document_type = 'aso'
      and version.status = 'draft'
  ),
  'bootstrap creates unit and draft clinical templates only'
);

select ok(
  not exists (
    select 1
    from public.membership_roles mr
    join public.roles r on r.id = mr.role_id
    where mr.membership_id = 'c1000000-0000-4000-8000-000000000021'
      and r.code in ('receptionist', 'nursing', 'occupational_physician', 'finance', 'unit_manager')
  ),
  'bootstrap does not self-grant clinical or finance roles'
);

reset role;
select * from finish();
rollback;
