begin;

insert into public.permissions (code, description)
values
  ('equipment.read', 'Visualizar equipamentos e conectores'),
  ('equipment.manage', 'Gerenciar equipamentos, manutenção e conectores')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in ('equipment.read', 'equipment.manage')
on conflict do nothing;

create table public.equipment_registry (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  clinic_unit_id uuid references public.clinic_units(id) on delete restrict,
  equipment_type text not null,
  manufacturer text,
  model text,
  serial_number text not null,
  status text not null default 'active' check (
    status in ('active', 'blocked', 'maintenance', 'retired')
  ),
  capabilities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint equipment_registry_serial_uq unique (tenant_id, serial_number)
);

create table public.equipment_calibrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  equipment_id uuid not null references public.equipment_registry(id) on delete restrict,
  calibrated_at timestamptz not null,
  valid_until timestamptz not null,
  certificate_reference text,
  payload_redacted jsonb not null default '{}'::jsonb,
  status text not null default 'valid' check (status in ('valid', 'expired', 'revoked')),
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint equipment_calibrations_period_ck check (valid_until >= calibrated_at)
);

create table public.equipment_maintenance_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  equipment_id uuid not null references public.equipment_registry(id) on delete restrict,
  event_type text not null check (event_type in ('scheduled', 'started', 'completed', 'blocked', 'unblocked')),
  note_redacted text,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.local_connectors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  clinic_unit_id uuid references public.clinic_units(id) on delete restrict,
  connector_name text not null,
  device_public_key text not null,
  status text not null default 'pending' check (
    status in ('pending', 'active', 'rotating_key', 'blocked', 'revoked')
  ),
  scope jsonb not null default '[]'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  constraint local_connectors_key_uq unique (tenant_id, device_public_key)
);

create table public.local_connector_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  connector_id uuid not null references public.local_connectors(id) on delete restrict,
  token_hash text not null,
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  constraint local_connector_tokens_hash_uq unique (tenant_id, token_hash)
);

create table public.local_connector_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  connector_id uuid not null references public.local_connectors(id) on delete restrict,
  equipment_id uuid references public.equipment_registry(id) on delete restrict,
  event_type text not null,
  idempotency_key text not null,
  payload_redacted jsonb not null default '{}'::jsonb,
  status text not null default 'accepted' check (
    status in ('accepted', 'duplicate', 'rejected', 'processed')
  ),
  created_at timestamptz not null default now(),
  constraint local_connector_events_idempotency_uq unique (
    tenant_id,
    connector_id,
    event_type,
    idempotency_key
  )
);

create table public.local_connector_update_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  connector_id uuid references public.local_connectors(id) on delete restrict,
  min_version text not null,
  target_version text not null,
  signature_reference text not null,
  status text not null default 'active' check (status in ('active', 'retired')),
  created_at timestamptz not null default now()
);

create or replace function public.record_connector_event(
  target_tenant_id uuid,
  target_connector_id uuid,
  target_equipment_id uuid,
  event_type_value text,
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
  event_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'equipment.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  insert into public.local_connector_events (
    tenant_id,
    connector_id,
    equipment_id,
    event_type,
    idempotency_key,
    payload_redacted
  )
  values (
    target_tenant_id,
    target_connector_id,
    target_equipment_id,
    event_type_value,
    idempotency_key_value,
    coalesce(payload_redacted_value, '{}'::jsonb)
  )
  on conflict (tenant_id, connector_id, event_type, idempotency_key) do update
    set status = 'duplicate'
  returning id into event_id;

  update public.local_connectors
    set last_seen_at = now()
  where id = target_connector_id
    and tenant_id = target_tenant_id;

  perform public.log_audit(
    target_tenant_id,
    'connector.event.recorded',
    'local_connector_events',
    event_id,
    audit_request_id,
    jsonb_build_object('eventType', event_type_value)
  );

  return event_id;
end;
$$;

alter table public.equipment_registry enable row level security;
alter table public.equipment_calibrations enable row level security;
alter table public.equipment_maintenance_events enable row level security;
alter table public.local_connectors enable row level security;
alter table public.local_connector_tokens enable row level security;
alter table public.local_connector_events enable row level security;
alter table public.local_connector_update_policies enable row level security;

create policy equipment_registry_read on public.equipment_registry
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'equipment.read'));
create policy equipment_registry_manage on public.equipment_registry
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'equipment.manage'))
  with check (public.has_tenant_permission(tenant_id, 'equipment.manage'));
create policy equipment_calibrations_read on public.equipment_calibrations
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'equipment.read'));
create policy equipment_calibrations_manage on public.equipment_calibrations
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'equipment.manage'))
  with check (public.has_tenant_permission(tenant_id, 'equipment.manage') and created_by = auth.uid());
create policy equipment_maintenance_read on public.equipment_maintenance_events
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'equipment.read'));
create policy equipment_maintenance_manage on public.equipment_maintenance_events
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'equipment.manage'))
  with check (public.has_tenant_permission(tenant_id, 'equipment.manage') and created_by = auth.uid());
create policy local_connectors_read on public.local_connectors
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'equipment.read'));
create policy local_connectors_manage on public.local_connectors
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'equipment.manage'))
  with check (public.has_tenant_permission(tenant_id, 'equipment.manage'));
create policy connector_tokens_read on public.local_connector_tokens
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'equipment.read'));
create policy connector_tokens_manage on public.local_connector_tokens
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'equipment.manage'))
  with check (public.has_tenant_permission(tenant_id, 'equipment.manage'));
create policy connector_events_read on public.local_connector_events
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'equipment.read'));
create policy connector_events_manage on public.local_connector_events
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'equipment.manage'))
  with check (public.has_tenant_permission(tenant_id, 'equipment.manage'));
create policy connector_updates_read on public.local_connector_update_policies
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'equipment.read'));
create policy connector_updates_manage on public.local_connector_update_policies
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'equipment.manage'))
  with check (public.has_tenant_permission(tenant_id, 'equipment.manage'));

grant execute on function public.record_connector_event(uuid, uuid, uuid, text, text, jsonb, text) to authenticated;

commit;
