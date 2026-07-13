begin;

insert into public.permissions (code, description)
values
  ('occupational.read', 'Visualizar empresas, trabalhadores e estrutura ocupacional'),
  ('occupational.manage', 'Gerenciar empresas, trabalhadores e estrutura ocupacional'),
  ('protocols.read', 'Visualizar PCMSO, catálogo de exames e protocolos'),
  ('protocols.manage', 'Gerenciar PCMSO, catálogo de exames e protocolos'),
  ('pricing.read', 'Visualizar tabelas comerciais'),
  ('pricing.manage', 'Gerenciar tabelas comerciais')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in (
    'occupational.read',
    'occupational.manage',
    'protocols.read',
    'protocols.manage',
    'pricing.read',
    'pricing.manage'
  )
on conflict do nothing;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  legal_name text not null check (char_length(trim(legal_name)) between 2 and 180),
  trade_name text,
  tax_id_normalized text not null check (tax_id_normalized ~ '^[0-9]{14}$'),
  status text not null default 'active' check (status in ('active', 'inactive')),
  version int not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_tenant_tax_id_uq unique (tenant_id, tax_id_normalized)
);

create table public.company_establishments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null check (char_length(trim(name)) between 2 and 160),
  tax_id_normalized text check (tax_id_normalized is null or tax_id_normalized ~ '^[0-9]{14}$'),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_establishments_tenant_code_uq unique (tenant_id, company_id, code)
);

create table public.company_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 160),
  email text,
  phone text,
  role_name text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  establishment_id uuid references public.company_establishments(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null check (char_length(trim(name)) between 2 and 160),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sectors_tenant_company_code_uq unique (tenant_id, company_id, code)
);

create table public.job_positions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  sector_id uuid references public.sectors(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null check (char_length(trim(name)) between 2 and 160),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_positions_tenant_company_code_uq unique (tenant_id, company_id, code)
);

create table public.exposure_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null check (char_length(trim(name)) between 2 and 160),
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exposure_groups_tenant_company_code_uq unique (tenant_id, company_id, code)
);

create table public.occupational_risks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null check (char_length(trim(name)) between 2 and 160),
  risk_type text not null check (risk_type in ('physical', 'chemical', 'biological', 'ergonomic', 'accident')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint occupational_risks_tenant_code_uq unique (tenant_id, code)
);

create table public.risk_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  exposure_group_id uuid references public.exposure_groups(id) on delete restrict,
  job_position_id uuid references public.job_positions(id) on delete restrict,
  occupational_risk_id uuid not null references public.occupational_risks(id) on delete restrict,
  source text not null check (source in ('pcmso', 'manual')),
  starts_on date not null,
  ends_on date,
  version int not null default 1 check (version > 0),
  notes text,
  created_at timestamptz not null default now(),
  constraint risk_assignments_scope_ck check (exposure_group_id is not null or job_position_id is not null),
  constraint risk_assignments_period_ck check (ends_on is null or ends_on > starts_on)
);

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  full_name text not null check (char_length(trim(full_name)) between 2 and 180),
  cpf_ciphertext text,
  cpf_lookup_hash text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  version int not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index workers_tenant_cpf_hash_uq
  on public.workers (tenant_id, cpf_lookup_hash)
  where cpf_lookup_hash is not null;

create table public.worker_identifiers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  worker_id uuid not null references public.workers(id) on delete restrict,
  identifier_type text not null check (identifier_type in ('cpf', 'external_id', 'passport')),
  identifier_hash text not null,
  created_at timestamptz not null default now(),
  constraint worker_identifiers_tenant_type_hash_uq unique (tenant_id, identifier_type, identifier_hash)
);

create table public.employment_contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  worker_id uuid not null references public.workers(id) on delete restrict,
  sector_id uuid references public.sectors(id) on delete restrict,
  job_position_id uuid references public.job_positions(id) on delete restrict,
  exposure_group_id uuid references public.exposure_groups(id) on delete restrict,
  starts_on date not null,
  ends_on date,
  status text not null default 'active' check (status in ('active', 'inactive', 'ended')),
  version int not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employment_contracts_period_ck check (ends_on is null or ends_on > starts_on)
);

create index employment_contracts_worker_idx
  on public.employment_contracts (tenant_id, worker_id, starts_on desc);

