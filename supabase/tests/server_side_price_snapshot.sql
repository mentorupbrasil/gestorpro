begin;

select plan(2);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values (
  '31000000-0000-4000-8000-000000000031',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'finance-admin@example.invalid',
  '',
  now(),
  now()
);

insert into public.user_profiles (id, display_name)
values ('31000000-0000-4000-8000-000000000031', 'Admin Financeiro Fictício');

insert into public.tenants (id, legal_name)
values ('d0000000-0000-4000-8000-000000000031', 'Tenant Financeiro A');

insert into public.tenant_memberships (id, tenant_id, user_id, status)
values (
  'd1000000-0000-4000-8000-000000000031',
  'd0000000-0000-4000-8000-000000000031',
  '31000000-0000-4000-8000-000000000031',
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
  'd3000000-0000-4000-8000-000000000031',
  'd1000000-0000-4000-8000-000000000031',
  role.id
from public.roles role
where role.tenant_id is null
  and role.code = 'tenant_admin'
limit 1;

insert into public.companies (id, tenant_id, legal_name, trade_name, tax_id_normalized)
values (
  'd4000000-0000-4000-8000-000000000031',
  'd0000000-0000-4000-8000-000000000031',
  'Empresa Financeira Fictícia',
  'Emp Fin',
  '00000000000272'
);

insert into public.commercial_contracts (
  id, tenant_id, company_id, code, name, starts_on, status
)
values (
  'd5000000-0000-4000-8000-000000000031',
  'd0000000-0000-4000-8000-000000000031',
  'd4000000-0000-4000-8000-000000000031',
  'CTR-FIN',
  'Contrato Financeiro Fictício',
  current_date,
  'active'
);

insert into public.commercial_price_tables (
  id, tenant_id, contract_id, version, effective_from, status, approved_by, approved_at
)
values (
  'd6000000-0000-4000-8000-000000000031',
  'd0000000-0000-4000-8000-000000000031',
  'd5000000-0000-4000-8000-000000000031',
  1,
  current_date,
  'approved',
  '31000000-0000-4000-8000-000000000031',
  now()
);

insert into public.commercial_price_items (
  id, tenant_id, price_table_id, billable_code, description, unit_price_cents
)
values (
  'd7000000-0000-4000-8000-000000000031',
  'd0000000-0000-4000-8000-000000000031',
  'd6000000-0000-4000-8000-000000000031',
  'ASO',
  'ASO ocupacional',
  15000
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000031', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.aal', 'aal2', true);

select throws_ok(
  $$select public.create_encounter_price_snapshot(
    'd0000000-0000-4000-8000-000000000031',
    'd8000000-0000-4000-8000-000000000031',
    'd5000000-0000-4000-8000-000000000031',
    'd6000000-0000-4000-8000-000000000031',
    '{"items":[{"billableCode":"ASO","technicalRepeat":false,"amountCents":1}]}'::jsonb,
    'client-forged-hash',
    'price-server-missing-encounter'
  )$$,
  'P0002',
  'encounter not found',
  'snapshot exige encounter do tenant mesmo com amountCents forjado'
);

select throws_ok(
  $$select public.create_encounter_price_snapshot(
    'd0000000-0000-4000-8000-000000000031',
    'd8000000-0000-4000-8000-000000000031',
    'd5000000-0000-4000-8000-000000000031',
    'd6000000-0000-4000-8000-000000000099',
    '{"items":[{"billableCode":"ASO"}]}'::jsonb,
    '',
    'price-server-bad-table'
  )$$,
  'P0002',
  'encounter not found',
  'encounter inválido bloqueia antes de usar preço'
);

select * from finish();
rollback;
