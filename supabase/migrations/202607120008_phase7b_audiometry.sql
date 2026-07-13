begin;

create table public.audiometry_calibrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  equipment_serial text not null,
  equipment_name text not null,
  calibrated_at date not null,
  valid_until date not null,
  certificate_reference text,
  status text not null default 'valid' check (status in ('valid', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  constraint audiometry_calibrations_serial_valid_uq unique (tenant_id, equipment_serial, valid_until),
  constraint audiometry_calibrations_period_ck check (valid_until >= calibrated_at)
);

create table public.audiometry_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  exam_order_id uuid not null references public.exam_orders(id) on delete restrict,
  calibration_id uuid references public.audiometry_calibrations(id) on delete restrict,
  status text not null default 'in_progress' check (
    status in ('in_progress', 'completed', 'inconclusive', 'repeated', 'cancelled')
  ),
  current_version int not null default 1 check (current_version > 0),
  started_by uuid not null references public.user_profiles(id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_by uuid references public.user_profiles(id) on delete restrict,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audiometry_results_order_uq unique (tenant_id, exam_order_id)
);

create table public.audiometry_result_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  audiometry_result_id uuid not null references public.audiometry_results(id) on delete restrict,
  version int not null check (version > 0),
  occupational_data jsonb not null,
  rest_reported jsonb not null,
  complaints jsonb not null default '[]'::jsonb,
  otoscopy jsonb not null default '{}'::jsonb,
  thresholds jsonb not null,
  masking jsonb not null default '{}'::jsonb,
  equipment jsonb not null,
  booth jsonb not null,
  comparison jsonb not null default '{}'::jsonb,
  report text,
  professional_conclusion text not null,
  original_import_payload jsonb,
  normalized_payload jsonb not null default '{}'::jsonb,
  correction_reason text not null,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint audiometry_versions_result_version_uq unique (
    tenant_id,
    audiometry_result_id,
    version
  )
);

