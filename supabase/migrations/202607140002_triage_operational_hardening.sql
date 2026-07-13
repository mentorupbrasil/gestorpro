begin;

create or replace function public.enrich_triage_payload(payload_value jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  weight_value numeric;
  height_value numeric;
  bmi_value numeric;
begin
  weight_value := nullif(payload_value #>> '{anthropometry,weightKg}', '')::numeric;
  height_value := nullif(payload_value #>> '{anthropometry,heightCm}', '')::numeric;

  if weight_value is not null
    and height_value is not null
    and weight_value > 0
    and height_value > 0 then
    bmi_value := round((weight_value / power(height_value / 100.0, 2))::numeric, 1);
    payload_value := jsonb_set(
      coalesce(payload_value, '{}'::jsonb),
      '{anthropometry,bmi}',
      to_jsonb(bmi_value),
      true
    );
  end if;

  return coalesce(payload_value, '{}'::jsonb);
end;
$$;

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
      set status = 'done',
          updated_at = now()
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

grant execute on function public.enrich_triage_payload(jsonb) to authenticated;
grant execute on function public.save_triage_record(uuid, uuid, uuid, jsonb, boolean, text, text) to authenticated;

commit;
