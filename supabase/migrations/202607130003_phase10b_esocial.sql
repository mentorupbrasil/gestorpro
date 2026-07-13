begin;

insert into public.permissions (code, description)
values
  ('esocial.read', 'Visualizar eventos e lotes eSocial'),
  ('esocial.manage', 'Gerenciar eventos, lotes e retificações eSocial')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in ('esocial.read', 'esocial.manage')
on conflict do nothing;

create table public.esocial_layout_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  version text not null,
  technical_note text not null,
  revision_date date not null,
  xsd_production_date date not null,
  manual_reference text not null,
  source_url text not null,
  consulted_at date not null,
  status text not null default 'active' check (status in ('active', 'retired')),
  created_at timestamptz not null default now(),
  constraint esocial_layout_versions_uq unique (tenant_id, version, technical_note)
);

create table public.esocial_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  layout_version_id uuid not null references public.esocial_layout_versions(id) on delete restrict,
  environment text not null check (environment in ('restricted_production', 'production')),
  event_type text not null,
  operation_type text not null default 'original' check (
    operation_type in ('original', 'correction', 'rectification', 'exclusion')
  ),
  business_key text not null,
  idempotency_key text not null,
  payload_version int not null default 1 check (payload_version > 0),
  payload jsonb not null,
  payload_hash text not null,
  status text not null default 'draft' check (
    status in ('draft', 'validated', 'batched', 'sent', 'accepted', 'rejected', 'corrected', 'rectified', 'cancelled')
  ),
  previous_event_id uuid references public.esocial_events(id) on delete restrict,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint esocial_events_idempotency_uq unique (tenant_id, event_type, idempotency_key),
  constraint esocial_events_business_version_uq unique (
    tenant_id,
    event_type,
    business_key,
    payload_version
  )
);

create table public.esocial_event_validations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  event_id uuid not null references public.esocial_events(id) on delete restrict,
  severity text not null check (severity in ('info', 'warning', 'error')),
  code text not null,
  message text not null,
  field_path text,
  created_at timestamptz not null default now()
);

create table public.esocial_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  layout_version_id uuid not null references public.esocial_layout_versions(id) on delete restrict,
  environment text not null check (environment in ('restricted_production', 'production')),
  idempotency_key text not null,
  status text not null default 'open' check (
    status in ('open', 'sealed', 'queued', 'sent', 'processed', 'partially_rejected', 'rejected', 'failed')
  ),
  protocol_number text,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint esocial_batches_idempotency_uq unique (tenant_id, environment, idempotency_key)
);

create table public.esocial_batch_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  batch_id uuid not null references public.esocial_batches(id) on delete restrict,
  event_id uuid not null references public.esocial_events(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint esocial_batch_events_event_uq unique (tenant_id, event_id)
);

create table public.esocial_submissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  batch_id uuid not null references public.esocial_batches(id) on delete restrict,
  integration_job_id uuid references public.integration_jobs(id) on delete restrict,
  status text not null default 'queued' check (
    status in ('queued', 'sent', 'received', 'failed', 'cancelled')
  ),
  request_payload_hash text not null,
  response_payload_redacted jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.esocial_receipts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  event_id uuid not null references public.esocial_events(id) on delete restrict,
  submission_id uuid references public.esocial_submissions(id) on delete restrict,
  receipt_number text not null,
  received_at timestamptz not null,
  payload_redacted jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint esocial_receipts_event_uq unique (tenant_id, event_id)
);

create table public.esocial_rejections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  event_id uuid not null references public.esocial_events(id) on delete restrict,
  submission_id uuid references public.esocial_submissions(id) on delete restrict,
  code text not null,
  message text not null,
  payload_redacted jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'corrected', 'ignored')),
  created_at timestamptz not null default now()
);

