begin;

select plan(4);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('21000000-0000-4000-8000-000000000021', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'portal-admin@example.invalid', '', now(), now()),
  ('22000000-0000-4000-8000-000000000022', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'portal-outsider@example.invalid', '', now(), now());

insert into public.user_profiles (id, display_name)
values
  ('21000000-0000-4000-8000-000000000021', 'Admin Portal Fictício'),
  ('22000000-0000-4000-8000-000000000022', 'Usuário Fora do Tenant');

insert into public.tenants (id, legal_name)
values ('c0000000-0000-4000-8000-000000000021', 'Tenant Portal A');

insert into public.tenant_memberships (id, tenant_id, user_id, status)
values (
  'c1000000-0000-4000-8000-000000000021',
  'c0000000-0000-4000-8000-000000000021',
  '21000000-0000-4000-8000-000000000021',
  'active'
);

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
on conflict do nothing;

insert into public.membership_roles (id, membership_id, role_id)
select
  'c3000000-0000-4000-8000-000000000021',
  'c1000000-0000-4000-8000-000000000021',
  role.id
from public.roles role
where role.tenant_id is null
  and role.code = 'tenant_admin'
limit 1;

insert into public.companies (id, tenant_id, legal_name, trade_name, tax_id_normalized)
values (
  'c4000000-0000-4000-8000-000000000021',
  'c0000000-0000-4000-8000-000000000021',
  'Empresa Portal Fictícia',
  'Empresa Portal',
  '00000000000191'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000021', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.aal', 'aal1', true);

select throws_ok(
  $$select public.upsert_company_portal_user(
    'c0000000-0000-4000-8000-000000000021',
    'c4000000-0000-4000-8000-000000000021',
    '22000000-0000-4000-8000-000000000022',
    'active',
    '[]'::jsonb,
    'portal-idor-aal1'
  )$$,
  '42501',
  'aal2 required',
  'portal upsert exige aal2'
);

select set_config('request.jwt.claim.aal', 'aal2', true);

select throws_ok(
  $$select public.upsert_company_portal_user(
    'c0000000-0000-4000-8000-000000000021',
    'c4000000-0000-4000-8000-000000000021',
    '22000000-0000-4000-8000-000000000022',
    'active',
    '[]'::jsonb,
    'portal-idor-no-membership'
  )$$,
  '42501',
  'active tenant membership required',
  'portal upsert nega usuário sem membership do tenant'
);

select throws_ok(
  $$select public.upsert_company_document_release_rule(
    'c0000000-0000-4000-8000-000000000021',
    'c4000000-0000-4000-8000-000000000099',
    'aso',
    true,
    'operational',
    'portal-idor-release-cross'
  )$$,
  'P0002',
  'company not found',
  'release rule exige empresa do tenant'
);

select is(
  public.is_company_portal_member(
    'c0000000-0000-4000-8000-000000000021',
    'c4000000-0000-4000-8000-000000000021'
  ),
  false,
  'sem linha de portal + membership, helper retorna false'
);

select * from finish();
rollback;
