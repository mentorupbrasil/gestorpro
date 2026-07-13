begin;

insert into public.permissions (code, description)
values
  ('encounters.read', 'Visualizar atendimentos e filas'),
  ('encounters.manage', 'Gerenciar check-in e etapas'),
  ('queues.read', 'Visualizar filas'),
  ('queues.manage', 'Gerenciar filas')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in ('encounters.read', 'encounters.manage', 'queues.read', 'queues.manage')
on conflict do nothing;

create table public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  scope text not null,
  key text not null,
  request_hash text not null,
  response_reference jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint idempotency_keys_tenant_scope_key_uq unique (tenant_id, scope, key)
);

create table public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  payload_redacted jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts int not null default 0,
  next_attempt_at timestamptz,
  created_at timestamptz not null default now()
);

create index outbox_events_pending_idx
  on public.outbox_events (status, next_attempt_at);

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  clinic_unit_id uuid not null references public.clinic_units(id) on delete restrict,
  worker_id uuid not null references public.workers(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete restrict,
  referral_id uuid references public.referrals(id) on delete restrict,
  status text not null default 'checked_in' check (status in ('checked_in', 'in_progress', 'waiting', 'completed', 'cancelled')),
  version int not null default 1 check (version > 0),
  checked_in_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index encounters_active_appointment_uq
  on public.encounters (tenant_id, appointment_id)
  where appointment_id is not null and status in ('checked_in', 'in_progress', 'waiting');

create table public.encounter_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  schema_version int not null,
  payload jsonb not null,
  content_hash text not null,
  created_at timestamptz not null default now(),
  constraint encounter_snapshots_encounter_uq unique (encounter_id)
);

create table public.encounter_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  step_type text not null check (step_type in ('reception', 'triage', 'consultation', 'exam', 'document')),
  status text not null default 'pending' check (status in ('pending', 'available', 'in_progress', 'blocked', 'completed', 'cancelled')),
  sequence int not null,
  depends_on_step_id uuid references public.encounter_steps(id) on delete restrict,
  version int not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint encounter_steps_sequence_uq unique (tenant_id, encounter_id, sequence)
);

create table public.encounter_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.exam_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  exam_catalog_id uuid not null references public.exam_catalog(id) on delete restrict,
  status text not null default 'ordered' check (status in ('ordered', 'collected', 'resulted', 'cancelled')),
  protocol_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.queue_definitions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  clinic_unit_id uuid not null references public.clinic_units(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null,
  step_type text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  constraint queue_definitions_tenant_unit_code_uq unique (tenant_id, clinic_unit_id, code)
);

