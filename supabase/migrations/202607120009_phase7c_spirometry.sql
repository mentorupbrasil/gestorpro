begin;

create table public.spirometry_predicted_value_sets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null,
  formula_metadata jsonb not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  constraint spirometry_predicted_sets_code_uq unique (tenant_id, code)
);

create table public.spirometry_calibrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  equipment_serial text not null,
  equipment_name text not null,
  verified_at timestamptz not null,
  valid_until timestamptz not null,
  verification_payload jsonb not null default '{}'::jsonb,
  status text not null default 'valid' check (status in ('valid', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  constraint spirometry_calibration_period_ck check (valid_until >= verified_at)
);

create table public.spirometry_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  exam_order_id uuid not null references public.exam_orders(id) on delete restrict,
  predicted_value_set_id uuid references public.spirometry_predicted_value_sets(id) on delete restrict,
  calibration_id uuid references public.spirometry_calibrations(id) on delete restrict,
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
  constraint spirometry_results_order_uq unique (tenant_id, exam_order_id)
);

create table public.spirometry_maneuvers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  spirometry_result_id uuid not null references public.spirometry_results(id) on delete restrict,
  attempt_number int not null check (attempt_number > 0),
  measured_values jsonb not null,
  predicted_values jsonb not null,
  percentages jsonb not null,
  curve_attachment_refs jsonb not null default '[]'::jsonb,
  quality_grade text not null check (quality_grade in ('A', 'B', 'C', 'D', 'E', 'F', 'unacceptable')),
  technical_notes text,
  accepted boolean not null default false,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint spirometry_maneuvers_attempt_uq unique (
    tenant_id,
    spirometry_result_id,
    attempt_number
  )
);

alter table public.spirometry_results
  add column accepted_maneuver_id uuid references public.spirometry_maneuvers(id) on delete restrict;

create table public.spirometry_result_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  spirometry_result_id uuid not null references public.spirometry_results(id) on delete restrict,
  version int not null check (version > 0),
  required_inputs jsonb not null,
  bronchodilator jsonb not null default '{}'::jsonb,
  accepted_maneuver_snapshot jsonb,
  professional_conclusion text,
  inconclusive_reason text,
  correction_reason text not null,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint spirometry_versions_result_version_uq unique (
    tenant_id,
    spirometry_result_id,
    version
  )
);

