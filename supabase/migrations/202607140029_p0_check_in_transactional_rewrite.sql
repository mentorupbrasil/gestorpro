-- P0: reescreve check_in_appointment — AAL2, unidade, idempotência estável,
-- protocolo/PCMSO/vínculo, snapshot imutável, etapas específicas, um ticket
-- inicial (recepção), outbox + auditoria, rollback total em falha.

begin;

alter table public.encounter_steps
  drop constraint if exists encounter_steps_step_type_check;

alter table public.encounter_steps
  add constraint encounter_steps_step_type_check check (step_type in (
    'reception',
    'triage',
    'visual_acuity',
    'audiometry',
    'spirometry',
    'laboratory',
    'ecg',
    'eeg',
    'radiology',
    'psychosocial',
    'exam',
    'consultation',
    'conclusion',
    'document',
    'delivery',
    'billing'
  ));

create or replace function public.map_exam_result_type_to_step(result_type_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case result_type_value
    when 'audiometry' then 'audiometry'
    when 'spirometry' then 'spirometry'
    when 'laboratory' then 'laboratory'
    when 'imaging' then 'radiology'
    when 'clinical' then 'exam'
    else 'exam'
  end;
$$;

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
  expected_key text := 'checkin:appointment:' || target_appointment_id::text;
  existing_response jsonb;
  appointment_record record;
  worker_record record;
  contract_record record;
  pcmso_count int;
  protocol_count int;
  pcmso_version_id uuid;
  protocol_id uuid;
  protocol_rule_version int;
  new_encounter_id uuid;
  new_snapshot_id uuid;
  reception_step_id uuid;
  triage_step_id uuid;
  previous_step_id uuid;
  new_step_id uuid;
  exam_row record;
  exam_count int := 0;
  override_count int := 0;
  reception_queue_id uuid;
  sequence_no int := 1;
  snapshot_payload jsonb;
  overrides jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.is_active_tenant_member(target_tenant_id) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if nullif(trim(idempotency_key_value), '') is distinct from expected_key then
    raise exception 'idempotency key must be checkin:appointment:<appointment_id>'
      using errcode = '22023';
  end if;

  select response_reference into existing_response
  from public.idempotency_keys
  where tenant_id = target_tenant_id
    and scope = 'check-in'
    and key = expected_key
  for update;

  if existing_response ? 'encounterId' then
    return (existing_response ->> 'encounterId')::uuid;
  end if;

  select
    appointment.id,
    appointment.clinic_unit_id,
    appointment.status,
    appointment.referral_id,
    appointment.resource_id,
    appointment.starts_at,
    appointment.ends_at,
    referral.worker_id,
    referral.company_id,
    referral.occupational_exam_type,
    coalesce(referral.exam_preview, '[]'::jsonb) as exam_preview,
    referral.status as referral_status
  into appointment_record
  from public.appointments appointment
  left join public.referrals referral
    on referral.id = appointment.referral_id
   and referral.tenant_id = appointment.tenant_id
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

  -- Agendamento ocupacional exige encaminhamento + trabalhador válidos
  if appointment_record.referral_id is null
     or appointment_record.worker_id is null
     or appointment_record.company_id is null then
    raise exception 'occupational check-in requires valid referral and worker'
      using errcode = '22023';
  end if;

  if appointment_record.referral_status in ('cancelled', 'draft') then
    raise exception 'referral is not eligible for check-in' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.encounters encounter
    where encounter.tenant_id = target_tenant_id
      and encounter.appointment_id = appointment_record.id
      and encounter.status in ('checked_in', 'in_progress', 'waiting')
  ) then
    raise exception 'active encounter already exists for appointment' using errcode = '23P01';
  end if;

  if exists (
    select 1
    from public.encounters encounter
    where encounter.tenant_id = target_tenant_id
      and encounter.worker_id = appointment_record.worker_id
      and encounter.clinic_unit_id = appointment_record.clinic_unit_id
      and encounter.status in ('checked_in', 'in_progress', 'waiting')
      and encounter.appointment_id is distinct from appointment_record.id
  ) then
    raise exception 'worker already has an active encounter in this unit'
      using errcode = '23P01';
  end if;

  select worker.id, worker.status, worker.full_name, worker.version
    into worker_record
  from public.workers worker
  where worker.id = appointment_record.worker_id
    and worker.tenant_id = target_tenant_id
  for share;

  if worker_record.id is null then
    raise exception 'worker not found' using errcode = 'P0002';
  end if;

  if worker_record.status <> 'active' then
    raise exception 'worker is not active' using errcode = '22023';
  end if;

  select
    contract.id,
    contract.sector_id,
    contract.job_position_id,
    contract.exposure_group_id,
    contract.status,
    contract.version,
    sector.name as sector_name,
    job.name as job_position_name,
    ghe.name as exposure_group_name
  into contract_record
  from public.employment_contracts contract
  left join public.sectors sector
    on sector.id = contract.sector_id and sector.tenant_id = contract.tenant_id
  left join public.job_positions job
    on job.id = contract.job_position_id and job.tenant_id = contract.tenant_id
  left join public.exposure_groups ghe
    on ghe.id = contract.exposure_group_id and ghe.tenant_id = contract.tenant_id
  where contract.tenant_id = target_tenant_id
    and contract.worker_id = appointment_record.worker_id
    and contract.company_id = appointment_record.company_id
    and contract.status = 'active'
    and contract.starts_on <= current_date
    and (contract.ends_on is null or contract.ends_on > current_date)
  order by contract.starts_on desc
  limit 2;

  get diagnostics override_count = row_count;
  -- re-count active contracts for ambiguity
  select count(*)::int into override_count
  from public.employment_contracts contract
  where contract.tenant_id = target_tenant_id
    and contract.worker_id = appointment_record.worker_id
    and contract.company_id = appointment_record.company_id
    and contract.status = 'active'
    and contract.starts_on <= current_date
    and (contract.ends_on is null or contract.ends_on > current_date);

  if override_count = 0 then
    raise exception 'active employment contract missing' using errcode = '22023';
  end if;

  if override_count > 1 then
    raise exception 'ambiguous active employment contracts' using errcode = '22023';
  end if;

  select count(*)::int into pcmso_count
  from public.pcmso_versions pcmso
  where pcmso.tenant_id = target_tenant_id
    and pcmso.company_id = appointment_record.company_id
    and pcmso.status = 'approved'
    and pcmso.valid_from <= current_date
    and (pcmso.valid_until is null or pcmso.valid_until > current_date);

  if pcmso_count = 0 then
    raise exception 'approved PCMSO version missing for company' using errcode = '22023';
  end if;

  if pcmso_count > 1 then
    raise exception 'ambiguous approved PCMSO versions for company' using errcode = '22023';
  end if;

  select pcmso.id into pcmso_version_id
  from public.pcmso_versions pcmso
  where pcmso.tenant_id = target_tenant_id
    and pcmso.company_id = appointment_record.company_id
    and pcmso.status = 'approved'
    and pcmso.valid_from <= current_date
    and (pcmso.valid_until is null or pcmso.valid_until > current_date)
  limit 1;

  select count(*)::int into protocol_count
  from public.exam_protocols protocol
  where protocol.tenant_id = target_tenant_id
    and protocol.pcmso_version_id = pcmso_version_id
    and protocol.occupational_exam_type = appointment_record.occupational_exam_type
    and protocol.status = 'approved';

  if protocol_count = 0 then
    raise exception 'approved exam protocol missing for occupational type'
      using errcode = '22023';
  end if;

  if protocol_count > 1 then
    raise exception 'ambiguous approved exam protocols for occupational type'
      using errcode = '22023';
  end if;

  select protocol.id, protocol.rule_version
    into protocol_id, protocol_rule_version
  from public.exam_protocols protocol
  where protocol.tenant_id = target_tenant_id
    and protocol.pcmso_version_id = pcmso_version_id
    and protocol.occupational_exam_type = appointment_record.occupational_exam_type
    and protocol.status = 'approved'
  limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', override.id,
    'examCatalogId', override.exam_catalog_id,
    'action', override.action,
    'justification', override.justification
  ) order by override.created_at), '[]'::jsonb)
    into overrides
  from public.exam_protocol_overrides override
  where override.tenant_id = target_tenant_id
    and (
      override.worker_id = appointment_record.worker_id
      or override.employment_contract_id = contract_record.id
    );

  insert into public.idempotency_keys (tenant_id, scope, key, request_hash, expires_at)
  values (
    target_tenant_id,
    'check-in',
    expected_key,
    coalesce(nullif(trim(audit_request_id), ''), expected_key),
    now() + interval '1 day'
  )
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

  snapshot_payload := jsonb_build_object(
    'schema', 'encounter_checkin_snapshot/v2',
    'checkedInAt', now(),
    'appointment', jsonb_build_object(
      'id', appointment_record.id,
      'resourceId', appointment_record.resource_id,
      'startsAt', appointment_record.starts_at,
      'endsAt', appointment_record.ends_at
    ),
    'referral', jsonb_build_object(
      'id', appointment_record.referral_id,
      'companyId', appointment_record.company_id,
      'occupationalExamType', appointment_record.occupational_exam_type,
      'examPreview', appointment_record.exam_preview
    ),
    'worker', jsonb_build_object(
      'id', worker_record.id,
      'fullName', worker_record.full_name,
      'version', worker_record.version
    ),
    'employmentContract', jsonb_build_object(
      'id', contract_record.id,
      'version', contract_record.version,
      'sectorId', contract_record.sector_id,
      'sectorName', contract_record.sector_name,
      'jobPositionId', contract_record.job_position_id,
      'jobPositionName', contract_record.job_position_name,
      'exposureGroupId', contract_record.exposure_group_id,
      'exposureGroupName', contract_record.exposure_group_name
    ),
    'pcmsoVersionId', pcmso_version_id,
    'protocol', jsonb_build_object(
      'id', protocol_id,
      'ruleVersion', protocol_rule_version
    ),
    'overrides', overrides,
    'risks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', risk.id,
        'code', risk.code,
        'name', risk.name,
        'riskType', risk.risk_type
      ) order by risk.code)
      from public.risk_assignments assignment
      join public.occupational_risks risk
        on risk.id = assignment.occupational_risk_id
       and risk.tenant_id = assignment.tenant_id
      where assignment.tenant_id = target_tenant_id
        and assignment.company_id = appointment_record.company_id
        and (
          assignment.job_position_id = contract_record.job_position_id
          or assignment.exposure_group_id = contract_record.exposure_group_id
        )
        and assignment.starts_on <= current_date
        and (assignment.ends_on is null or assignment.ends_on > current_date)
    ), '[]'::jsonb)
  );

  insert into public.encounter_snapshots (
    tenant_id, encounter_id, schema_version, payload, content_hash
  )
  values (
    target_tenant_id,
    new_encounter_id,
    2,
    snapshot_payload,
    encode(digest(snapshot_payload::text, 'sha256'), 'hex')
  )
  returning id into new_snapshot_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence
  )
  values (target_tenant_id, new_encounter_id, 'reception', 'available', sequence_no)
  returning id into reception_step_id;

  sequence_no := sequence_no + 1;
  previous_step_id := reception_step_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
  )
  values (
    target_tenant_id, new_encounter_id, 'triage', 'blocked', sequence_no, previous_step_id
  )
  returning id into triage_step_id;

  sequence_no := sequence_no + 1;
  previous_step_id := triage_step_id;

  for exam_row in
    select
      item.id as referral_item_id,
      item.exam_catalog_id,
      item.source,
      catalog.code as exam_code,
      catalog.name as exam_name,
      catalog.result_type,
      public.map_exam_result_type_to_step(catalog.result_type) as step_type
    from public.referral_items item
    join public.exam_catalog catalog
      on catalog.id = item.exam_catalog_id
     and catalog.tenant_id = item.tenant_id
    where item.tenant_id = target_tenant_id
      and item.referral_id = appointment_record.referral_id
      and item.status <> 'cancelled'
      and item.exam_catalog_id is not null
    order by catalog.code
  loop
    insert into public.exam_orders (
      tenant_id, encounter_id, exam_catalog_id, protocol_snapshot
    )
    values (
      target_tenant_id,
      new_encounter_id,
      exam_row.exam_catalog_id,
      jsonb_build_object(
        'source', exam_row.source,
        'referralItemId', exam_row.referral_item_id,
        'examCode', exam_row.exam_code,
        'examName', exam_row.exam_name,
        'protocolId', protocol_id,
        'pcmsoVersionId', pcmso_version_id
      )
    );

    insert into public.encounter_steps (
      tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
    )
    values (
      target_tenant_id,
      new_encounter_id,
      exam_row.step_type,
      'blocked',
      sequence_no,
      previous_step_id
    )
    returning id into new_step_id;

    exam_count := exam_count + 1;
    sequence_no := sequence_no + 1;
    previous_step_id := new_step_id;
  end loop;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
  )
  values (
    target_tenant_id, new_encounter_id, 'consultation', 'blocked', sequence_no, previous_step_id
  )
  returning id into new_step_id;

  sequence_no := sequence_no + 1;
  previous_step_id := new_step_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
  )
  values (
    target_tenant_id, new_encounter_id, 'conclusion', 'blocked', sequence_no, previous_step_id
  )
  returning id into new_step_id;

  sequence_no := sequence_no + 1;
  previous_step_id := new_step_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
  )
  values (
    target_tenant_id, new_encounter_id, 'document', 'blocked', sequence_no, previous_step_id
  )
  returning id into new_step_id;

  sequence_no := sequence_no + 1;
  previous_step_id := new_step_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
  )
  values (
    target_tenant_id, new_encounter_id, 'billing', 'blocked', sequence_no, previous_step_id
  );

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

  -- Apenas o primeiro ticket (recepção). Próximas filas nascem na transição.
  insert into public.queue_tickets (
    tenant_id, queue_definition_id, encounter_id, encounter_step_id
  )
  values (
    target_tenant_id, reception_queue_id, new_encounter_id, reception_step_id
  );

  insert into public.encounter_events (
    tenant_id, encounter_id, event_type, created_by, payload
  )
  values (
    target_tenant_id,
    new_encounter_id,
    'checked_in',
    auth.uid(),
    jsonb_build_object(
      'examCount', exam_count,
      'snapshotId', new_snapshot_id,
      'protocolId', protocol_id
    )
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
  where id = appointment_record.id
    and tenant_id = target_tenant_id;

  update public.referrals
  set status = 'scheduled', updated_at = now()
  where id = appointment_record.referral_id
    and tenant_id = target_tenant_id;

  update public.idempotency_keys
  set response_reference = jsonb_build_object(
    'encounterId', new_encounter_id,
    'examCount', exam_count,
    'snapshotId', new_snapshot_id
  )
  where tenant_id = target_tenant_id
    and scope = 'check-in'
    and key = expected_key;

  perform public.append_audit_log(
    target_tenant_id,
    'encounter.checked_in',
    'encounter',
    new_encounter_id,
    audit_request_id,
    jsonb_build_object(
      'appointmentId', appointment_record.id,
      'examCount', exam_count,
      'protocolId', protocol_id,
      'pcmsoVersionId', pcmso_version_id
    )
  );

  return new_encounter_id;
end;
$$;

revoke all on function public.map_exam_result_type_to_step(text) from public, anon, authenticated;
revoke all on function public.check_in_appointment(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.check_in_appointment(uuid, uuid, text, text) to authenticated;

commit;
