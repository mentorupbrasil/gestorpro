-- P0: remove encounters.manage fallback for clinical/finance/document steps.
-- Reception keeps encounters.manage. Reopen requires clinical.reopen + justification.
-- Cancel/waive require justification (>=10 chars). no_show blocked after in_progress.
-- Status values remain within existing CHECK constraints.

begin;

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

  permission_code := case
    when target_action = 'reopen' then 'clinical.reopen'
    when step_record.step_type = 'reception' then 'encounters.manage'
    when step_record.step_type = 'triage' then 'triage.manage'
    when step_record.step_type = 'consultation' then 'consultations.manage'
    when step_record.step_type = 'conclusion' then 'conclusions.manage'
    when step_record.step_type = 'document' then 'documents.manage'
    when step_record.step_type = 'delivery' then 'documents.deliver'
    when step_record.step_type = 'billing' then 'finance.manage'
    else 'exams.manage'
  end;

  -- Sem fallback encounters.manage para etapas clínicas/financeiras/documentais.
  if not public.has_unit_permission(encounter_record.clinic_unit_id, permission_code) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if target_action in ('waive', 'cancel', 'reopen')
     and char_length(trim(coalesce(justification_text, ''))) < 10 then
    raise exception 'justification required' using errcode = '22023';
  end if;

  if target_action = 'no_show' and step_record.status = 'in_progress' then
    raise exception 'no_show not allowed after clinical start' using errcode = '42501';
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

  if target_action = 'pause' and step_record.status <> 'in_progress' then
    raise exception 'step cannot be paused from current status' using errcode = '42501';
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
    'encounter.step.' || target_action,
    'encounter_step',
    step_record.id,
    audit_request_id,
    jsonb_build_object(
      'action', target_action,
      'stepType', step_record.step_type,
      'permission', permission_code
    )
  );

  return step_record.id;
end;
$$;

revoke all on function public.transition_encounter_step(uuid, uuid, text, text, int, text, text)
  from public, anon, authenticated;
grant execute on function public.transition_encounter_step(uuid, uuid, text, text, int, text, text)
  to authenticated;

commit;