create or replace function public.start_spirometry_exam(
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

  insert into public.spirometry_results (tenant_id, encounter_id, exam_order_id, started_by)
  values (target_tenant_id, order_record.encounter_id, target_exam_order_id, auth.uid())
  on conflict (tenant_id, exam_order_id) do update
    set status = case
          when public.spirometry_results.status in ('completed', 'inconclusive') then 'repeated'
          else 'in_progress'
        end,
        updated_at = now()
  returning id into result_id;

  update public.exam_orders
    set status = 'collected'
  where id = target_exam_order_id
    and tenant_id = target_tenant_id
    and status in ('ordered', 'collected');

  perform public.log_audit(
    target_tenant_id,
    'spirometry.started',
    'spirometry_results',
    result_id,
    audit_request_id,
    jsonb_build_object('examOrderId', target_exam_order_id)
  );

  return result_id;
end;
$$;

create or replace function public.save_spirometry_maneuver(
  target_tenant_id uuid,
  target_result_id uuid,
  predicted_value_set_id_value uuid,
  calibration_id_value uuid,
  attempt_number_value int,
  measured_values_value jsonb,
  predicted_values_value jsonb,
  percentages_value jsonb,
  curve_attachment_refs_value jsonb,
  quality_grade_value text,
  technical_notes_value text,
  accept_maneuver boolean,
  required_inputs_value jsonb,
  bronchodilator_value jsonb,
  professional_conclusion_value text,
  inconclusive_reason_value text,
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
  maneuver_id uuid;
  next_version int;
  version_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'exams.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select *
    into result_record
  from public.spirometry_results
  where id = target_result_id
    and tenant_id = target_tenant_id
  for update;

  if result_record.id is null then
    raise exception 'spirometry result not found' using errcode = 'P0002';
  end if;

  select *
    into calibration_record
  from public.spirometry_calibrations
  where id = calibration_id_value
    and tenant_id = target_tenant_id;

  if (complete_result or inconclusive_result) and (
    calibration_record.id is null
    or calibration_record.status <> 'valid'
    or calibration_record.valid_until < now()
  ) then
    raise exception 'valid spirometer verification required' using errcode = '22023';
  end if;

  insert into public.spirometry_maneuvers (
    tenant_id,
    spirometry_result_id,
    attempt_number,
    measured_values,
    predicted_values,
    percentages,
    curve_attachment_refs,
    quality_grade,
    technical_notes,
    accepted,
    created_by
  )
  values (
    target_tenant_id,
    target_result_id,
    attempt_number_value,
    measured_values_value,
    predicted_values_value,
    percentages_value,
    coalesce(curve_attachment_refs_value, '[]'::jsonb),
    quality_grade_value,
    nullif(trim(technical_notes_value), ''),
    accept_maneuver,
    auth.uid()
  )
  on conflict (tenant_id, spirometry_result_id, attempt_number) do update
    set measured_values = excluded.measured_values,
        predicted_values = excluded.predicted_values,
        percentages = excluded.percentages,
        curve_attachment_refs = excluded.curve_attachment_refs,
        quality_grade = excluded.quality_grade,
        technical_notes = excluded.technical_notes,
        accepted = excluded.accepted
  returning id into maneuver_id;

  if accept_maneuver then
    update public.spirometry_maneuvers
      set accepted = false
    where tenant_id = target_tenant_id
      and spirometry_result_id = target_result_id
      and id <> maneuver_id;
  end if;

  next_version := result_record.current_version;
  if exists (
    select 1 from public.spirometry_result_versions version
    where version.tenant_id = target_tenant_id
      and version.spirometry_result_id = target_result_id
      and version.version = next_version
  ) then
    next_version := result_record.current_version + 1;
  end if;

  insert into public.spirometry_result_versions (
    tenant_id,
    spirometry_result_id,
    version,
    required_inputs,
    bronchodilator,
    accepted_maneuver_snapshot,
    professional_conclusion,
    inconclusive_reason,
    correction_reason,
    created_by
  )
  values (
    target_tenant_id,
    target_result_id,
    next_version,
    required_inputs_value,
    coalesce(bronchodilator_value, '{}'::jsonb),
    case when accept_maneuver then jsonb_build_object(
      'maneuverId', maneuver_id,
      'measuredValues', measured_values_value,
      'predictedValues', predicted_values_value,
      'percentages', percentages_value,
      'qualityGrade', quality_grade_value
    ) else null end,
    nullif(trim(professional_conclusion_value), ''),
    nullif(trim(inconclusive_reason_value), ''),
    nullif(trim(correction_reason_value), ''),
    auth.uid()
  )
  returning id into version_id;

  update public.spirometry_results
    set current_version = next_version,
        predicted_value_set_id = predicted_value_set_id_value,
        calibration_id = calibration_id_value,
        accepted_maneuver_id = case when accept_maneuver then maneuver_id else accepted_maneuver_id end,
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

  perform public.log_audit(
    target_tenant_id,
    case
      when inconclusive_result then 'spirometry.inconclusive'
      when complete_result then 'spirometry.completed'
      else 'spirometry.saved'
    end,
    'spirometry_results',
    target_result_id,
    audit_request_id,
    jsonb_build_object('version', next_version, 'maneuverId', maneuver_id)
  );

  return version_id;
end;
$$;

alter table public.spirometry_predicted_value_sets enable row level security;
alter table public.spirometry_calibrations enable row level security;
alter table public.spirometry_results enable row level security;
alter table public.spirometry_maneuvers enable row level security;
alter table public.spirometry_result_versions enable row level security;

create policy spirometry_predicted_sets_read on public.spirometry_predicted_value_sets
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy spirometry_predicted_sets_manage on public.spirometry_predicted_value_sets
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'exams.manage'))
  with check (public.has_tenant_permission(tenant_id, 'exams.manage'));
create policy spirometry_calibrations_read on public.spirometry_calibrations
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy spirometry_calibrations_manage on public.spirometry_calibrations
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'exams.manage'))
  with check (public.has_tenant_permission(tenant_id, 'exams.manage'));
create policy spirometry_results_read on public.spirometry_results
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy spirometry_results_manage on public.spirometry_results
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'exams.manage'))
  with check (public.has_tenant_permission(tenant_id, 'exams.manage'));
create policy spirometry_maneuvers_read on public.spirometry_maneuvers
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy spirometry_maneuvers_insert on public.spirometry_maneuvers
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'exams.manage') and created_by = auth.uid());
create policy spirometry_versions_read on public.spirometry_result_versions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy spirometry_versions_insert on public.spirometry_result_versions
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'exams.manage') and created_by = auth.uid());

grant execute on function public.start_spirometry_exam(uuid, uuid, text) to authenticated;
grant execute on function public.save_spirometry_maneuver(
  uuid,
  uuid,
  uuid,
  uuid,
  int,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  text,
  text,
  boolean,
  jsonb,
  jsonb,
  text,
  text,
  text,
  boolean,
  boolean,
  text
) to authenticated;

commit;