create table public.employment_contract_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  employment_contract_id uuid not null references public.employment_contracts(id) on delete restrict,
  event_type text not null check (event_type in ('created', 'changed', 'ended')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.pcmso_programs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null check (char_length(trim(name)) between 2 and 180),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pcmso_programs_tenant_company_code_uq unique (tenant_id, company_id, code)
);

create table public.pcmso_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  pcmso_program_id uuid not null references public.pcmso_programs(id) on delete restrict,
  version_number int not null check (version_number > 0),
  valid_from date not null,
  valid_until date,
  status text not null default 'draft' check (status in ('draft', 'approved', 'expired')),
  approved_at timestamptz,
  content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pcmso_versions_tenant_program_version_uq unique (tenant_id, pcmso_program_id, version_number),
  constraint pcmso_versions_period_ck check (valid_until is null or valid_until > valid_from),
  constraint pcmso_versions_approval_ck check ((status = 'approved') = (approved_at is not null))
);

create table public.exam_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_.-]{1,63}$'),
  name text not null check (char_length(trim(name)) between 2 and 180),
  result_type text not null check (result_type in ('clinical', 'laboratory', 'imaging', 'audiometry', 'spirometry', 'other')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_catalog_tenant_code_uq unique (tenant_id, code)
);

create table public.exam_protocols (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  pcmso_version_id uuid not null references public.pcmso_versions(id) on delete restrict,
  occupational_exam_type text not null check (occupational_exam_type in ('admission', 'periodic', 'dismissal', 'return_to_work', 'change_of_risk')),
  rule_version int not null default 1 check (rule_version > 0),
  status text not null default 'draft' check (status in ('draft', 'approved', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index exam_protocols_approved_type_uq
  on public.exam_protocols (tenant_id, pcmso_version_id, occupational_exam_type)
  where status = 'approved';

create table public.exam_protocol_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  exam_protocol_id uuid not null references public.exam_protocols(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 160),
  priority int not null default 100,
  conditions jsonb not null default '{}'::jsonb,
  conflict_policy text not null default 'block' check (conflict_policy in ('block', 'manual_review')),
  created_at timestamptz not null default now()
);

create table public.exam_protocol_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  exam_protocol_id uuid not null references public.exam_protocols(id) on delete restrict,
  exam_catalog_id uuid not null references public.exam_catalog(id) on delete restrict,
  required boolean not null default true,
  conditions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint exam_protocol_items_protocol_exam_uq unique (tenant_id, exam_protocol_id, exam_catalog_id)
);

create table public.exam_protocol_overrides (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  employment_contract_id uuid references public.employment_contracts(id) on delete restrict,
  worker_id uuid references public.workers(id) on delete restrict,
  exam_protocol_id uuid references public.exam_protocols(id) on delete restrict,
  exam_catalog_id uuid not null references public.exam_catalog(id) on delete restrict,
  action text not null check (action in ('add', 'remove')),
  justification text not null check (char_length(trim(justification)) between 10 and 500),
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  request_id text not null check (char_length(request_id) between 1 and 128),
  created_at timestamptz not null default now(),
  constraint exam_protocol_overrides_scope_ck check (employment_contract_id is not null or worker_id is not null)
);

create table public.price_lists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid references public.companies(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null check (char_length(trim(name)) between 2 and 180),
  valid_from date not null,
  valid_until date,
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_lists_tenant_code_uq unique (tenant_id, code),
  constraint price_lists_period_ck check (valid_until is null or valid_until > valid_from)
);

create table public.price_list_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  price_list_id uuid not null references public.price_lists(id) on delete restrict,
  exam_catalog_id uuid not null references public.exam_catalog(id) on delete restrict,
  price_cents int not null check (price_cents >= 0),
  created_at timestamptz not null default now(),
  constraint price_list_items_price_exam_uq unique (tenant_id, price_list_id, exam_catalog_id)
);

create or replace function public.reject_approved_pcmso_version_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'approved' then
    raise exception 'approved PCMSO versions are immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger pcmso_versions_approved_immutable
before update or delete on public.pcmso_versions
for each row execute function public.reject_approved_pcmso_version_mutation();

