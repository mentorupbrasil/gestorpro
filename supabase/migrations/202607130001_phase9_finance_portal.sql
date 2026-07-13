begin;

insert into public.permissions (code, description)
values
  ('finance.read', 'Visualizar financeiro e faturamento'),
  ('finance.manage', 'Gerenciar orçamento, faturamento e pagamentos'),
  ('company_portal.read', 'Visualizar portal empresarial autorizado'),
  ('company_portal.manage', 'Gerenciar usuários e matriz do portal empresarial')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in (
    'finance.read',
    'finance.manage',
    'company_portal.read',
    'company_portal.manage'
  )
on conflict do nothing;

create table public.commercial_contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null,
  starts_on date not null,
  ends_on date,
  status text not null default 'draft' check (status in ('draft', 'active', 'suspended', 'ended')),
  billing_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint commercial_contracts_code_uq unique (tenant_id, code),
  constraint commercial_contracts_period_ck check (ends_on is null or ends_on >= starts_on)
);

create table public.commercial_price_tables (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  contract_id uuid not null references public.commercial_contracts(id) on delete restrict,
  version int not null check (version > 0),
  effective_from date not null,
  effective_until date,
  status text not null default 'draft' check (status in ('draft', 'approved', 'retired')),
  approved_by uuid references public.user_profiles(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint commercial_price_tables_version_uq unique (tenant_id, contract_id, version),
  constraint commercial_price_tables_period_ck check (
    effective_until is null or effective_until >= effective_from
  )
);

create table public.commercial_price_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  price_table_id uuid not null references public.commercial_price_tables(id) on delete restrict,
  billable_code text not null,
  description text not null,
  unit_price_cents int not null check (unit_price_cents >= 0),
  currency text not null default 'BRL',
  technical_repeat_billable boolean not null default false,
  created_at timestamptz not null default now(),
  constraint commercial_price_items_code_uq unique (tenant_id, price_table_id, billable_code)
);

create table public.encounter_price_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  contract_id uuid not null references public.commercial_contracts(id) on delete restrict,
  price_table_id uuid not null references public.commercial_price_tables(id) on delete restrict,
  snapshot_payload jsonb not null,
  content_hash text not null,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint encounter_price_snapshots_encounter_uq unique (tenant_id, encounter_id)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  contract_id uuid references public.commercial_contracts(id) on delete restrict,
  status text not null default 'draft' check (
    status in ('draft', 'sent', 'approved', 'rejected', 'converted', 'expired')
  ),
  total_cents int not null default 0 check (total_cents >= 0),
  approved_by uuid references public.user_profiles(id) on delete restrict,
  approved_at timestamptz,
  converted_at timestamptz,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  quote_id uuid not null references public.quotes(id) on delete restrict,
  description text not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  total_cents int not null check (total_cents >= 0),
  price_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.billing_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  encounter_id uuid references public.encounters(id) on delete restrict,
  quote_item_id uuid references public.quote_items(id) on delete restrict,
  description text not null,
  amount_cents int not null check (amount_cents >= 0),
  billable boolean not null default true,
  non_billable_reason text,
  status text not null default 'pending' check (
    status in ('pending', 'ready', 'invoiced', 'adjusted', 'written_off', 'cancelled')
  ),
  price_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  status text not null default 'draft' check (
    status in ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled')
  ),
  total_cents int not null default 0 check (total_cents >= 0),
  due_on date,
  issued_at timestamptz,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  billing_item_id uuid not null references public.billing_items(id) on delete restrict,
  description text not null,
  amount_cents int not null check (amount_cents >= 0),
  created_at timestamptz not null default now(),
  constraint invoice_items_billing_item_uq unique (tenant_id, billing_item_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  amount_cents int not null check (amount_cents > 0),
  paid_at timestamptz not null,
  method text not null,
  reference text,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.billing_adjustments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  billing_item_id uuid not null references public.billing_items(id) on delete restrict,
  adjustment_type text not null check (adjustment_type in ('discount', 'addition', 'write_off')),
  amount_cents int not null check (amount_cents >= 0),
  justification text not null check (char_length(trim(justification)) >= 10),
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.billing_denials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  invoice_item_id uuid not null references public.invoice_items(id) on delete restrict,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'accepted', 'contested', 'resolved')),
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.company_portal_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  user_id uuid not null references public.user_profiles(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  scopes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint company_portal_users_user_uq unique (tenant_id, company_id, user_id)
);

create table public.company_document_release_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  document_type text not null,
  release_to_company boolean not null default false,
  redaction_profile text not null default 'operational',
  created_at timestamptz not null default now(),
  constraint company_document_release_rules_type_uq unique (tenant_id, company_id, document_type)
);

