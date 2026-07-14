-- P1: transição única de etapa/fila + create_call_event endurecido +
-- upsert_display_panel (fim do DML direto no app).

begin;

-- ---------------------------------------------------------------------------
-- Painel: escrita só via RPC
-- ---------------------------------------------------------------------------
create or replace function public.upsert_display_panel(
  target_tenant_id uuid,
  target_clinic_unit_id uuid,
  code_value text,
  name_value text,
  channel_name_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  new_panel_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_unit_permission(target_clinic_unit_id, 'display.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.clinic_units unit
    where unit.id = target_clinic_unit_id
      and unit.tenant_id = target_tenant_id
  ) then
    raise exception 'clinic unit not found' using errcode = 'P0002';
  end if;

  insert into public.display_panels (
    tenant_id, clinic_unit_id, code, name, channel_name, status
  )
  values (
    target_tenant_id,
    target_clinic_unit_id,
    upper(trim(code_value)),
    trim(name_value),
    trim(channel_name_value),
    'active'
  )
  on conflict (tenant_id, clinic_unit_id, code) do update
    set name = excluded.name,
        channel_name = excluded.channel_name,
        status = 'active',
        updated_at = now()
  returning id into new_panel_id;

  perform public.append_audit_log(
    target_tenant_id,
    'display_panel.upserted',
    'display_panel',
    new_panel_id,
    audit_request_id,
    jsonb_build_object('clinicUnitId', target_clinic_unit_id, 'code', upper(trim(code_value)))
  );

  return new_panel_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Máquina de estados: concluir etapa atual e liberar próximas
-- ---------------------------------------------------------------------------
create or replace function public.ensure_queue_for_step(
  target_tenant_id uuid,
  target_clinic_unit_id uuid,
  step_type_value text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  queue_id uuid;
  queue_code text;
  queue_name text;
begin
  select id into queue_id
  from public.queue_definitions
  where tenant_id = target_tenant_id
    and clinic_unit_id = target_clinic_unit_id
    and step_type = step_type_value
    and status = 'active'
  order by created_at
  limit 1;

  if queue_id is not null then
    return queue_id;
  end if;

  queue_code := upper(left(regexp_replace(step_type_value, '[^a-z0-9]+', '_', 'gi'), 24));
  queue_name := initcap(replace(step_type_value, '_', ' '));

  insert into public.queue_definitions (
    tenant_id, clinic_unit_id, code, name, step_type
  )
  values (
    target_tenant_id,
    target_clinic_unit_id,
    queue_code,
    queue_name,
    step_type_value
  )
  returning id into queue_id;

  return queue_id;
end;
$$;

create or replace function public.transition_encounter_step(
  target_tenant_id uuid,
  target_encounter_step_id uuid,
  target_action text,
  justification_text text,
  expected_version int,
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
  step_record record;
  encounter_record record;
  dependent record;
  deps_incomplete int;
  new_ticket_id uuid;
  queue_id uuid;
  permission_code text;
  next_status text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if target_action not in (
    'start', 'complete', 'return', 'pause', 'waive', 'no_show', 'cancel', 'reopen'
  ) then
    raise exception 'invalid transition action' using errcode = '22023';
  end if;

  if nullif(trim(idempotency_key_value), '') is null then
    raise exception 'idempotency key required' using errcode = '22023';
  end if;

  select response_reference into existing_response
  from public.idempotency_keys
  where tenant_id = target_tenant_id
    and scope = 'encounter-step-transition'
    and key = idempotency_key_value
  for update;

  if existing_response ? 'stepId' then
    return (existing_response ->> 'stepId')::uuid;
  end if;

  select *
    into step_record
  from public.encounter_steps step
  where step.id = target_encounter_step_id
    and step.tenant_id = target_tenant_id
  for update;

  if step_record.id is null then
    raise exception 'encounter step not found' using errcode = 'P0002';
  end if;

  if step_record.version is distinct from expected_version then
    raise exception 'version conflict' using errcode = '40001';
  end if;

  select *
    into encounter_record
  from public.encounters encounter
  where encounter.id = step_record.encounter_id
    and encounter.tenant_id = target_tenant_id
  for update;

  if encounter_record.id is null then
    raise exception 'encounter not found' using errcode = 'P0002';
  end if;

  if encounter_record.status in ('completed', 'cancelled') then
    raise exception 'encounter is closed' using errcode = '42501';
  end if;

  permission_code := case step_record.step_type
    when 'reception' then 'encounters.manage'
    when 'triage' then 'triage.manage'
    when 'consultation' then 'consultations.manage'
    when 'conclusion' then 'conclusions.manage'
    when 'document' then 'documents.manage'
    when 'delivery' then 'documents.deliver'
    when 'billing' then 'finance.manage'
    else 'exams.manage'
  end;

  if not public.has_unit_permission(encounter_record.clinic_unit_id, permission_code)
     and not public.has_unit_permission(encounter_record.clinic_unit_id, 'encounters.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if target_action = 'waive' and char_length(trim(coalesce(justification_text, ''))) < 10 then
    raise exception 'waiver justification required' using errcode = '22023';
  end if;

  next_status := case target_action
    when 'start' then 'in_progress'
    when 'complete' then 'completed'
    when 'return' then 'available'
    when 'pause' then 'blocked'
    when 'waive' then 'cancelled'
    when 'no_show' then 'cancelled'
    when 'cancel' then 'cancelled'
    when 'reopen' then 'available'
  end;

  if target_action = 'start' and step_record.status not in ('available', 'pending') then
    raise exception 'step cannot be started from current status' using errcode = '42501';
  end if;

  if target_action = 'complete' and step_record.status not in ('available', 'in_progress') then
    raise exception 'step cannot be completed from current status' using errcode = '42501';
  end if;

  insert into public.idempotency_keys (tenant_id, scope, key, request_hash, expires_at)
  values (
    target_tenant_id,
    'encounter-step-transition',
    idempotency_key_value,
    coalesce(nullif(trim(audit_request_id), ''), idempotency_key_value),
    now() + interval '1 day'
  )
  on conflict (tenant_id, scope, key) do nothing;

  update public.encounter_steps
  set status = next_status,
      version = version + 1,
      updated_at = now()
  where id = step_record.id
    and tenant_id = target_tenant_id;

  update public.queue_tickets
  set status = case
    when target_action = 'start' then 'in_service'
    when target_action in ('complete', 'waive') then 'done'
    when target_action in ('no_show', 'cancel') then 'cancelled'
    when target_action = 'return' then 'waiting'
    else status
  end
  where tenant_id = target_tenant_id
    and encounter_step_id = step_record.id
    and status in ('waiting', 'called', 'in_service');

  if target_action in ('complete', 'waive') then
    for dependent in
      select *
      from public.encounter_steps child
      where child.tenant_id = target_tenant_id
        and child.encounter_id = step_record.encounter_id
        and child.depends_on_step_id = step_record.id
        and child.status = 'blocked'
      order by child.sequence
      for update
    loop
      select count(*)::int into deps_incomplete
      from public.encounter_steps ancestor
      where ancestor.id = dependent.depends_on_step_id
        and ancestor.status not in ('completed', 'cancelled');

      if deps_incomplete = 0 then
        update public.encounter_steps
        set status = 'available',
            version = version + 1,
            updated_at = now()
        where id = dependent.id;

        -- Não reutilizar ticket anterior: cria ticket novo na fila da etapa
        queue_id := public.ensure_queue_for_step(
          target_tenant_id,
          encounter_record.clinic_unit_id,
          dependent.step_type
        );

        insert into public.queue_tickets (
          tenant_id, queue_definition_id, encounter_id, encounter_step_id, status
        )
        values (
          target_tenant_id, queue_id, encounter_record.id, dependent.id, 'waiting'
        )
        returning id into new_ticket_id;
      end if;
    end loop;

    if not exists (
      select 1 from public.encounter_steps open_step
      where open_step.encounter_id = encounter_record.id
        and open_step.tenant_id = target_tenant_id
        and open_step.status not in ('completed', 'cancelled')
    ) then
      update public.encounters
      set status = 'completed', updated_at = now()
      where id = encounter_record.id;
    elsif encounter_record.status = 'checked_in' then
      update public.encounters
      set status = 'in_progress', updated_at = now()
      where id = encounter_record.id;
    end if;
  end if;

  insert into public.encounter_events (
    tenant_id, encounter_id, event_type, created_by, payload
  )
  values (
    target_tenant_id,
    encounter_record.id,
    'step.' || target_action,
    auth.uid(),
    jsonb_build_object(
      'stepId', step_record.id,
      'stepType', step_record.step_type,
      'justification', nullif(trim(justification_text), ''),
      'newTicketId', new_ticket_id
    )
  );

  insert into public.outbox_events (
    tenant_id, aggregate_type, aggregate_id, event_type, payload_redacted
  )
  values (
    target_tenant_id,
    'encounter',
    encounter_record.id,
    'encounter.step.' || target_action,
    jsonb_build_object(
      'stepType', step_record.step_type,
      'clinicUnitId', encounter_record.clinic_unit_id
    )
  );

  update public.idempotency_keys
  set response_reference = jsonb_build_object(
    'stepId', step_record.id,
    'action', target_action,
    'newTicketId', new_ticket_id
  )
  where tenant_id = target_tenant_id
    and scope = 'encounter-step-transition'
    and key = idempotency_key_value;

  perform public.append_audit_log(
    target_tenant_id,
    'encounter_step.' || target_action,
    'encounter_step',
    step_record.id,
    audit_request_id,
    jsonb_build_object('action', target_action, 'stepType', step_record.step_type)
  );

  return step_record.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_call_event: supersede, privacidade, unidade, sem CPF/clínica
-- ---------------------------------------------------------------------------
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
  panel_record record;
  room_label text;
  ticket_code text;
  voice_text text;
  new_call_id uuid;
  active_other uuid;
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

  -- impede duas salas chamarem o mesmo paciente ao mesmo tempo
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
  room_label := panel_record.name;
  voice_text := case call_action
    when 'recall' then format('Rechamada. Senha %s, dirigir-se a %s.', ticket_code, room_label)
    when 'call' then format('Senha %s, dirigir-se a %s.', ticket_code, room_label)
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
    target_display_panel_id,
    call_action,
    jsonb_build_object(
      'ticketCode', ticket_code,
      'room', room_label,
      'voiceText', voice_text,
      'calledAt', now(),
      'queueName', ticket_record.queue_name
    ),
    'active',
    auth.uid()
  )
  returning id into new_call_id;

  update public.queue_tickets
  set status = case
    when call_action in ('call', 'recall') then 'called'
    when call_action = 'start' then 'in_service'
    when call_action = 'arrived' then 'called'
    when call_action = 'no_show' then 'cancelled'
    when call_action = 'return' then 'waiting'
    else status
  end
  where id = target_queue_ticket_id
    and tenant_id = target_tenant_id;

  if call_action in ('call', 'recall', 'start') then
    update public.encounter_steps
    set status = case
      when call_action = 'start' then 'in_progress'
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
  where session.display_panel_id = target_display_panel_id
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

revoke all on function public.upsert_display_panel(uuid, uuid, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.ensure_queue_for_step(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.transition_encounter_step(uuid, uuid, text, text, int, text, text)
  from public, anon, authenticated;
revoke all on function public.create_call_event(uuid, uuid, uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.upsert_display_panel(uuid, uuid, text, text, text, text)
  to authenticated;
grant execute on function public.transition_encounter_step(uuid, uuid, text, text, int, text, text)
  to authenticated;
grant execute on function public.create_call_event(uuid, uuid, uuid, text, text)
  to authenticated;

commit;
