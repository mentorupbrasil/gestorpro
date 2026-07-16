-- Fase F checkpoint: check-in reforçado — AAL2, unidade, etapas completas,
-- exam_orders do referral + filas recepção/triagem + snapshot com preview.

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
  referral_preview jsonb := '[]'::jsonb;
  new_encounter_id uuid;
  new_snapshot_id uuid;
  reception_step_id uuid;
  triage_step_id uuid;
  exam_step_id uuid;
  reception_queue_id uuid;
  triage_queue_id uuid;
  exam_count int := 0;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
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

  select
    appointment.id,
    appointment.clinic_unit_id,
    appointment.status,
    appointment.referral_id,
    referral.worker_id,
    coalesce(referral.exam_preview, '[]'::jsonb) as exam_preview
  into appointment_record
  from public.appointments appointment
  left join public.referrals referral on referral.id = appointment.referral_id
  where appointment.id = target_appointment_id
    and appointment.tenant_id = target_tenant_id
  for update of appointment;

  if appointment_record.id is null then
    raise exception 'appointment not found' using errcode = 'P0002';
  end if;

  if not public.has_unit_permission(appointment_record.clinic_unit_id, 'encounters.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if appointment_record.status not in ('scheduled', 'confirmed') then
    raise exception 'appointment cannot be checked in' using errcode = '42501';
  end if;

  if appointment_record.worker_id is null then
    raise exception 'appointment missing worker via referral' using errcode = '22023';
  end if;

  referral_preview := appointment_record.exam_preview;

  insert into public.idempotency_keys (tenant_id, scope, key, request_hash, expires_at)
  values (target_tenant_id, 'check-in', idempotency_key_value, audit_request_id, now() + interval '1 day')
  on conflict (tenant_id, scope, key) do nothing;

  insert into public.encounters (
    tenant_id, clinic_unit_id, worker_id, appointment_id, referral_id, status
  )
  values (
    target_tenant_id,
    appointment_record.clinic_unit_id,
    appointment_record.worker_id,
    appointment_record.id,
    appointment_record.referral_id,
    'checked_in'
  )
  returning id into new_encounter_id;

  insert into public.encounter_snapshots (
    tenant_id, encounter_id, schema_version, payload, content_hash
  )
  values (
    target_tenant_id,
    new_encounter_id,
    1,
    jsonb_build_object(
      'appointmentId', appointment_record.id,
      'checkedInAt', now(),
      'examPreview', referral_preview,
      'referralId', appointment_record.referral_id,
      'workerId', appointment_record.worker_id
    ),
    encode(
      digest(
        new_encounter_id::text || ':' || appointment_record.worker_id::text || ':' || coalesce(appointment_record.referral_id::text, ''),
        'sha256'
      ),
      'hex'
    )
  )
  returning id into new_snapshot_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence
  )
  values (target_tenant_id, new_encounter_id, 'reception', 'available', 1)
  returning id into reception_step_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
  )
  values (target_tenant_id, new_encounter_id, 'triage', 'blocked', 2, reception_step_id)
  returning id into triage_step_id;

  insert into public.exam_orders (tenant_id, encounter_id, exam_catalog_id, protocol_snapshot)
  select
    target_tenant_id,
    new_encounter_id,
    item.exam_catalog_id,
    jsonb_build_object('source', item.source)
  from public.referral_items item
  where item.tenant_id = target_tenant_id
    and item.referral_id = appointment_record.referral_id
    and item.status <> 'cancelled'
    and item.exam_catalog_id is not null;

  get diagnostics exam_count = row_count;

  if exam_count > 0 then
    insert into public.encounter_steps (
      tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
    )
    values (target_tenant_id, new_encounter_id, 'exam', 'blocked', 3, triage_step_id)
    returning id into exam_step_id;

    insert into public.encounter_steps (
      tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
    )
    values (
      target_tenant_id,
      new_encounter_id,
      'consultation',
      'blocked',
      4,
      exam_step_id
    );

    insert into public.encounter_steps (
      tenant_id, encounter_id, step_type, status, sequence
    )
    values (target_tenant_id, new_encounter_id, 'document', 'blocked', 5);
  else
    insert into public.encounter_steps (
      tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
    )
    values (
      target_tenant_id,
      new_encounter_id,
      'consultation',
      'blocked',
      3,
      triage_step_id
    );

    insert into public.encounter_steps (
      tenant_id, encounter_id, step_type, status, sequence
    )
    values (target_tenant_id, new_encounter_id, 'document', 'blocked', 4);
  end if;

  select id into reception_queue_id
  from public.queue_definitions
  where tenant_id = target_tenant_id
    and clinic_unit_id = appointment_record.clinic_unit_id
    and step_type = 'reception'
    and status = 'active'
  order by created_at
  limit 1;

  if reception_queue_id is null then
    insert into public.queue_definitions (
      tenant_id, clinic_unit_id, code, name, step_type
    )
    values (
      target_tenant_id,
      appointment_record.clinic_unit_id,
      'RECEPCAO',
      'Recepção',
      'reception'
    )
    returning id into reception_queue_id;
  end if;

  select id into triage_queue_id
  from public.queue_definitions
  where tenant_id = target_tenant_id
    and clinic_unit_id = appointment_record.clinic_unit_id
    and step_type = 'triage'
    and status = 'active'
  order by created_at
  limit 1;

  if triage_queue_id is null then
    insert into public.queue_definitions (
      tenant_id, clinic_unit_id, code, name, step_type
    )
    values (
      target_tenant_id,
      appointment_record.clinic_unit_id,
      'TRIAGEM',
      'Triagem',
      'triage'
    )
    returning id into triage_queue_id;
  end if;

  insert into public.queue_tickets (
    tenant_id, queue_definition_id, encounter_id, encounter_step_id
  )
  values (
    target_tenant_id, reception_queue_id, new_encounter_id, reception_step_id
  );

  insert into public.queue_tickets (
    tenant_id, queue_definition_id, encounter_id, encounter_step_id, status
  )
  values (
    target_tenant_id, triage_queue_id, new_encounter_id, triage_step_id, 'waiting'
  );

  insert into public.encounter_events (
    tenant_id, encounter_id, event_type, created_by, payload
  )
  values (
    target_tenant_id,
    new_encounter_id,
    'checked_in',
    auth.uid(),
    jsonb_build_object('examCount', exam_count, 'snapshotId', new_snapshot_id)
  );

  insert into public.outbox_events (
    tenant_id, aggregate_type, aggregate_id, event_type, payload_redacted
  )
  values (
    target_tenant_id,
    'encounter',
    new_encounter_id,
    'encounter.checked_in',
    jsonb_build_object(
      'clinicUnitId', appointment_record.clinic_unit_id,
      'examCount', exam_count
    )
  );

  update public.appointments
  set status = 'completed', updated_at = now()
  where id = appointment_record.id;

  if appointment_record.referral_id is not null then
    update public.referrals
    set status = 'scheduled', updated_at = now()
    where id = appointment_record.referral_id;
  end if;

  update public.idempotency_keys
  set response_reference = jsonb_build_object(
    'encounterId', new_encounter_id,
    'examCount', exam_count
  )
  where tenant_id = target_tenant_id
    and scope = 'check-in'
    and key = idempotency_key_value;

  perform public.append_audit_log(
    target_tenant_id,
    'encounter.checked_in',
    'encounter',
    new_encounter_id,
    audit_request_id,
    jsonb_build_object(
      'appointmentId', appointment_record.id,
      'examCount', exam_count
    )
  );

  return new_encounter_id;
end;
$$;

revoke all on function public.check_in_appointment(uuid, uuid, text, text) from public;
grant execute on function public.check_in_appointment(uuid, uuid, text, text) to authenticated;
