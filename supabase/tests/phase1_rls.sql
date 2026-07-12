begin;

select plan(14);

select has_table('public', 'tenants', 'tenants exists');
select has_table('public', 'tenant_memberships', 'memberships exists');
select has_table('public', 'roles', 'roles exists');
select has_table('public', 'permissions', 'permissions exists');
select has_table('public', 'audit_logs', 'audit log exists');
select is(
  (select relrowsecurity from pg_class where oid = 'public.tenants'::regclass),
  true,
  'tenants has active RLS'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.tenant_memberships'::regclass),
  true,
  'memberships have active RLS'
);
select has_trigger('public', 'audit_logs', 'audit_logs_append_only', 'audit trigger exists');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user-a@example.invalid', '', now(), now()),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user-b@example.invalid', '', now(), now());

insert into public.user_profiles (id, display_name)
values
  ('10000000-0000-4000-8000-000000000001', 'Pessoa Fictícia A'),
  ('20000000-0000-4000-8000-000000000002', 'Pessoa Fictícia B');

insert into public.tenants (id, legal_name)
values
  ('a0000000-0000-4000-8000-000000000001', 'Tenant Fictício A'),
  ('b0000000-0000-4000-8000-000000000002', 'Tenant Fictício B');

insert into public.tenant_memberships (id, tenant_id, user_id)
values
  ('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
  ('b1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002');

insert into public.roles (id, tenant_id, code, name)
values ('a2000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'tenant_reader', 'Leitura do tenant');

insert into public.role_permissions (role_id, permission_id)
select 'a2000000-0000-4000-8000-000000000001', id
from public.permissions where code in ('tenant.read', 'units.manage');

insert into public.membership_roles (membership_id, role_id)
values ('a1000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.aal', 'aal1', true);

select is((select count(*) from public.tenants), 1::bigint, 'tenant A cannot list tenant B');
select throws_ok(
  $$select public.get_my_authorization_context('b0000000-0000-4000-8000-000000000002')$$,
  '42501',
  'tenant access denied',
  'tenant A cannot resolve tenant B context'
);
select ok(
  public.create_clinic_unit(
    'a0000000-0000-4000-8000-000000000001',
    'FOR-01',
    'Unidade Fictícia Fortaleza',
    'pgtap-request-1'
  ) is not null,
  'authorized operation creates a unit and its internal audit event'
);
select throws_ok(
  $$select public.set_membership_status(
    'a0000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'blocked',
    'pgtap-request-2'
  )$$,
  '42501',
  'cannot change own membership status',
  'an administrator cannot accidentally block their own active membership'
);

reset role;
select throws_ok(
  $$update public.audit_logs set action = 'tampered' where request_id = 'pgtap-request-1'$$,
  '42501',
  'audit logs are append-only',
  'audit row cannot be updated even by a privileged connection'
);

update public.tenant_memberships
set status = 'blocked'
where id = 'a1000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is((select count(*) from public.tenants), 0::bigint, 'blocked membership loses tenant access');

select * from finish();
rollback;