create or replace function public.create_occupational_company(
  target_tenant_id uuid,
  company_legal_name text,
  company_trade_name text,
  company_tax_id text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  normalized_tax_id text := regexp_replace(company_tax_id, '[^0-9]', '', 'g');
  new_company_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'occupational.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if normalized_tax_id !~ '^[0-9]{14}$' then
    raise exception 'invalid company tax id' using errcode = '22023';
  end if;

  insert into public.companies (tenant_id, legal_name, trade_name, tax_id_normalized)
  values (target_tenant_id, trim(company_legal_name), nullif(trim(company_trade_name), ''), normalized_tax_id)
  returning id into new_company_id;

  perform public.append_audit_log(
    target_tenant_id,
    'company.created',
    'company',
    new_company_id,
    audit_request_id,
    jsonb_build_object('taxIdLast4', right(normalized_tax_id, 4))
  );

  return new_company_id;
end;
$$;

create or replace function public.create_occupational_worker(
  target_tenant_id uuid,
  worker_full_name text,
  worker_cpf text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  normalized_cpf text := regexp_replace(worker_cpf, '[^0-9]', '', 'g');
  lookup_hash text;
  new_worker_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'occupational.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if normalized_cpf !~ '^[0-9]{11}$' then
    raise exception 'invalid worker cpf' using errcode = '22023';
  end if;

  lookup_hash := encode(digest(target_tenant_id::text || ':' || normalized_cpf, 'sha256'), 'hex');

  insert into public.workers (tenant_id, full_name, cpf_lookup_hash)
  values (target_tenant_id, trim(worker_full_name), lookup_hash)
  returning id into new_worker_id;

  insert into public.worker_identifiers (tenant_id, worker_id, identifier_type, identifier_hash)
  values (target_tenant_id, new_worker_id, 'cpf', lookup_hash);

  perform public.append_audit_log(
    target_tenant_id,
    'worker.created',
    'worker',
    new_worker_id,
    audit_request_id,
    jsonb_build_object('identifierType', 'cpf')
  );

  return new_worker_id;
end;
$$;

create or replace function public.create_exam_protocol_override(
  target_tenant_id uuid,
  target_employment_contract_id uuid,
  target_worker_id uuid,
  target_exam_protocol_id uuid,
  target_exam_catalog_id uuid,
  override_action text,
  override_justification text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  new_override_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'protocols.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if override_action not in ('add', 'remove') then
    raise exception 'invalid override action' using errcode = '22023';
  end if;

  insert into public.exam_protocol_overrides (
    tenant_id,
    employment_contract_id,
    worker_id,
    exam_protocol_id,
    exam_catalog_id,
    action,
    justification,
    created_by,
    request_id
  )
  values (
    target_tenant_id,
    target_employment_contract_id,
    target_worker_id,
    target_exam_protocol_id,
    target_exam_catalog_id,
    override_action,
    trim(override_justification),
    auth.uid(),
    audit_request_id
  )
  returning id into new_override_id;

  perform public.append_audit_log(
    target_tenant_id,
    'exam_protocol.override_created',
    'exam_protocol_override',
    new_override_id,
    audit_request_id,
    jsonb_build_object('action', override_action)
  );

  return new_override_id;
end;
$$;

revoke all on function public.reject_approved_pcmso_version_mutation() from public;
revoke all on function public.create_occupational_company(uuid, text, text, text, text) from public;
revoke all on function public.create_occupational_worker(uuid, text, text, text) from public;
revoke all on function public.create_exam_protocol_override(uuid, uuid, uuid, uuid, uuid, text, text, text) from public;
grant execute on function public.create_occupational_company(uuid, text, text, text, text) to authenticated;
grant execute on function public.create_occupational_worker(uuid, text, text, text) to authenticated;
grant execute on function public.create_exam_protocol_override(uuid, uuid, uuid, uuid, uuid, text, text, text) to authenticated;

alter table public.companies enable row level security;
alter table public.company_establishments enable row level security;
alter table public.company_contacts enable row level security;
alter table public.sectors enable row level security;
alter table public.job_positions enable row level security;
alter table public.exposure_groups enable row level security;
alter table public.occupational_risks enable row level security;
alter table public.risk_assignments enable row level security;
alter table public.workers enable row level security;
alter table public.worker_identifiers enable row level security;
alter table public.employment_contracts enable row level security;
alter table public.employment_contract_history enable row level security;
alter table public.pcmso_programs enable row level security;
alter table public.pcmso_versions enable row level security;
alter table public.exam_catalog enable row level security;
alter table public.exam_protocols enable row level security;
alter table public.exam_protocol_rules enable row level security;
alter table public.exam_protocol_items enable row level security;
alter table public.exam_protocol_overrides enable row level security;
alter table public.price_lists enable row level security;
alter table public.price_list_items enable row level security;

create policy companies_select on public.companies for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.read'));
create policy companies_insert on public.companies for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));
create policy companies_update on public.companies for update to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.manage'))
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));

