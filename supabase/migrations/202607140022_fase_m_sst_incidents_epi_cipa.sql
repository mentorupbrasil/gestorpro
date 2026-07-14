-- Fase M checkpoint: scaffold SST operacional (incidentes, EPI, CIPA).
-- Registro operacional apenas — não substitui CAT/PPP/LTCAT/PGR legais.

insert into public.permissions (code, description)
values
  ('sst.read', 'Visualizar registros SST operacionais'),
  ('sst.manage', 'Gerenciar registros SST operacionais')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in ('sst.read', 'sst.manage')
on conflict do nothing;

create table if not exists public.sst_incidents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  worker_id uuid references public.workers(id) on delete restrict,
  incident_type text not null check (
    incident_type in ('near_miss', 'injury', 'illness', 'property', 'other')
  ),
  occurred_at timestamptz not null,
  description_redacted text not null,
  status text not null default 'open' check (
    status in ('open', 'investigating', 'closed', 'cancelled')
  ),
  severity text not null default 'low' check (
    severity in ('low', 'medium', 'high', 'critical')
  ),
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sst_epi_issues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  worker_id uuid not null references public.workers(id) on delete restrict,
  epi_code text not null,
  epi_name text not null,
  issued_at date not null,
  due_return_on date,
  status text not null default 'issued' check (
    status in ('issued', 'returned', 'lost', 'replaced', 'cancelled')
  ),
  note_redacted text,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.sst_cipa_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  worker_id uuid not null references public.workers(id) on delete restrict,
  role_label text not null,
  mandate_starts_on date not null,
  mandate_ends_on date,
  status text not null default 'active' check (
    status in ('active', 'ended', 'cancelled')
  ),
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint sst_cipa_memberships_period_ck check (
    mandate_ends_on is null or mandate_ends_on >= mandate_starts_on
  )
);

create index if not exists sst_incidents_company_idx
  on public.sst_incidents (tenant_id, company_id, occurred_at desc);
create index if not exists sst_epi_issues_worker_idx
  on public.sst_epi_issues (tenant_id, worker_id, issued_at desc);
create index if not exists sst_cipa_company_idx
  on public.sst_cipa_memberships (tenant_id, company_id, status);

alter table public.sst_incidents enable row level security;
alter table public.sst_epi_issues enable row level security;
alter table public.sst_cipa_memberships enable row level security;

drop policy if exists sst_incidents_read on public.sst_incidents;
create policy sst_incidents_read on public.sst_incidents
  for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'sst.read'));

drop policy if exists sst_incidents_manage on public.sst_incidents;
create policy sst_incidents_manage on public.sst_incidents
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'sst.manage'))
  with check (
    public.has_tenant_permission(tenant_id, 'sst.manage')
    and created_by = auth.uid()
  );

drop policy if exists sst_epi_read on public.sst_epi_issues;
create policy sst_epi_read on public.sst_epi_issues
  for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'sst.read'));

drop policy if exists sst_epi_manage on public.sst_epi_issues;
create policy sst_epi_manage on public.sst_epi_issues
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'sst.manage'))
  with check (
    public.has_tenant_permission(tenant_id, 'sst.manage')
    and created_by = auth.uid()
  );

drop policy if exists sst_cipa_read on public.sst_cipa_memberships;
create policy sst_cipa_read on public.sst_cipa_memberships
  for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'sst.read'));

drop policy if exists sst_cipa_manage on public.sst_cipa_memberships;
create policy sst_cipa_manage on public.sst_cipa_memberships
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'sst.manage'))
  with check (
    public.has_tenant_permission(tenant_id, 'sst.manage')
    and created_by = auth.uid()
  );

create or replace function public.create_sst_incident(
  target_tenant_id uuid,
  target_company_id uuid,
  target_worker_id uuid,
  incident_type_value text,
  occurred_at_value timestamptz,
  description_redacted_value text,
  severity_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  incident_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'sst.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if incident_type_value not in ('near_miss', 'injury', 'illness', 'property', 'other') then
    raise exception 'invalid incident type' using errcode = '22023';
  end if;

  if severity_value not in ('low', 'medium', 'high', 'critical') then
    raise exception 'invalid severity' using errcode = '22023';
  end if;

  if char_length(trim(description_redacted_value)) < 5 then
    raise exception 'description required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.companies company
    where company.id = target_company_id and company.tenant_id = target_tenant_id
  ) then
    raise exception 'company not found' using errcode = 'P0002';
  end if;

  if target_worker_id is not null and not exists (
    select 1 from public.workers worker
    where worker.id = target_worker_id and worker.tenant_id = target_tenant_id
  ) then
    raise exception 'worker not found' using errcode = 'P0002';
  end if;

  insert into public.sst_incidents (
    tenant_id,
    company_id,
    worker_id,
    incident_type,
    occurred_at,
    description_redacted,
    severity,
    created_by
  )
  values (
    target_tenant_id,
    target_company_id,
    target_worker_id,
    incident_type_value,
    coalesce(occurred_at_value, now()),
    trim(description_redacted_value),
    severity_value,
    auth.uid()
  )
  returning id into incident_id;

  perform public.append_audit_log(
    target_tenant_id,
    'sst.incident.created',
    'sst_incidents',
    incident_id,
    audit_request_id,
    jsonb_build_object(
      'companyId', target_company_id,
      'incidentType', incident_type_value,
      'legalClaim', false
    )
  );

  return incident_id;
