-- P1: painel de chamadas — redirect com destino, return/no_show na etapa,
-- start com versão esperada, ACK fail-closed, revoke de token.

begin;

drop function if exists public.create_call_event(uuid, uuid, uuid, text, text);
drop function if exists public.create_call_event(uuid, uuid, uuid, text, text, int, uuid);

create or replace function public.create_call_event(
  target_tenant_id uuid,
  target_queue_ticket_id uuid,
  target_display_panel_id uuid,
  call_action text,
  audit_request_id text,
  expected_version int default null,
  redirect_target_panel_id uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  ticket_record record;
  panel_record record;
  redirect_panel record;
  step_record record;
  room_label text;
  ticket_code text;
  voice_text text;
  new_call_id uuid;
  active_other uuid;
  effective_panel_id uuid := target_display_panel_id;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if call_action not in ('call', 'recall', 'arrived', 'start', 'return', 'no_show', 'redirect') then
    raise exception 'invalid call action' using errcode = '22023';
  end if;

  select
    ticket.id,
    ticket.status,
    ticket.tenant_id,
    ticket.encounter_id,
    ticket.encounter_step_id,
    encounter.clinic_unit_id,
    encounter.worker_id,
    queue.code as queue_code,
    queue.name as queue_name,
    queue.step_type
  into ticket_record
  from public.queue_tickets ticket
  join public.encounters encounter
    on encounter.id = ticket.encounter_id
   and encounter.tenant_id = ticket.tenant_id
  join public.queue_definitions queue
    on queue.id = ticket.queue_definition_id
   and queue.tenant_id = ticket.tenant_id
  where ticket.id = target_queue_ticket_id
    and ticket.tenant_id = target_tenant_id
  for update of ticket;

  if ticket_record.id is null then
    raise exception 'queue ticket not found' using errcode = 'P0002';
  end if;

  if not public.has_unit_permission(ticket_record.clinic_unit_id, 'display.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select panel.id, panel.clinic_unit_id, panel.name, panel.status
    into panel_record
  from public.display_panels panel
  where panel.id = target_display_panel_id
    and panel.tenant_id = target_tenant_id
  for share;

  if panel_record.id is null or panel_record.status <> 'active' then
    raise exception 'display panel not found' using errcode = 'P0002';
  end if;

  if panel_record.clinic_unit_id <> ticket_record.clinic_unit_id then
    raise exception 'panel and ticket must share clinic unit' using errcode = '22023';
  end if;

  if call_action = 'redirect' then
    if redirect_target_panel_id is null then
      raise exception 'redirect destination required' using errcode = '22023';
    end if;
    select panel.id, panel.clinic_unit_id, panel.name, panel.status
      into redirect_panel
    from public.display_panels panel
    where panel.id = redirect_target_panel_id
      and panel.tenant_id = target_tenant_id
    for share;
    if redirect_panel.id is null or redirect_panel.status <> 'active' then
      raise exception 'redirect destination not found' using errcode = 'P0002';
    end if;
    if redirect_panel.clinic_unit_id <> ticket_record.clinic_unit_id then
      raise exception 'redirect destination must share clinic unit' using errcode = '22023';
    end if;
    effective_panel_id := redirect_panel.id;
    room_label := redirect_panel.name;
  else
    room_label := panel_record.name;
  end if;

  if call_action = 'arrived' and ticket_record.status <> 'called' then
    raise exception 'arrived only after call' using errcode = '42501';
  end if;

  select step.id, step.status, step.version
    into step_record
  from public.encounter_steps step
  where step.id = ticket_record.encounter_step_id
    and step.tenant_id = target_tenant_id
  for update;

  if call_action in ('start', 'return', 'no_show') then
    if expected_version is null then
      raise exception 'expected version required' using errcode = '22023';
    end if;
    if step_record.version is distinct from expected_version then
      raise exception 'version conflict' using errcode = '40001';
    end if;
  end if;

  if call_action = 'no_show' and step_record.status = 'in_progress' then
    raise exception 'no_show not allowed after clinical start' using errcode = '42501';
  end if;

  if call_action in ('call', 'recall') then
    select call_event.id into active_other
    from public.call_events call_event
    where call_event.tenant_id = target_tenant_id
      and call_event.encounter_id = ticket_record.encounter_id
      and call_event.status = 'active'
      and call_event.action in ('call', 'recall')
      and call_event.queue_ticket_id <> target_queue_ticket_id
    limit 1
    for update;

    if active_other is not null then
      raise exception 'patient already being called by another room' using errcode = '23P01';
    end if;
  end if;

  update public.call_events
  set status = 'superseded'
  where tenant_id = target_tenant_id
    and queue_ticket_id = target_queue_ticket_id
    and status = 'active';

  ticket_code := coalesce(ticket_record.queue_code, 'A') || '-' || right(replace(ticket_record.id::text, '-', ''), 4);
  voice_text := case call_action
    when 'recall' then format('Rechamada. Senha %s, dirigir-se a %s.', ticket_code, room_label)
    when 'call' then format('Senha %s, dirigir-se a %s.', ticket_code, room_label)
    when 'arrived' then format('Senha %s presente em %s.', ticket_code, room_label)
    when 'redirect' then format('Senha %s, dirigir-se a %s.', ticket_code, room_label)
    else format('Atualização da senha %s.', ticket_code)
  end;

  insert into public.call_events (
    tenant_id,
    clinic_unit_id,
    queue_ticket_id,
    encounter_id,
    display_panel_id,
    action,
    payload_public,
    status,
    created_by
  )
  values (
    target_tenant_id,
    ticket_record.clinic_unit_id,
    target_queue_ticket_id,
    ticket_record.encounter_id,
    effective_panel_id,
    call_action,
    jsonb_build_object(
      'ticketCode', ticket_code,
      'room', room_label,
      'voiceText', voice_text,
      'calledAt', now(),
      'arrivedAt', case when call_action = 'arrived' then now() else null end,
      'queueName', ticket_record.queue_name,
      'redirectPanelId', redirect_target_panel_id
    ),
    'active',
    auth.uid()
  )
  returning id into new_call_id;

  update public.queue_tickets
  set status = case
    when call_action in ('call', 'recall', 'arrived') then 'called'
    when call_action = 'start' then 'in_service'
    when call_action = 'no_show' then 'cancelled'
    when call_action = 'return' then 'waiting'
    when call_action = 'redirect' then 'called'
    else status
  end
  where id = target_queue_ticket_id
    and tenant_id = target_tenant_id;

  if call_action in ('call', 'recall', 'start', 'return', 'no_show') then
    update public.encounter_steps
    set status = case
      when call_action = 'start' then 'in_progress'
      when call_action = 'return' then 'available'
      when call_action = 'no_show' then 'cancelled'
      when status in ('blocked', 'pending') then 'available'
      else status
    end,
    version = version + 1,
    updated_at = now()
    where id = ticket_record.encounter_step_id
      and tenant_id = target_tenant_id;
  end if;

  insert into public.call_deliveries (tenant_id, call_event_id, display_panel_session_id)
  select target_tenant_id, new_call_id, session.id
  from public.display_panel_sessions session
  where session.display_panel_id = effective_panel_id
    and session.status = 'online';

  insert into public.outbox_events (
    tenant_id, aggregate_type, aggregate_id, event_type, payload_redacted
  )
  values (
    target_tenant_id,
    'call_event',
    new_call_id,
    'call_event.created',
    jsonb_build_object(
      'clinicUnitId', ticket_record.clinic_unit_id,
      'ticketCode', ticket_code,
      'action', call_action
    )
  );

  perform public.append_audit_log(
    target_tenant_id,
    'call_event.created',
    'call_event',
    new_call_id,
    audit_request_id,
    jsonb_build_object('action', call_action, 'ticketCode', ticket_code)
  );

  return new_call_id;
end;
$$;

create or replace function public.acknowledge_call_delivery(
  device_token_value text,
  target_call_event_id uuid,
  target_session_id uuid,
  ack_kind text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  panel_id uuid;
  token_hash text := public.hash_device_token(device_token_value);
  updated_rows int;
begin
  if ack_kind not in ('delivered', 'acknowledged', 'displayed') then
    raise exception 'invalid ack kind' using errcode = '22023';
  end if;

  select id into panel_id
  from public.display_panels
  where device_token_hash = token_hash
    and status = 'active';

  if panel_id is null then
    raise exception 'invalid device token' using errcode = '42501';
  end if;

  update public.call_deliveries delivery
  set status = case
        when ack_kind = 'delivered' then 'delivered'
        else 'acknowledged'
      end,
      delivered_at = coalesce(delivery.delivered_at, now()),
      acknowledged_at = case when ack_kind <> 'delivered' then now() else delivery.acknowledged_at end
  from public.call_events call_event
  where delivery.call_event_id = call_event.id
    and call_event.id = target_call_event_id
    and call_event.display_panel_id = panel_id
    and delivery.display_panel_session_id = target_session_id;

  get diagnostics updated_rows = row_count;
  if updated_rows = 0 then
    raise exception 'call delivery not found' using errcode = 'P0002';
  end if;

  return true;
end;
$$;

create or replace function public.revoke_display_panel(
  target_tenant_id uuid,
  target_display_panel_id uuid,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  panel_unit uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  select clinic_unit_id into panel_unit
  from public.display_panels
  where id = target_display_panel_id
    and tenant_id = target_tenant_id
  for update;

  if panel_unit is null then
    raise exception 'display panel not found' using errcode = 'P0002';
  end if;

  if not public.has_unit_permission(panel_unit, 'display.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  update public.display_panels
  set status = 'revoked',
      device_token_hash = null,
      updated_at = now()
  where id = target_display_panel_id
    and tenant_id = target_tenant_id;

  update public.display_panel_sessions
  set status = 'revoked'
  where display_panel_id = target_display_panel_id
    and status = 'online';

  perform public.append_audit_log(
    target_tenant_id,
    'display_panel.revoked',
    'display_panel',
    target_display_panel_id,
    audit_request_id,
    '{}'::jsonb
  );

  return target_display_panel_id;
end;
$$;

revoke all on function public.create_call_event(uuid, uuid, uuid, text, text, int, uuid)
  from public, anon, authenticated;
revoke all on function public.acknowledge_call_delivery(text, uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.revoke_display_panel(uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.create_call_event(uuid, uuid, uuid, text, text, int, uuid)
  to authenticated;
grant execute on function public.acknowledge_call_delivery(text, uuid, uuid, text)
  to authenticated;
grant execute on function public.revoke_display_panel(uuid, uuid, text)
  to authenticated;

commit;