create policy company_establishments_select on public.company_establishments for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.read'));
create policy company_establishments_insert on public.company_establishments for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));
create policy company_establishments_update on public.company_establishments for update to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.manage'))
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));

create policy company_contacts_select on public.company_contacts for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.read'));
create policy company_contacts_insert on public.company_contacts for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));
create policy company_contacts_update on public.company_contacts for update to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.manage'))
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));

create policy sectors_select on public.sectors for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.read'));
create policy sectors_write on public.sectors for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.manage'))
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));

create policy job_positions_select on public.job_positions for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.read'));
create policy job_positions_write on public.job_positions for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.manage'))
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));

create policy exposure_groups_select on public.exposure_groups for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.read'));
create policy exposure_groups_write on public.exposure_groups for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.manage'))
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));

create policy occupational_risks_select on public.occupational_risks for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.read'));
create policy occupational_risks_write on public.occupational_risks for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.manage'))
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));

create policy risk_assignments_select on public.risk_assignments for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.read'));
create policy risk_assignments_insert on public.risk_assignments for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));
create policy risk_assignments_update on public.risk_assignments for update to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.manage'))
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));

create policy workers_select on public.workers for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.read'));
create policy workers_insert on public.workers for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));
create policy workers_update on public.workers for update to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.manage'))
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));

create policy worker_identifiers_select on public.worker_identifiers for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.read'));
create policy worker_identifiers_insert on public.worker_identifiers for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));

create policy employment_contracts_select on public.employment_contracts for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.read'));
create policy employment_contracts_insert on public.employment_contracts for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));
create policy employment_contracts_update on public.employment_contracts for update to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.manage'))
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));

create policy employment_contract_history_select on public.employment_contract_history for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'occupational.read'));
create policy employment_contract_history_insert on public.employment_contract_history for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'occupational.manage'));

create policy pcmso_programs_select on public.pcmso_programs for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.read'));
create policy pcmso_programs_write on public.pcmso_programs for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.manage'))
  with check (public.has_tenant_permission(tenant_id, 'protocols.manage'));

create policy pcmso_versions_select on public.pcmso_versions for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.read'));
create policy pcmso_versions_write on public.pcmso_versions for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.manage'))
  with check (public.has_tenant_permission(tenant_id, 'protocols.manage'));

create policy exam_catalog_select on public.exam_catalog for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.read'));
create policy exam_catalog_write on public.exam_catalog for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.manage'))
  with check (public.has_tenant_permission(tenant_id, 'protocols.manage'));

create policy exam_protocols_select on public.exam_protocols for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.read'));
create policy exam_protocols_write on public.exam_protocols for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.manage'))
  with check (public.has_tenant_permission(tenant_id, 'protocols.manage'));

create policy exam_protocol_rules_select on public.exam_protocol_rules for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.read'));
create policy exam_protocol_rules_write on public.exam_protocol_rules for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.manage'))
  with check (public.has_tenant_permission(tenant_id, 'protocols.manage'));

create policy exam_protocol_items_select on public.exam_protocol_items for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.read'));
create policy exam_protocol_items_write on public.exam_protocol_items for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.manage'))
  with check (public.has_tenant_permission(tenant_id, 'protocols.manage'));

create policy exam_protocol_overrides_select on public.exam_protocol_overrides for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'protocols.read'));
create policy exam_protocol_overrides_insert on public.exam_protocol_overrides for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'protocols.manage') and created_by = auth.uid());

create policy price_lists_select on public.price_lists for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'pricing.read'));
create policy price_lists_write on public.price_lists for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'pricing.manage'))
  with check (public.has_tenant_permission(tenant_id, 'pricing.manage'));

create policy price_list_items_select on public.price_list_items for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'pricing.read'));
create policy price_list_items_write on public.price_list_items for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'pricing.manage'))
  with check (public.has_tenant_permission(tenant_id, 'pricing.manage'));

commit;
