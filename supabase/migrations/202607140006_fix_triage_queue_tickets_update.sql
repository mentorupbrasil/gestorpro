begin;

-- queue_tickets não possui updated_at (somente created_at).
-- Reaplica o trecho crítico das RPCs operacionais sem a coluna inválida.

create or replace function public.save_triage_record(
  target_tenant_id uuid,
  target_encounter_id uuid,
  target_form_version_id uuid,
  payload_value jsonb,
  close_record boolean,
  change_reason text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  record_id uuid;
  next_version int;
  existing_status text;
  encounter_status text;
  triage_step_id uuid;
  enriched_payload jsonb;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_encounter_permission(target_encounter_id, 'triage.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select encounter.status
    into encounter_status
  from public.encounters encounter
  where encounter.id = target_encounter_id
    and encounter.tenant_id = target_tenant_id
  for update;

  if encounter_status is null then
    raise exception 'encounter not found' using errcode = '22023';
  end if;

  if encounter_status in ('completed', 'cancelled') then
    raise exception 'encounter closed' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.triage_form_versions form_version
    where form_version.id = target_form_version_id
      and form_version.tenant_id = target_tenant_id
      and form_version.status = 'approved'
  ) then
    raise exception 'form version unavailable' using errcode = '22023';
  end if;

  enriched_payload := public.enrich_triage_payload(payload_value);

  if enriched_payload = '{}'::jsonb or enriched_payload is null then
    raise exception 'payload required' using errcode = '22023';
  end if;

  select id, current_version + 1, status
    into record_id, next_version, existing_status
  from public.triage_records
  where tenant_id = target_tenant_id
    and encounter_id = target_encounter_id
  for update;

  if close_record and existing_status = 'closed' then
    raise exception 'triage already closed' using errcode = '22023';
  end if;

  if record_id is null then
    insert into public.triage_records (
      tenant_id,
      encounter_id,
      form_version_id,
      status,
      closed_at,
      closed_by,
      created_by
    )
    values (
      target_tenant_id,
      target_encounter_id,
      target_form_version_id,
      case when close_record then 'closed' else 'draft' end,
      case when close_record then now() else null end,
      case when close_record then auth.uid() else null end,
      auth.uid()
    )
    returning id, current_version into record_id, next_version;
  else
    update public.triage_records
      set current_version = next_version,
          form_version_id = target_form_version_id,
          status = case
            when close_record then 'closed'
            when existing_status = 'closed' then 'reopened'
            else 'draft'
          end,
          closed_at = case when close_record then now() else null end,
          closed_by = case when close_record then auth.uid() else null end,
          updated_at = now()
    where id = record_id
      and tenant_id = target_tenant_id;
  end if;

  insert into public.triage_record_versions (
    tenant_id,
    triage_record_id,
    version,
    payload,
    reason,
    created_by
  )
  values (
    target_tenant_id,
    record_id,
    coalesce(next_version, 1),
    enriched_payload,
    nullif(trim(change_reason), ''),
    auth.uid()
  );

  update public.encounter_steps
    set status = 'in_progress',
        updated_at = now()
  where tenant_id = target_tenant_id
    and encounter_id = target_encounter_id
    and step_type = 'triage'
    and status = 'available'
  returning id into triage_step_id;

  if close_record then
    update public.encounter_steps
      set status = 'completed',
          updated_at = now()
    where tenant_id = target_tenant_id
      and encounter_id = target_encounter_id
      and step_type = 'triage'
      and status in ('available', 'in_progress', 'pending');

    update public.encounter_steps
      set status = 'available',
          updated_at = now()
    where tenant_id = target_tenant_id
      and encounter_id = target_encounter_id
      and step_type = 'consultation'
      and status = 'blocked';

    update public.encounter_steps
      set status = 'available',
          updated_at = now()
    where tenant_id = target_tenant_id
      and encounter_id = target_encounter_id
      and step_type = 'exam'
      and status = 'blocked';

    update public.queue_tickets ticket
      set status = 'done'
    from public.encounter_steps step
    where ticket.encounter_step_id = step.id
      and step.tenant_id = target_tenant_id
      and step.encounter_id = target_encounter_id
      and step.step_type = 'triage'
      and ticket.status in ('waiting', 'called', 'in_service');

    update public.encounters
      set status = 'in_progress',
          updated_at = now()
    where id = target_encounter_id
      and tenant_id = target_tenant_id
      and status in ('checked_in', 'waiting');

    insert into public.encounter_events (tenant_id, encounter_id, event_type, created_by, payload)
    values (
      target_tenant_id,
      target_encounter_id,
      'triage.completed',
      auth.uid(),
      jsonb_build_object('triageRecordId', record_id, 'version', coalesce(next_version, 1))
    );
  else
    insert into public.encounter_events (tenant_id, encounter_id, event_type, created_by, payload)
    values (
      target_tenant_id,
      target_encounter_id,
      case when existing_status is null then 'triage.started' else 'triage.saved' end,
      auth.uid(),
      jsonb_build_object('triageRecordId', record_id, 'version', coalesce(next_version, 1))
    );
  end if;

  perform public.log_audit(
    target_tenant_id,
    case when close_record then 'triage.completed' else 'triage.saved' end,
    'triage_records',
    record_id,
    audit_request_id,
    jsonb_build_object('closed', close_record, 'version', coalesce(next_version, 1))
  );

  return record_id;
end;
$$;

grant execute on function public.save_triage_record(uuid, uuid, uuid, jsonb, boolean, text, text) to authenticated;

commit;


create or replace function public.save_medical_consultation(
  target_tenant_id uuid,
  target_encounter_id uuid,
  physician_credential_id_value uuid,
  subjective_value jsonb,
  objective_value jsonb,
  assessment_value text,
  plan_value text,
  close_record boolean,
  change_reason text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  consultation_id uuid;
  next_version int;
  existing_status text;
  encounter_status text;
  credential_record record;
  pending_exams bigint;
  next_sequence int;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_encounter_permission(target_encounter_id, 'consultations.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select encounter.status
    into encounter_status
  from public.encounters encounter
  where encounter.id = target_encounter_id
    and encounter.tenant_id = target_tenant_id
  for update;

  if encounter_status is null then
    raise exception 'encounter not found' using errcode = '22023';
  end if;

  if encounter_status in ('completed', 'cancelled') then
    raise exception 'encounter closed' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.triage_records triage
    where triage.tenant_id = target_tenant_id
      and triage.encounter_id = target_encounter_id
      and triage.status = 'closed'
  ) then
    raise exception 'triage not completed' using errcode = '22023';
  end if;

  select *
    into credential_record
  from public.clinical_professional_credentials
  where id = physician_credential_id_value
    and tenant_id = target_tenant_id
    and user_id = auth.uid()
    and professional_role = 'physician'
    and status = 'active';

  if credential_record.id is null then
    raise exception 'physician credential missing' using errcode = '42501';
  end if;

  if credential_record.council_code is null
    or credential_record.council_region is null
    or credential_record.registration_number is null then
    raise exception 'professional registration missing' using errcode = '22023';
  end if;

  if coalesce(subjective_value, '{}'::jsonb) = '{}'::jsonb
    and coalesce(objective_value, '{}'::jsonb) = '{}'::jsonb
    and nullif(trim(assessment_value), '') is null
    and nullif(trim(plan_value), '') is null then
    raise exception 'payload required' using errcode = '22023';
  end if;

  select id, current_version + 1, status
    into consultation_id, next_version, existing_status
  from public.medical_consultations
  where tenant_id = target_tenant_id
    and encounter_id = target_encounter_id
  for update;

  if close_record and existing_status = 'closed' then
    raise exception 'consultation already closed' using errcode = '22023';
  end if;

  if consultation_id is null then
    insert into public.medical_consultations (
      tenant_id,
      encounter_id,
      physician_credential_id,
      status,
      closed_at,
      closed_by
    )
    values (
      target_tenant_id,
      target_encounter_id,
      physician_credential_id_value,
      case when close_record then 'closed' else 'draft' end,
      case when close_record then now() else null end,
      case when close_record then auth.uid() else null end
    )
    returning id, current_version into consultation_id, next_version;
  else
    update public.medical_consultations
      set current_version = next_version,
          physician_credential_id = physician_credential_id_value,
          status = case
            when close_record then 'closed'
            when existing_status = 'closed' then 'reopened'
            else 'draft'
          end,
          closed_at = case when close_record then now() else null end,
          closed_by = case when close_record then auth.uid() else null end,
          updated_at = now()
    where id = consultation_id
      and tenant_id = target_tenant_id;
  end if;

  insert into public.medical_consultation_versions (
    tenant_id,
    consultation_id,
    version,
    subjective,
    objective,
    assessment,
    plan,
    reason,
    created_by
  )
  values (
    target_tenant_id,
    consultation_id,
    coalesce(next_version, 1),
    coalesce(subjective_value, '{}'::jsonb),
    coalesce(objective_value, '{}'::jsonb),
    nullif(trim(assessment_value), ''),
    nullif(trim(plan_value), ''),
    nullif(trim(change_reason), ''),
    auth.uid()
  );

  update public.encounter_steps
    set status = 'in_progress',
        updated_at = now()
  where tenant_id = target_tenant_id
    and encounter_id = target_encounter_id
    and step_type = 'consultation'
    and status = 'available';

  if close_record then
    update public.encounter_steps
      set status = 'completed',
          updated_at = now()
    where tenant_id = target_tenant_id
      and encounter_id = target_encounter_id
      and step_type = 'consultation'
      and status in ('available', 'in_progress', 'pending');

    select count(*) into pending_exams
    from public.exam_orders order_row
    where order_row.tenant_id = target_tenant_id
      and order_row.encounter_id = target_encounter_id
      and order_row.status not in ('resulted', 'cancelled');

    if pending_exams > 0 then
      update public.encounter_steps
        set status = 'available',
            updated_at = now()
      where tenant_id = target_tenant_id
        and encounter_id = target_encounter_id
        and step_type = 'exam'
        and status in ('blocked', 'pending');

      if not exists (
        select 1
        from public.encounter_steps step_row
        where step_row.tenant_id = target_tenant_id
          and step_row.encounter_id = target_encounter_id
          and step_row.step_type = 'exam'
      ) then
        select coalesce(max(sequence), 0) + 1
          into next_sequence
        from public.encounter_steps
        where tenant_id = target_tenant_id
          and encounter_id = target_encounter_id;

        insert into public.encounter_steps (tenant_id, encounter_id, step_type, status, sequence)
        values (target_tenant_id, target_encounter_id, 'exam', 'available', next_sequence);
      end if;
    else
      update public.encounter_steps
        set status = 'available',
            updated_at = now()
      where tenant_id = target_tenant_id
        and encounter_id = target_encounter_id
        and step_type = 'document'
        and status in ('blocked', 'pending');

      if not exists (
        select 1
        from public.encounter_steps step_row
        where step_row.tenant_id = target_tenant_id
          and step_row.encounter_id = target_encounter_id
          and step_row.step_type = 'document'
      ) then
        select coalesce(max(sequence), 0) + 1
          into next_sequence
        from public.encounter_steps
        where tenant_id = target_tenant_id
          and encounter_id = target_encounter_id;

        insert into public.encounter_steps (tenant_id, encounter_id, step_type, status, sequence)
        values (target_tenant_id, target_encounter_id, 'document', 'available', next_sequence);
      end if;
    end if;

    update public.queue_tickets ticket
      set status = 'done'
    from public.encounter_steps step
    where ticket.encounter_step_id = step.id
      and step.tenant_id = target_tenant_id
      and step.encounter_id = target_encounter_id
      and step.step_type = 'consultation'
      and ticket.status in ('waiting', 'called', 'in_service');

    insert into public.encounter_events (tenant_id, encounter_id, event_type, created_by, payload)
    values (
      target_tenant_id,
      target_encounter_id,
      'consultation.completed',
      auth.uid(),
      jsonb_build_object('consultationId', consultation_id, 'version', coalesce(next_version, 1))
    );
  else
    insert into public.encounter_events (tenant_id, encounter_id, event_type, created_by, payload)
    values (
      target_tenant_id,
      target_encounter_id,
      case when existing_status is null then 'consultation.started' else 'consultation.saved' end,
      auth.uid(),
      jsonb_build_object('consultationId', consultation_id, 'version', coalesce(next_version, 1))
    );
  end if;

  perform public.log_audit(
    target_tenant_id,
    case when close_record then 'consultation.completed' else 'consultation.saved' end,
    'medical_consultations',
    consultation_id,
    audit_request_id,
    jsonb_build_object('closed', close_record, 'version', coalesce(next_version, 1))
  );

  return consultation_id;
end;
$$;

grant execute on function public.save_medical_consultation(
  uuid, uuid, uuid, jsonb, jsonb, text, text, boolean, text, text
) to authenticated;

commit;
