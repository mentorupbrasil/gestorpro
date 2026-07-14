begin;

select plan(7);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('11000000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-a@example.invalid', '', now(), now()),
  ('12000000-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member-a@example.invalid', '', now(), now()),
  ('13000000-0000-4000-8000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-b@example.invalid', '', now(), now());

insert into public.user_profiles (id, display_name)
values
  ('11000000-0000-4000-8000-000000000011', 'Admin Fictício A'),
  ('12000000-0000-4000-8000-000000000012', 'Membro Fictício A'),
  ('13000000-0000-4000-8000-000000000013', 'Admin Fictício B');

insert into public.tenants (id, legal_name)
values
  ('a0000000-0000-4000-8000-000000000011', 'Tenant Papéis A'),
  ('b0000000-0000-4000-8000-000000000012', 'Tenant Papéis B');

insert into public.tenant_memberships (id, tenant_id, user_id)
values
  ('a1000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000011', '11000000-0000-4000-8000-000000000011'),
  ('a1000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000011', '12000000-0000-4000-8000-000000000012'),
  ('b1000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000012', '13000000-0000-4000-8000-000000000013');

insert into public.roles (id, tenant_id, code, name, is_system)
values (
  'a2000000-0000-4000-8000-000000000012',
  'a0000000-0000-4000-8000-000000000011',
  'tenant_reader',
  'Leitura do tenant',
  false
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
  'a3000000-0000-4000-8000-000000000011',
  'a1000000-0000-4000-8000-000000000011',
  role.id
from public.roles role
where role.tenant_id is null
  and role.code = 'tenant_admin'
limit 1;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000011', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.aal', 'aal1', true);

select throws_ok(
  $$select public.assign_membership_role(
    'a0000000-0000-4000-8000-000000000011',
    'a1000000-0000-4000-8000-000000000012',
    'a2000000-0000-4000-8000-000000000012',
    null,
    'p0-5-aal1'
  )$$,
  '42501',
  'aal2 required',
  'role assign requires AAL2'
);

select set_config('request.jwt.claim.aal', 'aal2', true);

select throws_ok(
  $$select public.assign_membership_role(
    'a0000000-0000-4000-8000-000000000011',
    'a1000000-0000-4000-8000-000000000011',
    'a2000000-0000-4000-8000-000000000012',
    null,
    'p0-5-self'
  )$$,
  '42501',
  'cannot change own membership roles',
  'administrator cannot self-assign roles'
);

select lives_ok(
  $$select public.assign_membership_role(
    'a0000000-0000-4000-8000-000000000011',
    'a1000000-0000-4000-8000-000000000012',
    'a2000000-0000-4000-8000-000000000012',
    null,
    'p0-5-assign-ok'
  )$$,
  'authorized AAL2 admin can assign a tenant-scoped role'
);

select throws_ok(
  $$select public.revoke_membership_role(
    'a0000000-0000-4000-8000-000000000011',
    'a3000000-0000-4000-8000-000000000011',
    'p0-5-last-admin'
  )$$,
  '42501',
  'cannot revoke the last active tenant administrator role',
  'last tenant_admin role cannot be stripped'
);

select throws_ok(
  $$select public.assign_membership_role(
    'b0000000-0000-4000-8000-000000000012',
    'b1000000-0000-4000-8000-000000000013',
    (select id from public.roles where tenant_id is null and code = 'tenant_admin' limit 1),
    null,
    'p0-5-cross-tenant'
  )$$,
  '42501',
  'permission denied',
  'cross-tenant role assign is denied'
);

select throws_ok(
  $$insert into public.membership_roles (membership_id, role_id)
    values (
      'a1000000-0000-4000-8000-000000000012',
      (select id from public.roles where tenant_id is null and code = 'tenant_admin' limit 1)
    )$$,
  '42501',
  null,
  'direct DML on membership_roles remains denied'
);

select ok(
  exists (
    select 1 from public.audit_logs
    where request_id = 'p0-5-assign-ok'
      and action = 'membership_role.assigned'
  ),
  'successful assign writes audit in the same transaction boundary'
);

reset role;
select * from finish();
rollback;
