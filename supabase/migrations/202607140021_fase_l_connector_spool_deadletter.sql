-- Fase L checkpoint: spool do conector + dead-letter requeue + AAL2 nas RPCs chave.
-- Sem transmissão eSocial real / produção.

create table if not exists public.connector_spool_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  connector_id uuid not null references public.local_connectors(id) on delete restrict,
  monitored_folder text not null,
  file_name text not null,
  content_hash text not null,
  status text not null default 'detected' check (
    status in ('detected', 'queued', 'processing', 'processed', 'failed', 'ignored')
  ),
  payload_redacted jsonb not null default '{}'::jsonb,
  integration_job_id uuid references public.integration_jobs(id) on delete restrict,
  detected_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint connector_spool_entries_file_uq unique (tenant_id, connector_id, content_hash)
);

alter table public.connector_spool_entries enable row level security;

drop policy if exists connector_spool_read on public.connector_spool_entries;
create policy connector_spool_read on public.connector_spool_entries
  for select to authenticated
  using (
    public.has_tenant_permission(tenant_id, 'equipment.read')
    or public.has_tenant_permission(tenant_id, 'integrations.read')
  );

drop policy if exists connector_spool_manage on public.connector_spool_entries;
create policy connector_spool_manage on public.connector_spool_entries
  for all to authenticated
  using (
    public.has_tenant_permission(tenant_id, 'equipment.manage')
    or public.has_tenant_permission(tenant_id, 'integrations.manage')
  )
  with check (
    public.has_tenant_permission(tenant_id, 'equipment.manage')
    or public.has_tenant_permission(tenant_id, 'integrations.manage')
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
  credential_ref text;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'integrations.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if char_length(trim(idempotency_key_value)) < 8 then
    raise exception 'idempotency key required' using errcode = '22023';
  end if;

  select connection.credential_reference into credential_ref
  from public.integration_connections connection
  where connection.id = target_connection_id
    and connection.tenant_id = target_tenant_id;

  if credential_ref is not null
     and credential_ref !~* '^(vault://|sandbox://)' then
    raise exception 'credential_reference must use vault:// or sandbox://' using errcode = '22023';
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
    trim(idempotency_key_value),
    coalesce(payload_redacted_value, '{}'::jsonb),
    auth.uid()
  )
  on conflict (tenant_id, job_type, idempotency_key) do update
    set payload_redacted = excluded.payload_redacted
  returning id into job_id;

  perform public.append_audit_log(
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
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'esocial.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if environment_value = 'production' then
    raise exception 'production eSocial send is not authorized in this phase' using errcode = '42501';
  end if;

  if environment_value not in ('restricted_production', 'production') then
    raise exception 'invalid eSocial environment' using errcode = '22023';
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

  perform public.append_audit_log(
    target_tenant_id,
    'esocial.event.created',
    'esocial_events',
    event_id,
    audit_request_id,
    jsonb_build_object(
      'eventType', event_type_value,
      'environment', environment_value,
      'sandboxOnly', true
    )
  );

  return event_id;
end;
$$;

create or replace function public.register_connector_spool_file(
  target_tenant_id uuid,
  target_connector_id uuid,
  monitored_folder_value text,
  file_name_value text,
  content_hash_value text,
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
  spool_id uuid;
  job_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not (
    public.has_tenant_permission(target_tenant_id, 'equipment.manage')
    or public.has_tenant_permission(target_tenant_id, 'integrations.manage')
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if nullif(trim(monitored_folder_value), '') is null
     or nullif(trim(file_name_value), '') is null
     or char_length(trim(content_hash_value)) < 16 then
    raise exception 'spool file metadata required' using errcode = '22023';
  end if;

  if file_name_value ~* '(password|secret|token|diagn|result|cpf)' then
    raise exception 'file name reveals sensitive content' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.local_connectors connector
    where connector.id = target_connector_id
      and connector.tenant_id = target_tenant_id
      and connector.status in ('active', 'pending')
  ) then
    raise exception 'connector unavailable' using errcode = 'P0002';
  end if;

  insert into public.connector_spool_entries (
    tenant_id,
    connector_id,
    monitored_folder,
    file_name,
    content_hash,
    payload_redacted,
    status
  )
  values (
    target_tenant_id,
    target_connector_id,
    trim(monitored_folder_value),
    trim(file_name_value),
    trim(content_hash_value),
    coalesce(payload_redacted_value, '{}'::jsonb),
    'detected'
  )
  on conflict (tenant_id, connector_id, content_hash) do update
    set file_name = excluded.file_name,
        monitored_folder = excluded.monitored_folder
  returning id into spool_id;

  insert into public.integration_jobs (
    tenant_id,
    job_type,
    idempotency_key,
    payload_redacted,
    created_by,
    status
  )
  values (
    target_tenant_id,
    'connector_spool',
    'spool:' || spool_id::text,
    jsonb_build_object(
      'spoolId', spool_id,
      'connectorId', target_connector_id,
      'fileName', trim(file_name_value)
    ),
    auth.uid(),
    'queued'
  )
  on conflict (tenant_id, job_type, idempotency_key) do update
    set status = 'queued'
  returning id into job_id;

  update public.connector_spool_entries
  set status = 'queued',
      integration_job_id = job_id
  where id = spool_id
    and tenant_id = target_tenant_id;

  update public.local_connectors
  set last_seen_at = now()
  where id = target_connector_id
    and tenant_id = target_tenant_id;

  perform public.append_audit_log(
    target_tenant_id,
    'connector.spool.registered',
    'connector_spool_entries',
    spool_id,
    audit_request_id,
    jsonb_build_object('jobId', job_id)
  );

  return spool_id;
end;
$$;

create or replace function public.requeue_integration_dead_letter(
  target_tenant_id uuid,
  target_dead_letter_id uuid,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  dead_letter_record record;
  job_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'integrations.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select *
    into dead_letter_record
  from public.integration_dead_letters dead_letter
  where dead_letter.id = target_dead_letter_id
    and dead_letter.tenant_id = target_tenant_id
  for update;

  if dead_letter_record.id is null then
    raise exception 'dead letter not found' using errcode = 'P0002';
  end if;

  if dead_letter_record.reprocessed_at is not null then
    raise exception 'dead letter already reprocessed' using errcode = '22023';
  end if;

  if dead_letter_record.job_id is null then
    raise exception 'dead letter missing job' using errcode = '22023';
  end if;

  update public.integration_jobs
  set status = 'queued',
      next_attempt_at = now(),
      last_error_redacted = null,
      locked_at = null,
      locked_by = null
  where id = dead_letter_record.job_id
    and tenant_id = target_tenant_id
  returning id into job_id;

  update public.integration_dead_letters
  set reprocessed_at = now(),
      reprocessed_by = auth.uid()
  where id = target_dead_letter_id
    and tenant_id = target_tenant_id;

  perform public.append_audit_log(
    target_tenant_id,
    'integration.dead_letter.requeued',
    'integration_dead_letters',
    target_dead_letter_id,
    audit_request_id,
    jsonb_build_object('jobId', job_id)
  );

  return job_id;
end;
$$;

revoke all on function public.enqueue_integration_job(uuid, uuid, text, text, jsonb, text) from public;
revoke all on function public.create_esocial_event(uuid, uuid, text, text, text, text, text, jsonb, text, uuid, text) from public;
revoke all on function public.register_connector_spool_file(uuid, uuid, text, text, text, jsonb, text) from public;
revoke all on function public.requeue_integration_dead_letter(uuid, uuid, text) from public;

grant execute on function public.enqueue_integration_job(uuid, uuid, text, text, jsonb, text) to authenticated;
grant execute on function public.create_esocial_event(uuid, uuid, text, text, text, text, text, jsonb, text, uuid, text) to authenticated;
grant execute on function public.register_connector_spool_file(uuid, uuid, text, text, text, jsonb, text) to authenticated;
grant execute on function public.requeue_integration_dead_letter(uuid, uuid, text) to authenticated;
