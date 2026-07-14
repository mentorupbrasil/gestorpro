-- Fase G checkpoint: alertas clínicos, adendo de consulta e pausa de fluxo.

create or replace function public.create_clinical_alert(
  target_tenant_id uuid,
  target_encounter_id uuid,
  source_type_value text,
  severity_value text,
  message_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alert_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not (
    public.has_encounter_permission(target_encounter_id, 'triage.manage')
    or public.has_encounter_permission(target_encounter_id, 'consultations.manage')
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if source_type_value not in ('triage', 'exam', 'manual') then
    raise exception 'invalid alert source' using errcode = '22023';
  end if;

  if severity_value not in ('info', 'attention', 'urgent') then
    raise exception 'invalid alert severity' using errcode = '22023';
  end if;

  if nullif(trim(message_value), '') is null then
    raise exception 'alert message required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.encounters encounter
    where encounter.id = target_encounter_id
      and encounter.tenant_id = target_tenant_id
      and encounter.status not in ('completed', 'cancelled')
  ) then
    raise exception 'encounter unavailable' using errcode = 'P0002';
  end if;

  insert into public.clinical_alerts (
    tenant_id, encounter_id, source_type, severity, message, created_by
  )
  values (
    target_tenant_id,
    target_encounter_id,
    source_type_value,
    severity_value,
    trim(message_value),
    auth.uid()
  )
  returning id into alert_id;

  perform public.append_audit_log(
    target_tenant_id,
    'clinical.alert.created',
    'clinical_alert',
    alert_id,
    audit_request_id,
    jsonb_build_object(
      'encounterId', target_encounter_id,
      'severity', severity_value,
      'sourceType', source_type_value
    )
  );

  return alert_id;
end;
$$;

create or replace function public.acknowledge_clinical_alert(
  target_tenant_id uuid,
  target_alert_id uuid,
  note_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  target_encounter_id uuid;
  ack_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  select alert.encounter_id into target_encounter_id
  from public.clinical_alerts alert
  where alert.id = target_alert_id
    and alert.tenant_id = target_tenant_id
  for update;

  if target_encounter_id is null then
    raise exception 'alert not found' using errcode = 'P0002';
  end if;

  if not (
    public.has_encounter_permission(target_encounter_id, 'triage.manage')
    or public.has_encounter_permission(target_encounter_id, 'consultations.manage')
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  insert into public.clinical_alert_acknowledgements (
    tenant_id, alert_id, acknowledged_by, note
  )
  values (
    target_tenant_id,
    target_alert_id,
    auth.uid(),
    nullif(trim(note_value), '')
  )
  on conflict (tenant_id, alert_id, acknowledged_by) do update
    set note = excluded.note
  returning id into ack_id;

  update public.clinical_alerts
  set status = 'acknowledged'
  where id = target_alert_id
    and tenant_id = target_tenant_id
    and status = 'open';

  perform public.append_audit_log(
    target_tenant_id,
    'clinical.alert.acknowledged',
    'clinical_alert',
    target_alert_id,
    audit_request_id,
    jsonb_build_object('acknowledgementId', ack_id)
  );

  return ack_id;
end;
$$;

create or replace function public.create_consultation_addendum(
  target_tenant_id uuid,
  target_consultation_id uuid,
  note_value text,
  reason_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  target_encounter_id uuid;
  consultation_status text;
  addendum_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  select consultation.encounter_id, consultation.status
    into target_encounter_id, consultation_status
  from public.medical_consultations consultation
  where consultation.id = target_consultation_id
    and consultation.tenant_id = target_tenant_id
  for update;

  if target_encounter_id is null then
    raise exception 'consultation not found' using errcode = 'P0002';
  end if;

  if not public.has_encounter_permission(target_encounter_id, 'consultations.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if consultation_status not in ('closed', 'reopened') then
    raise exception 'addendum requires closed consultation' using errcode = '22023';
  end if;

  if nullif(trim(note_value), '') is null or char_length(trim(reason_value)) < 3 then
    raise exception 'addendum note and reason required' using errcode = '22023';
  end if;

  insert into public.medical_consultation_addenda (
    tenant_id, consultation_id, note, reason, created_by
  )
  values (
    target_tenant_id,
    target_consultation_id,
    trim(note_value),
    trim(reason_value),
    auth.uid()
  )
  returning id into addendum_id;

  perform public.append_audit_log(
    target_tenant_id,
    'clinical.consultation.addendum',
    'medical_consultation_addendum',
    addendum_id,
    audit_request_id,
    jsonb_build_object('consultationId', target_consultation_id)
  );

  return addendum_id;
end;
$$;

create or replace function public.pause_encounter_flow(
  target_tenant_id uuid,
  target_encounter_id uuid,
  reason_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  pause_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not (
    public.has_encounter_permission(target_encounter_id, 'triage.manage')
    or public.has_encounter_permission(target_encounter_id, 'consultations.manage')
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if char_length(trim(reason_value)) < 3 then
    raise exception 'pause reason required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.encounters encounter
    where encounter.id = target_encounter_id
      and encounter.tenant_id = target_tenant_id
      and encounter.status not in ('completed', 'cancelled')
  ) then
    raise exception 'encounter unavailable' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.encounter_flow_pauses pause
    where pause.tenant_id = target_tenant_id
      and pause.encounter_id = target_encounter_id
      and pause.status = 'active'
  ) then
    raise exception 'encounter already paused' using errcode = '22023';
  end if;

  insert into public.encounter_flow_pauses (
    tenant_id, encounter_id, reason, created_by
  )
  values (
    target_tenant_id,
    target_encounter_id,
    trim(reason_value),
    auth.uid()
  )
  returning id into pause_id;

  perform public.append_audit_log(
    target_tenant_id,
    'clinical.flow.paused',
    'encounter_flow_pause',
    pause_id,
    audit_request_id,
    jsonb_build_object('encounterId', target_encounter_id)
  );

  return pause_id;
end;
$$;

create or replace function public.resolve_encounter_flow_pause(
  target_tenant_id uuid,
  target_pause_id uuid,
  resolved_note_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  target_encounter_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  select pause.encounter_id into target_encounter_id
  from public.encounter_flow_pauses pause
  where pause.id = target_pause_id
    and pause.tenant_id = target_tenant_id
    and pause.status = 'active'
  for update;

  if target_encounter_id is null then
    raise exception 'active pause not found' using errcode = 'P0002';
  end if;

  if not (
    public.has_encounter_permission(target_encounter_id, 'triage.manage')
    or public.has_encounter_permission(target_encounter_id, 'consultations.manage')
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  update public.encounter_flow_pauses
  set
    status = 'resolved',
    resolved_note = nullif(trim(resolved_note_value), ''),
    resolved_by = auth.uid(),
    resolved_at = now()
  where id = target_pause_id
    and tenant_id = target_tenant_id;

  perform public.append_audit_log(
    target_tenant_id,
    'clinical.flow.resumed',
    'encounter_flow_pause',
    target_pause_id,
    audit_request_id,
    jsonb_build_object('encounterId', target_encounter_id)
  );

  return target_pause_id;
end;
$$;

revoke all on function public.create_clinical_alert(uuid, uuid, text, text, text, text) from public;
revoke all on function public.acknowledge_clinical_alert(uuid, uuid, text, text) from public;
revoke all on function public.create_consultation_addendum(uuid, uuid, text, text, text) from public;
revoke all on function public.pause_encounter_flow(uuid, uuid, text, text) from public;
revoke all on function public.resolve_encounter_flow_pause(uuid, uuid, text, text) from public;

grant execute on function public.create_clinical_alert(uuid, uuid, text, text, text, text) to authenticated;
grant execute on function public.acknowledge_clinical_alert(uuid, uuid, text, text) to authenticated;
grant execute on function public.create_consultation_addendum(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.pause_encounter_flow(uuid, uuid, text, text) to authenticated;
grant execute on function public.resolve_encounter_flow_pause(uuid, uuid, text, text) to authenticated;
