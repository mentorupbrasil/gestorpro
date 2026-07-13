begin;

insert into public.permissions (code, description)
values
  ('display.read', 'Visualizar painéis de chamada'),
  ('display.manage', 'Gerenciar painéis e chamadas')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in ('display.read', 'display.manage')
on conflict do nothing;

create table public.display_panels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  clinic_unit_id uuid not null references public.clinic_units(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null,
  channel_name text not null,
  status text not null default 'active' check (status in ('active', 'revoked', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint display_panels_tenant_unit_code_uq unique (tenant_id, clinic_unit_id, code)
);

create table public.display_panel_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  display_panel_id uuid not null references public.display_panels(id) on delete restrict,
  device_label text not null,
  status text not null default 'online' check (status in ('online', 'offline', 'revoked')),
  last_heartbeat_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.call_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  clinic_unit_id uuid not null references public.clinic_units(id) on delete restrict,
  queue_ticket_id uuid not null references public.queue_tickets(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  display_panel_id uuid references public.display_panels(id) on delete restrict,
  action text not null check (action in ('call', 'recall', 'arrived', 'start', 'return', 'no_show', 'redirect')),
  payload_public jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'acknowledged', 'superseded', 'cancelled')),
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create unique index call_events_active_ticket_uq
  on public.call_events (tenant_id, queue_ticket_id)
  where status = 'active';

create table public.call_deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  call_event_id uuid not null references public.call_events(id) on delete restrict,
  display_panel_session_id uuid references public.display_panel_sessions(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'delivered', 'acknowledged', 'failed')),
  delivered_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  constraint call_deliveries_event_session_uq unique (call_event_id, display_panel_session_id)
);

create or replace function public.create_call_event(
  target_tenant_id uuid,
  target_queue_ticket_id uuid,
  target_display_panel_id uuid,
  call_action text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  ticket_record record;
  new_call_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'display.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if call_action not in ('call', 'recall', 'arrived', 'start', 'return', 'no_show', 'redirect') then
    raise exception 'invalid call action' using errcode = '22023';
  end if;

  select ticket.*, encounter.clinic_unit_id, encounter.id as encounter_id
    into ticket_record
  from public.queue_tickets ticket
  join public.encounters encounter on encounter.id = ticket.encounter_id
  where ticket.id = target_queue_ticket_id
    and ticket.tenant_id = target_tenant_id
  for update;

  if ticket_record.id is null then
    raise exception 'queue ticket not found' using errcode = 'P0002';
  end if;

  insert into public.call_events (
    tenant_id,
    clinic_unit_id,
    queue_ticket_id,
    encounter_id,
    display_panel_id,
    action,
    payload_public,
    created_by
  )
  values (
    target_tenant_id,
    ticket_record.clinic_unit_id,
    target_queue_ticket_id,
    ticket_record.encounter_id,
    target_display_panel_id,
    call_action,
    jsonb_build_object('ticketId', target_queue_ticket_id, 'calledAt', now()),
    auth.uid()
  )
  returning id into new_call_id;

  update public.queue_tickets
  set status = case when call_action in ('call', 'recall') then 'called' else status end
  where id = target_queue_ticket_id;

  insert into public.call_deliveries (tenant_id, call_event_id, display_panel_session_id)
  select target_tenant_id, new_call_id, session.id
  from public.display_panel_sessions session
  where session.display_panel_id = target_display_panel_id
    and session.status = 'online';

  perform public.append_audit_log(
    target_tenant_id,
    'call_event.created',
    'call_event',
    new_call_id,
    audit_request_id,
    jsonb_build_object('action', call_action)
  );

  return new_call_id;
end;
$$;

revoke all on function public.create_call_event(uuid, uuid, uuid, text, text) from public;
grant execute on function public.create_call_event(uuid, uuid, uuid, text, text) to authenticated;

alter table public.display_panels enable row level security;
alter table public.display_panel_sessions enable row level security;
alter table public.call_events enable row level security;
alter table public.call_deliveries enable row level security;

create policy display_panels_select on public.display_panels for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'display.read'));
create policy display_panels_write on public.display_panels for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'display.manage'))
  with check (public.has_tenant_permission(tenant_id, 'display.manage'));
create policy display_panel_sessions_select on public.display_panel_sessions for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'display.read'));
create policy display_panel_sessions_write on public.display_panel_sessions for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'display.manage'))
  with check (public.has_tenant_permission(tenant_id, 'display.manage'));
create policy call_events_select on public.call_events for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'display.read'));
create policy call_events_write on public.call_events for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'display.manage'))
  with check (public.has_tenant_permission(tenant_id, 'display.manage') and created_by = auth.uid());
create policy call_deliveries_select on public.call_deliveries for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'display.read'));
create policy call_deliveries_write on public.call_deliveries for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'display.manage'))
  with check (public.has_tenant_permission(tenant_id, 'display.manage'));

commit;