end;
$$;

create or replace function public.create_sst_epi_issue(
  target_tenant_id uuid,
  target_company_id uuid,
  target_worker_id uuid,
  epi_code_value text,
  epi_name_value text,
  issued_at_value date,
  due_return_on_value date,
  note_redacted_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  issue_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'sst.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if nullif(trim(epi_code_value), '') is null or nullif(trim(epi_name_value), '') is null then
    raise exception 'epi code and name required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.companies company
    where company.id = target_company_id and company.tenant_id = target_tenant_id
  ) then
    raise exception 'company not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.workers worker
    where worker.id = target_worker_id and worker.tenant_id = target_tenant_id
  ) then
    raise exception 'worker not found' using errcode = 'P0002';
  end if;

  insert into public.sst_epi_issues (
    tenant_id,
    company_id,
    worker_id,
    epi_code,
    epi_name,
    issued_at,
    due_return_on,
    note_redacted,
    created_by
  )
  values (
    target_tenant_id,
    target_company_id,
    target_worker_id,
    upper(trim(epi_code_value)),
    trim(epi_name_value),
    coalesce(issued_at_value, current_date),
    due_return_on_value,
    nullif(trim(note_redacted_value), ''),
    auth.uid()
  )
  returning id into issue_id;

  perform public.append_audit_log(
    target_tenant_id,
    'sst.epi.issued',
    'sst_epi_issues',
    issue_id,
    audit_request_id,
    jsonb_build_object('workerId', target_worker_id, 'epiCode', upper(trim(epi_code_value)))
  );

  return issue_id;
end;
$$;

create or replace function public.create_sst_cipa_membership(
  target_tenant_id uuid,
  target_company_id uuid,
  target_worker_id uuid,
  role_label_value text,
  mandate_starts_on_value date,
  mandate_ends_on_value date,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  membership_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'sst.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if char_length(trim(role_label_value)) < 2 then
    raise exception 'role label required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.companies company
    where company.id = target_company_id and company.tenant_id = target_tenant_id
  ) then
    raise exception 'company not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.workers worker
    where worker.id = target_worker_id and worker.tenant_id = target_tenant_id
  ) then
    raise exception 'worker not found' using errcode = 'P0002';
  end if;

  insert into public.sst_cipa_memberships (
    tenant_id,
    company_id,
    worker_id,
    role_label,
    mandate_starts_on,
    mandate_ends_on,
    created_by
  )
  values (
    target_tenant_id,
    target_company_id,
    target_worker_id,
    trim(role_label_value),
    coalesce(mandate_starts_on_value, current_date),
    mandate_ends_on_value,
    auth.uid()
  )
  returning id into membership_id;

  perform public.append_audit_log(
    target_tenant_id,
    'sst.cipa.membership.created',
    'sst_cipa_memberships',
    membership_id,
    audit_request_id,
    jsonb_build_object('companyId', target_company_id, 'workerId', target_worker_id)
  );

  return membership_id;
end;
$$;

revoke all on function public.create_sst_incident(uuid, uuid, uuid, text, timestamptz, text, text, text) from public;
revoke all on function public.create_sst_epi_issue(uuid, uuid, uuid, text, text, date, date, text, text) from public;
revoke all on function public.create_sst_cipa_membership(uuid, uuid, uuid, text, date, date, text) from public;

grant execute on function public.create_sst_incident(uuid, uuid, uuid, text, timestamptz, text, text, text) to authenticated;
grant execute on function public.create_sst_epi_issue(uuid, uuid, uuid, text, text, date, date, text, text) to authenticated;
grant execute on function public.create_sst_cipa_membership(uuid, uuid, uuid, text, date, date, text) to authenticated;