create or replace function public.create_esocial_event(
  target_tenant_id uuid,
  layout_version_id_value uuid,
  environment_value text,
  event_type_value text,
  operation_type_value text,
  business_key_value text,
  idempotency_key_value text,
  payload_value jsonb,
  payload_hash_value text,
  previous_event_id_value uuid,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  event_id uuid;
  next_version int;
begin
  if not public.has_tenant_permission(target_tenant_id, 'esocial.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if environment_value = 'production' then
    raise exception 'production eSocial send is not authorized in this phase' using errcode = '42501';
  end if;

  select coalesce(max(payload_version), 0) + 1
    into next_version
  from public.esocial_events
  where tenant_id = target_tenant_id
    and event_type = event_type_value
    and business_key = business_key_value;

  insert into public.esocial_events (
    tenant_id,
    layout_version_id,
    environment,
    event_type,
    operation_type,
    business_key,
    idempotency_key,
    payload_version,
    payload,
    payload_hash,
    previous_event_id,
    created_by
  )
  values (
    target_tenant_id,
    layout_version_id_value,
    environment_value,
    event_type_value,
    operation_type_value,
    business_key_value,
    idempotency_key_value,
    next_version,
    payload_value,
    payload_hash_value,
    previous_event_id_value,
    auth.uid()
  )
  on conflict (tenant_id, event_type, idempotency_key) do update
    set payload = excluded.payload
  returning id into event_id;

  perform public.log_audit(
    target_tenant_id,
    'esocial.event.created',
    'esocial_events',
    event_id,
    audit_request_id,
    jsonb_build_object('eventType', event_type_value, 'environment', environment_value)
  );

  return event_id;
end;
$$;

create or replace function public.record_esocial_rejection(
  target_tenant_id uuid,
  target_event_id uuid,
  target_submission_id uuid,
  code_value text,
  message_value text,
  payload_redacted_value jsonb,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  rejection_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'esocial.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  insert into public.esocial_rejections (
    tenant_id,
    event_id,
    submission_id,
    code,
    message,
    payload_redacted
  )
  values (
    target_tenant_id,
    target_event_id,
    target_submission_id,
    code_value,
    message_value,
    coalesce(payload_redacted_value, '{}'::jsonb)
  )
  returning id into rejection_id;

  update public.esocial_events
    set status = 'rejected'
  where id = target_event_id
    and tenant_id = target_tenant_id;

  perform public.log_audit(
    target_tenant_id,
    'esocial.event.rejected',
    'esocial_events',
    target_event_id,
    audit_request_id,
    jsonb_build_object('code', code_value)
  );

  return rejection_id;
end;
$$;

alter table public.esocial_layout_versions enable row level security;
alter table public.esocial_events enable row level security;
alter table public.esocial_event_validations enable row level security;
alter table public.esocial_batches enable row level security;
alter table public.esocial_batch_events enable row level security;
alter table public.esocial_submissions enable row level security;
alter table public.esocial_receipts enable row level security;
alter table public.esocial_rejections enable row level security;

create policy esocial_layout_read on public.esocial_layout_versions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'esocial.read'));
create policy esocial_layout_manage on public.esocial_layout_versions
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'esocial.manage'))
  with check (public.has_tenant_permission(tenant_id, 'esocial.manage'));
create policy esocial_events_read on public.esocial_events
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'esocial.read'));
create policy esocial_events_manage on public.esocial_events
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'esocial.manage'))
  with check (public.has_tenant_permission(tenant_id, 'esocial.manage') and created_by = auth.uid());
create policy esocial_validations_read on public.esocial_event_validations
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'esocial.read'));
create policy esocial_validations_manage on public.esocial_event_validations
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'esocial.manage'))
  with check (public.has_tenant_permission(tenant_id, 'esocial.manage'));
create policy esocial_batches_read on public.esocial_batches
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'esocial.read'));
create policy esocial_batches_manage on public.esocial_batches
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'esocial.manage'))
  with check (public.has_tenant_permission(tenant_id, 'esocial.manage') and created_by = auth.uid());
create policy esocial_batch_events_read on public.esocial_batch_events
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'esocial.read'));
create policy esocial_batch_events_manage on public.esocial_batch_events
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'esocial.manage'))
  with check (public.has_tenant_permission(tenant_id, 'esocial.manage'));
create policy esocial_submissions_read on public.esocial_submissions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'esocial.read'));
create policy esocial_submissions_manage on public.esocial_submissions
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'esocial.manage'))
  with check (public.has_tenant_permission(tenant_id, 'esocial.manage'));
create policy esocial_receipts_read on public.esocial_receipts
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'esocial.read'));
create policy esocial_receipts_manage on public.esocial_receipts
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'esocial.manage'))
  with check (public.has_tenant_permission(tenant_id, 'esocial.manage'));
create policy esocial_rejections_read on public.esocial_rejections
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'esocial.read'));
create policy esocial_rejections_manage on public.esocial_rejections
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'esocial.manage'))
  with check (public.has_tenant_permission(tenant_id, 'esocial.manage'));

grant execute on function public.create_esocial_event(uuid, uuid, text, text, text, text, text, jsonb, text, uuid, text) to authenticated;
grant execute on function public.record_esocial_rejection(uuid, uuid, uuid, text, text, jsonb, text) to authenticated;

commit;
