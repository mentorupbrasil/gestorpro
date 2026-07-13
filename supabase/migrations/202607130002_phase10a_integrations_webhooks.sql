begin;

insert into public.permissions (code, description)
values
  ('integrations.read', 'Visualizar integrações e entregas'),
  ('integrations.manage', 'Gerenciar integrações, webhooks e reprocessamentos')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in ('integrations.read', 'integrations.manage')
on conflict do nothing;

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  provider text not null,
  connection_type text not null check (
    connection_type in ('webhook', 'api', 'file_exchange', 'device_connector', 'message_provider')
  ),
  display_name text not null,
  status text not null default 'draft' check ('draft' = status or status in ('active', 'paused', 'revoked', 'error')),
  config_redacted jsonb not null default '{}'::jsonb,
  credential_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integration_webhooks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  connection_id uuid not null references public.integration_connections(id) on delete restrict,
  event_type text not null,
  target_url text not null,
  signing_secret_reference text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'revoked')),
  created_at timestamptz not null default now(),
  constraint integration_webhooks_event_url_uq unique (tenant_id, connection_id, event_type, target_url)
);

create table public.integration_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  connection_id uuid references public.integration_connections(id) on delete restrict,
  job_type text not null,
  idempotency_key text not null,
  payload_redacted jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (
    status in ('queued', 'processing', 'succeeded', 'retrying', 'failed', 'dead_letter', 'cancelled')
  ),
  attempts int not null default 0 check (attempts >= 0),
  max_attempts int not null default 8 check (max_attempts > 0),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error_redacted text,
  created_by uuid references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint integration_jobs_idempotency_uq unique (tenant_id, job_type, idempotency_key)
);

create table public.integration_deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  job_id uuid not null references public.integration_jobs(id) on delete restrict,
  webhook_id uuid references public.integration_webhooks(id) on delete restrict,
  destination text not null,
  signature_header text,
  status text not null default 'pending' check (
    status in ('pending', 'sent', 'retrying', 'failed', 'dead_letter', 'cancelled')
  ),
  attempts int not null default 0,
  next_attempt_at timestamptz,
  response_status int,
  response_redacted text,
  created_at timestamptz not null default now()
);

create table public.integration_dead_letters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  job_id uuid references public.integration_jobs(id) on delete restrict,
  delivery_id uuid references public.integration_deliveries(id) on delete restrict,
  reason_redacted text not null,
  payload_redacted jsonb not null default '{}'::jsonb,
  reprocessed_at timestamptz,
  reprocessed_by uuid references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  connection_id uuid references public.integration_connections(id) on delete restrict,
  job_id uuid references public.integration_jobs(id) on delete restrict,
  level text not null check (level in ('info', 'warn', 'error')),
  message text not null,
  metadata_redacted jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.enqueue_integration_job(
  target_tenant_id uuid,
  target_connection_id uuid,
  job_type_value text,
  idempotency_key_value text,
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
  job_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'integrations.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  insert into public.integration_jobs (
    tenant_id,
    connection_id,
    job_type,
    idempotency_key,
    payload_redacted,
    created_by
  )
  values (
    target_tenant_id,
    target_connection_id,
    job_type_value,
    idempotency_key_value,
    coalesce(payload_redacted_value, '{}'::jsonb),
    auth.uid()
  )
  on conflict (tenant_id, job_type, idempotency_key) do update
    set payload_redacted = excluded.payload_redacted
  returning id into job_id;

  perform public.log_audit(
    target_tenant_id,
    'integration.job.enqueued',
    'integration_jobs',
    job_id,
    audit_request_id,
    jsonb_build_object('jobType', job_type_value)
  );

  return job_id;
end;
$$;

create or replace function public.mark_integration_attempt(
  target_tenant_id uuid,
  target_job_id uuid,
  succeeded boolean,
  error_redacted text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  job_record record;
  new_status text;
begin
  if not public.has_tenant_permission(target_tenant_id, 'integrations.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select *
    into job_record
  from public.integration_jobs
  where id = target_job_id
    and tenant_id = target_tenant_id
  for update;

  if job_record.id is null then
    raise exception 'integration job not found' using errcode = 'P0002';
  end if;

  if succeeded then
    new_status := 'succeeded';
  elsif job_record.attempts + 1 >= job_record.max_attempts then
    new_status := 'dead_letter';
  else
    new_status := 'retrying';
  end if;

  update public.integration_jobs
    set attempts = attempts + 1,
        status = new_status,
        last_error_redacted = nullif(trim(error_redacted), ''),
        next_attempt_at = case
          when new_status = 'retrying' then now() + ((power(2, least(attempts + 1, 8))::int || ' minutes')::interval)
          else next_attempt_at
        end
  where id = target_job_id
    and tenant_id = target_tenant_id;

  if new_status = 'dead_letter' then
    insert into public.integration_dead_letters (tenant_id, job_id, reason_redacted, payload_redacted)
    values (target_tenant_id, target_job_id, coalesce(error_redacted, 'max attempts reached'), job_record.payload_redacted);
  end if;

  perform public.log_audit(
    target_tenant_id,
    'integration.job.attempt',
    'integration_jobs',
    target_job_id,
    audit_request_id,
    jsonb_build_object('status', new_status)
  );

  return target_job_id;
end;
$$;

alter table public.integration_connections enable row level security;
alter table public.integration_webhooks enable row level security;
alter table public.integration_jobs enable row level security;
alter table public.integration_deliveries enable row level security;
alter table public.integration_dead_letters enable row level security;
alter table public.integration_logs enable row level security;

create policy integration_connections_read on public.integration_connections
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'integrations.read'));
create policy integration_connections_manage on public.integration_connections
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'integrations.manage'))
  with check (public.has_tenant_permission(tenant_id, 'integrations.manage'));
create policy integration_webhooks_read on public.integration_webhooks
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'integrations.read'));
create policy integration_webhooks_manage on public.integration_webhooks
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'integrations.manage'))
  with check (public.has_tenant_permission(tenant_id, 'integrations.manage'));
create policy integration_jobs_read on public.integration_jobs
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'integrations.read'));
create policy integration_jobs_manage on public.integration_jobs
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'integrations.manage'))
  with check (public.has_tenant_permission(tenant_id, 'integrations.manage'));
create policy integration_deliveries_read on public.integration_deliveries
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'integrations.read'));
create policy integration_deliveries_manage on public.integration_deliveries
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'integrations.manage'))
  with check (public.has_tenant_permission(tenant_id, 'integrations.manage'));
create policy integration_dead_letters_read on public.integration_dead_letters
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'integrations.read'));
create policy integration_dead_letters_manage on public.integration_dead_letters
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'integrations.manage'))
  with check (public.has_tenant_permission(tenant_id, 'integrations.manage'));
create policy integration_logs_read on public.integration_logs
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'integrations.read'));
create policy integration_logs_insert on public.integration_logs
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'integrations.manage'));

grant execute on function public.enqueue_integration_job(uuid, uuid, text, text, jsonb, text) to authenticated;
grant execute on function public.mark_integration_attempt(uuid, uuid, boolean, text, text) to authenticated;

commit;