create table public.internal_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  notification_type text not null,
  title text not null,
  body_redacted text not null,
  target_user_id uuid references public.user_profiles(id) on delete restrict,
  status text not null default 'unread' check (status in ('unread', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create or replace function public.create_encounter_price_snapshot(
  target_tenant_id uuid,
  target_encounter_id uuid,
  target_contract_id uuid,
  target_price_table_id uuid,
  snapshot_payload_value jsonb,
  content_hash_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  snapshot_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'finance.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  insert into public.encounter_price_snapshots (
    tenant_id,
    encounter_id,
    contract_id,
    price_table_id,
    snapshot_payload,
    content_hash,
    created_by
  )
  values (
    target_tenant_id,
    target_encounter_id,
    target_contract_id,
    target_price_table_id,
    snapshot_payload_value,
    content_hash_value,
    auth.uid()
  )
  returning id into snapshot_id;

  perform public.log_audit(
    target_tenant_id,
    'finance.price_snapshot.created',
    'encounter_price_snapshots',
    snapshot_id,
    audit_request_id,
    '{}'::jsonb
  );

  return snapshot_id;
end;
$$;

create or replace function public.issue_invoice(
  target_tenant_id uuid,
  target_company_id uuid,
  billing_item_ids uuid[],
  due_on_value date,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  invoice_id uuid;
  total_value int;
begin
  if not public.has_tenant_permission(target_tenant_id, 'finance.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select coalesce(sum(amount_cents), 0)
    into total_value
  from public.billing_items item
  where item.tenant_id = target_tenant_id
    and item.company_id = target_company_id
    and item.id = any(billing_item_ids)
    and item.status in ('pending', 'ready')
    and item.billable = true;

  insert into public.invoices (tenant_id, company_id, status, total_cents, due_on, issued_at, created_by)
  values (target_tenant_id, target_company_id, 'issued', total_value, due_on_value, now(), auth.uid())
  returning id into invoice_id;

  insert into public.invoice_items (tenant_id, invoice_id, billing_item_id, description, amount_cents)
  select target_tenant_id, invoice_id, item.id, item.description, item.amount_cents
  from public.billing_items item
  where item.tenant_id = target_tenant_id
    and item.company_id = target_company_id
    and item.id = any(billing_item_ids)
    and item.status in ('pending', 'ready')
    and item.billable = true;

  update public.billing_items
    set status = 'invoiced'
  where tenant_id = target_tenant_id
    and company_id = target_company_id
    and id = any(billing_item_ids)
    and billable = true;

  perform public.log_audit(
    target_tenant_id,
    'invoice.issued',
    'invoices',
    invoice_id,
    audit_request_id,
    jsonb_build_object('totalCents', total_value)
  );

  return invoice_id;
end;
$$;

alter table public.commercial_contracts enable row level security;
alter table public.commercial_price_tables enable row level security;
alter table public.commercial_price_items enable row level security;
alter table public.encounter_price_snapshots enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.billing_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.billing_adjustments enable row level security;
alter table public.billing_denials enable row level security;
alter table public.company_portal_users enable row level security;
alter table public.company_document_release_rules enable row level security;
alter table public.internal_notifications enable row level security;

create policy finance_contracts_read on public.commercial_contracts
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'finance.read'));
create policy finance_contracts_manage on public.commercial_contracts
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'finance.manage'))
  with check (public.has_tenant_permission(tenant_id, 'finance.manage'));
create policy finance_price_tables_read on public.commercial_price_tables
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'finance.read'));
create policy finance_price_tables_manage on public.commercial_price_tables
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'finance.manage'))
  with check (public.has_tenant_permission(tenant_id, 'finance.manage'));
create policy finance_price_items_read on public.commercial_price_items
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'finance.read'));
create policy finance_price_items_manage on public.commercial_price_items
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'finance.manage'))
  with check (public.has_tenant_permission(tenant_id, 'finance.manage'));
create policy finance_generic_read_snapshots on public.encounter_price_snapshots
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'finance.read'));
create policy finance_generic_manage_snapshots on public.encounter_price_snapshots
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'finance.manage') and created_by = auth.uid());

create policy finance_quotes_read on public.quotes
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'finance.read'));
create policy finance_quotes_manage on public.quotes
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'finance.manage'))
  with check (public.has_tenant_permission(tenant_id, 'finance.manage') and created_by = auth.uid());
create policy finance_quote_items_read on public.quote_items
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'finance.read'));
create policy finance_quote_items_manage on public.quote_items
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'finance.manage'))
  with check (public.has_tenant_permission(tenant_id, 'finance.manage'));

create policy finance_billing_read on public.billing_items
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'finance.read'));
create policy finance_billing_manage on public.billing_items
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'finance.manage'))
  with check (public.has_tenant_permission(tenant_id, 'finance.manage'));
create policy finance_invoices_read on public.invoices
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'finance.read'));
create policy finance_invoices_manage on public.invoices
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'finance.manage'))
  with check (public.has_tenant_permission(tenant_id, 'finance.manage') and created_by = auth.uid());
create policy finance_invoice_items_read on public.invoice_items
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'finance.read'));
create policy finance_invoice_items_manage on public.invoice_items
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'finance.manage'))
  with check (public.has_tenant_permission(tenant_id, 'finance.manage'));
create policy finance_payments_read on public.payments
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'finance.read'));
create policy finance_payments_manage on public.payments
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'finance.manage'))
  with check (public.has_tenant_permission(tenant_id, 'finance.manage') and created_by = auth.uid());
create policy finance_adjustments_read on public.billing_adjustments
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'finance.read'));
create policy finance_adjustments_insert on public.billing_adjustments
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'finance.manage') and created_by = auth.uid());
create policy finance_denials_read on public.billing_denials
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'finance.read'));
create policy finance_denials_manage on public.billing_denials
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'finance.manage'))
  with check (public.has_tenant_permission(tenant_id, 'finance.manage') and created_by = auth.uid());

create policy portal_users_manage on public.company_portal_users
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'company_portal.manage'))
  with check (public.has_tenant_permission(tenant_id, 'company_portal.manage'));
create policy portal_release_rules_manage on public.company_document_release_rules
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'company_portal.manage'))
  with check (public.has_tenant_permission(tenant_id, 'company_portal.manage'));
create policy internal_notifications_read on public.internal_notifications
  for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'company_portal.read') or target_user_id = auth.uid());
create policy internal_notifications_manage on public.internal_notifications
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'company_portal.manage'))
  with check (public.has_tenant_permission(tenant_id, 'company_portal.manage'));

grant execute on function public.create_encounter_price_snapshot(uuid, uuid, uuid, uuid, jsonb, text, text) to authenticated;
grant execute on function public.issue_invoice(uuid, uuid, uuid[], date, text) to authenticated;

commit;