create or replace function public.start_audiometry_exam(
  target_tenant_id uuid,
  target_exam_order_id uuid,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  order_record record;
  result_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'exams.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select exam_order.*
    into order_record
  from public.exam_orders exam_order
  where exam_order.id = target_exam_order_id
    and exam_order.tenant_id = target_tenant_id
  for update;

  if order_record.id is null then
    raise exception 'exam order not found' using errcode = 'P0002';
  end if;

  if order_record.status not in ('ordered', 'collected') then
    raise exception 'exam order cannot be started' using errcode = '42501';
  end if;

  insert into public.audiometry_results (
    tenant_id,
    encounter_id,
    exam_order_id,
    status,
    started_by
  )
  values (
    target_tenant_id,
    order_record.encounter_id,
    target_exam_order_id,
    'in_progress',
    auth.uid()
  )
  on conflict (tenant_id, exam_order_id) do update
    set status = case
          when public.audiometry_results.status in ('completed', 'inconclusive') then 'repeated'
          else 'in_progress'
        end,
        updated_at = now()
  returning id into result_id;

  update public.exam_orders
    set status = 'collected'
  where id = target_exam_order_id
    and tenant_id = target_tenant_id;

  insert into public.encounter_events (tenant_id, encounter_id, event_type, created_by, payload)
  values (
    target_tenant_id,
    order_record.encounter_id,
    'audiometry.started',
    auth.uid(),
    jsonb_build_object('examOrderId', target_exam_order_id, 'resultId', result_id)
  );

  perform public.log_audit(
    target_tenant_id,
    'audiometry.started',
    'audiometry_results',
    result_id,
    audit_request_id,
    jsonb_build_object('examOrderId', target_exam_order_id)
  );

  return result_id;
end;
$$;

create or replace function public.save_audiometry_result(
  target_tenant_id uuid,
  target_result_id uuid,
  calibration_id_value uuid,
  occupational_data_value jsonb,
  rest_reported_value jsonb,
  complaints_value jsonb,
  otoscopy_value jsonb,
  thresholds_value jsonb,
  masking_value jsonb,
  equipment_value jsonb,
  booth_value jsonb,
  comparison_value jsonb,
  report_value text,
  professional_conclusion_value text,
  original_import_payload_value jsonb,
  normalized_payload_value jsonb,
  correction_reason_value text,
  complete_result boolean,
  inconclusive_result boolean,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  result_record record;
  calibration_record record;
  next_version int;
  version_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'exams.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select *
    into result_record
  from public.audiometry_results
  where id = target_result_id
    and tenant_id = target_tenant_id
  for update;

  if result_record.id is null then
    raise exception 'audiometry result not found' using errcode = 'P0002';
  end if;

  select *
    into calibration_record
  from public.audiometry_calibrations
  where id = calibration_id_value
    and tenant_id = target_tenant_id;

  if complete_result and (
    calibration_record.id is null
    or calibration_record.status <> 'valid'
    or calibration_record.valid_until < current_date
  ) then
    raise exception 'valid audiometer calibration required' using errcode = '22023';
  end if;

  next_version := result_record.current_version;
  if exists (
    select 1
    from public.audiometry_result_versions version
    where version.tenant_id = target_tenant_id
      and version.audiometry_result_id = target_result_id
      and version.version = next_version
  ) then
    next_version := result_record.current_version + 1;
  end if;

  insert into public.audiometry_result_versions (
    tenant_id,
    audiometry_result_id,
    version,
    occupational_data,
    rest_reported,
    complaints,
    otoscopy,
    thresholds,
    masking,
    equipment,
    booth,
    comparison,
    report,
    professional_conclusion,
    original_import_payload,
    normalized_payload,
    correction_reason,
    created_by
  )
  values (
    target_tenant_id,
    target_result_id,
    next_version,
    occupational_data_value,
    rest_reported_value,
    coalesce(complaints_value, '[]'::jsonb),
    coalesce(otoscopy_value, '{}'::jsonb),
    thresholds_value,
    coalesce(masking_value, '{}'::jsonb),
    equipment_value,
    booth_value,
    coalesce(comparison_value, '{}'::jsonb),
    nullif(trim(report_value), ''),
    nullif(trim(professional_conclusion_value), ''),
    original_import_payload_value,
    coalesce(normalized_payload_value, '{}'::jsonb),
    nullif(trim(correction_reason_value), ''),
    auth.uid()
  )
  returning id into version_id;

  update public.audiometry_results
    set current_version = next_version,
        calibration_id = calibration_id_value,
        status = case
          when inconclusive_result then 'inconclusive'
          when complete_result then 'completed'
          else 'in_progress'
        end,
        completed_at = case when complete_result or inconclusive_result then now() else completed_at end,
        completed_by = case when complete_result or inconclusive_result then auth.uid() else completed_by end,
        updated_at = now()
  where id = target_result_id
    and tenant_id = target_tenant_id;

  if complete_result or inconclusive_result then
    update public.exam_orders
      set status = 'resulted'
    where id = result_record.exam_order_id
      and tenant_id = target_tenant_id;
  end if;

  insert into public.encounter_events (tenant_id, encounter_id, event_type, created_by, payload)
  values (
    target_tenant_id,
    result_record.encounter_id,
    case
      when inconclusive_result then 'audiometry.inconclusive'
      when complete_result then 'audiometry.completed'
      else 'audiometry.saved'
    end,
    auth.uid(),
    jsonb_build_object(
      'examOrderId',
      result_record.exam_order_id,
      'resultId',
      target_result_id,
      'versionId',
      version_id
    )
  );

  perform public.log_audit(
    target_tenant_id,
    case
      when inconclusive_result then 'audiometry.inconclusive'
      when complete_result then 'audiometry.completed'
      else 'audiometry.saved'
    end,
    'audiometry_results',
    target_result_id,
    audit_request_id,
    jsonb_build_object('version', next_version)
  );

  return version_id;
end;
$$;

alter table public.audiometry_calibrations enable row level security;
alter table public.audiometry_results enable row level security;
alter table public.audiometry_result_versions enable row level security;

create policy audiometry_calibrations_read on public.audiometry_calibrations
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy audiometry_calibrations_manage on public.audiometry_calibrations
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'exams.manage'))
  with check (public.has_tenant_permission(tenant_id, 'exams.manage'));
create policy audiometry_results_read on public.audiometry_results
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy audiometry_results_manage on public.audiometry_results
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'exams.manage'))
  with check (public.has_tenant_permission(tenant_id, 'exams.manage'));
create policy audiometry_versions_read on public.audiometry_result_versions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy audiometry_versions_insert on public.audiometry_result_versions
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'exams.manage') and created_by = auth.uid());

grant execute on function public.start_audiometry_exam(uuid, uuid, text) to authenticated;
grant execute on function public.save_audiometry_result(
  uuid,
  uuid,
  uuid,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  text,
  text,
  jsonb,
  jsonb,
  text,
  boolean,
  boolean,
  text
) to authenticated;

commit;