create table public.queue_tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  queue_definition_id uuid not null references public.queue_definitions(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  encounter_step_id uuid not null references public.encounter_steps(id) on delete restrict,
  status text not null default 'waiting' check (status in ('waiting', 'called', 'in_service', 'done', 'cancelled')),
  priority int not null default 100,
  position_key timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function public.reject_snapshot_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'encounter snapshots are immutable' using errcode = '42501';
end;
$$;

create trigger encounter_snapshots_immutable
before update or delete on public.encounter_snapshots
for each row execute function public.reject_snapshot_mutation();

create or replace function public.check_in_appointment(
  target_tenant_id uuid,
  target_appointment_id uuid,
  idempotency_key_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  existing_response jsonb;
  appointment_record record;
  new_encounter_id uuid;
  new_snapshot_id uuid;
  first_step_id uuid;
  first_queue_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'encounters.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select response_reference into existing_response
  from public.idempotency_keys
  where tenant_id = target_tenant_id
    and scope = 'check-in'
    and key = idempotency_key_value
  for update;

  if existing_response ? 'encounterId' then
    return (existing_response ->> 'encounterId')::uuid;
  end if;

  select appointment.*, referral.worker_id, referral.id as referral_id
    into appointment_record
  from public.appointments appointment
  left join public.referrals referral on referral.id = appointment.referral_id
  where appointment.id = target_appointment_id
    and appointment.tenant_id = target_tenant_id
  for update;

  if appointment_record.id is null then
    raise exception 'appointment not found' using errcode = 'P0002';
  end if;

  if appointment_record.status not in ('scheduled', 'confirmed') then
    raise exception 'appointment cannot be checked in' using errcode = '42501';
  end if;

  insert into public.idempotency_keys (tenant_id, scope, key, request_hash, expires_at)
  values (target_tenant_id, 'check-in', idempotency_key_value, audit_request_id, now() + interval '1 day')
  on conflict (tenant_id, scope, key) do nothing;

  insert into public.encounters (tenant_id, clinic_unit_id, worker_id, appointment_id, referral_id, status)
  values (
    target_tenant_id,
    appointment_record.clinic_unit_id,
    appointment_record.worker_id,
    appointment_record.id,
    appointment_record.referral_id,
    'checked_in'
  )
  returning id into new_encounter_id;

  insert into public.encounter_snapshots (tenant_id, encounter_id, schema_version, payload, content_hash)
  values (
    target_tenant_id,
    new_encounter_id,
    1,
    jsonb_build_object(
      'appointmentId', appointment_record.id,
      'referralId', appointment_record.referral_id,
      'workerId', appointment_record.worker_id,
      'checkedInAt', now()
    ),
    encode(digest(new_encounter_id::text || ':' || appointment_record.worker_id::text, 'sha256'), 'hex')
  )
  returning id into new_snapshot_id;

  insert into public.encounter_steps (tenant_id, encounter_id, step_type, status, sequence)
  values
    (target_tenant_id, new_encounter_id, 'reception', 'available', 1),
    (target_tenant_id, new_encounter_id, 'triage', 'blocked', 2),
    (target_tenant_id, new_encounter_id, 'consultation', 'blocked', 3)
  returning id into first_step_id;

  insert into public.exam_orders (tenant_id, encounter_id, exam_catalog_id, protocol_snapshot)
  select target_tenant_id, new_encounter_id, item.exam_catalog_id, jsonb_build_object('source', item.source)
  from public.referral_items item
  where item.tenant_id = target_tenant_id
    and item.referral_id = appointment_record.referral_id
    and item.status <> 'cancelled';

  select id into first_queue_id
  from public.queue_definitions
  where tenant_id = target_tenant_id
    and clinic_unit_id = appointment_record.clinic_unit_id
    and step_type = 'reception'
    and status = 'active'
  order by created_at
  limit 1;

  if first_queue_id is null then
    insert into public.queue_definitions (tenant_id, clinic_unit_id, code, name, step_type)
    values (target_tenant_id, appointment_record.clinic_unit_id, 'RECEPCAO', 'Recepção', 'reception')
    returning id into first_queue_id;
  end if;

  insert into public.queue_tickets (tenant_id, queue_definition_id, encounter_id, encounter_step_id)
  values (target_tenant_id, first_queue_id, new_encounter_id, first_step_id);

  insert into public.encounter_events (tenant_id, encounter_id, event_type, created_by, payload)
  values (target_tenant_id, new_encounter_id, 'checked_in', auth.uid(), jsonb_build_object('snapshotId', new_snapshot_id));

  insert into public.outbox_events (tenant_id, aggregate_type, aggregate_id, event_type, payload_redacted)
  values (target_tenant_id, 'encounter', new_encounter_id, 'encounter.checked_in', jsonb_build_object('clinicUnitId', appointment_record.clinic_unit_id));

  update public.appointments set status = 'completed', updated_at = now()
  where id = appointment_record.id;

  update public.referrals set status = 'scheduled', updated_at = now()
  where id = appointment_record.referral_id;

  update public.idempotency_keys
  set response_reference = jsonb_build_object('encounterId', new_encounter_id)
  where tenant_id = target_tenant_id
    and scope = 'check-in'
    and key = idempotency_key_value;

  perform public.append_audit_log(
    target_tenant_id,
    'encounter.checked_in',
    'encounter',
    new_encounter_id,
    audit_request_id,
    jsonb_build_object('appointmentId', appointment_record.id)
  );

  return new_encounter_id;
end;
$$;

revoke all on function public.reject_snapshot_mutation() from public;
revoke all on function public.check_in_appointment(uuid, uuid, text, text) from public;
grant execute on function public.check_in_appointment(uuid, uuid, text, text) to authenticated;

alter table public.idempotency_keys enable row level security;
alter table public.outbox_events enable row level security;
alter table public.encounters enable row level security;
alter table public.encounter_snapshots enable row level security;
alter table public.encounter_steps enable row level security;
alter table public.encounter_events enable row level security;
alter table public.exam_orders enable row level security;
alter table public.queue_definitions enable row level security;
alter table public.queue_tickets enable row level security;

create policy encounters_select on public.encounters for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'encounters.read'));
create policy encounter_domain_write on public.encounters for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'encounters.manage'))
  with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));

create policy encounter_snapshots_select on public.encounter_snapshots for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'encounters.read'));
create policy encounter_steps_select on public.encounter_steps for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'encounters.read'));
create policy encounter_steps_write on public.encounter_steps for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'encounters.manage'))
  with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy encounter_events_select on public.encounter_events for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'encounters.read'));
create policy encounter_events_insert on public.encounter_events for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'encounters.manage') and created_by = auth.uid());

create policy exam_orders_select on public.exam_orders for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'encounters.read'));
create policy queue_definitions_select on public.queue_definitions for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'queues.read'));
create policy queue_definitions_write on public.queue_definitions for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'queues.manage'))
  with check (public.has_tenant_permission(tenant_id, 'queues.manage'));
create policy queue_tickets_select on public.queue_tickets for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'queues.read'));
create policy queue_tickets_write on public.queue_tickets for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'queues.manage'))
  with check (public.has_tenant_permission(tenant_id, 'queues.manage'));
create policy idempotency_keys_select on public.idempotency_keys for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy idempotency_keys_write on public.idempotency_keys for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'encounters.manage'))
  with check (public.has_tenant_permission(tenant_id, 'encounters.manage'));
create policy outbox_events_select on public.outbox_events for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'encounters.read'));

commit;
