begin;

create table public.diagnostic_exam_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  exam_order_id uuid not null references public.exam_orders(id) on delete restrict,
  modality text not null check (modality in ('ecg', 'eeg', 'radiology')),
  status text not null default 'requested' check (
    status in ('requested', 'prepared', 'executed', 'reported', 'validated', 'cancelled')
  ),
  current_version int not null default 1 check (current_version > 0),
  executor_user_id uuid references public.user_profiles(id) on delete restrict,
  reviewer_user_id uuid references public.user_profiles(id) on delete restrict,
  requested_at timestamptz not null default now(),
  prepared_at timestamptz,
  executed_at timestamptz,
  reported_at timestamptz,
  validated_at timestamptz,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diagnostic_exam_results_order_uq unique (tenant_id, exam_order_id)
);

create table public.diagnostic_exam_result_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  diagnostic_exam_result_id uuid not null references public.diagnostic_exam_results(id) on delete restrict,
  version int not null check (version > 0),
  preparation jsonb not null default '{}'::jsonb,
  execution jsonb not null default '{}'::jsonb,
  equipment jsonb not null default '{}'::jsonb,
  raw_file_refs jsonb not null default '[]'::jsonb,
  image_or_pdf_refs jsonb not null default '[]'::jsonb,
  report text,
  professional_conclusion text,
  external_result_validation jsonb not null default '{}'::jsonb,
  correction_reason text not null,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint diagnostic_exam_versions_result_version_uq unique (
    tenant_id,
    diagnostic_exam_result_id,
    version
  )
);

create or replace function public.save_diagnostic_exam_result(
  target_tenant_id uuid,
  target_exam_order_id uuid,
  modality_value text,
  status_value text,
  preparation_value jsonb,
  execution_value jsonb,
  equipment_value jsonb,
  raw_file_refs_value jsonb,
  image_or_pdf_refs_value jsonb,
  report_value text,
  professional_conclusion_value text,
  external_result_validation_value jsonb,
  correction_reason_value text,
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
  next_version int;
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

  insert into public.diagnostic_exam_results (
    tenant_id,
    encounter_id,
    exam_order_id,
    modality,
    status,
    executor_user_id,
    reviewer_user_id,
    prepared_at,
    executed_at,
    reported_at,
    validated_at,
    created_by
  )
  values (
    target_tenant_id,
    order_record.encounter_id,
    target_exam_order_id,
    modality_value,
    status_value,
    case when status_value in ('executed', 'reported', 'validated') then auth.uid() else null end,
    case when status_value in ('reported', 'validated') then auth.uid() else null end,
    case when status_value in ('prepared', 'executed', 'reported', 'validated') then now() else null end,
    case when status_value in ('executed', 'reported', 'validated') then now() else null end,
    case when status_value in ('reported', 'validated') then now() else null end,
    case when status_value = 'validated' then now() else null end,
    auth.uid()
  )
  on conflict (tenant_id, exam_order_id) do update
    set modality = excluded.modality,
        status = excluded.status,
        executor_user_id = coalesce(excluded.executor_user_id, public.diagnostic_exam_results.executor_user_id),
        reviewer_user_id = coalesce(excluded.reviewer_user_id, public.diagnostic_exam_results.reviewer_user_id),
        prepared_at = coalesce(excluded.prepared_at, public.diagnostic_exam_results.prepared_at),
        executed_at = coalesce(excluded.executed_at, public.diagnostic_exam_results.executed_at),
        reported_at = coalesce(excluded.reported_at, public.diagnostic_exam_results.reported_at),
        validated_at = coalesce(excluded.validated_at, public.diagnostic_exam_results.validated_at),
        updated_at = now()
  returning id, current_version into result_id, next_version;

  if exists (
    select 1 from public.diagnostic_exam_result_versions version
    where version.tenant_id = target_tenant_id
      and version.diagnostic_exam_result_id = result_id
      and version.version = next_version
  ) then
    next_version := next_version + 1;
    update public.diagnostic_exam_results
      set current_version = next_version,
          updated_at = now()
    where id = result_id
      and tenant_id = target_tenant_id;
  end if;

  insert into public.diagnostic_exam_result_versions (
    tenant_id,
    diagnostic_exam_result_id,
    version,
    preparation,
    execution,
    equipment,
    raw_file_refs,
    image_or_pdf_refs,
    report,
    professional_conclusion,
    external_result_validation,
    correction_reason,
    created_by
  )
  values (
    target_tenant_id,
    result_id,
    next_version,
    coalesce(preparation_value, '{}'::jsonb),
    coalesce(execution_value, '{}'::jsonb),
    coalesce(equipment_value, '{}'::jsonb),
    coalesce(raw_file_refs_value, '[]'::jsonb),
    coalesce(image_or_pdf_refs_value, '[]'::jsonb),
    nullif(trim(report_value), ''),
    nullif(trim(professional_conclusion_value), ''),
    coalesce(external_result_validation_value, '{}'::jsonb),
    nullif(trim(correction_reason_value), ''),
    auth.uid()
  );

  if status_value in ('reported', 'validated') then
    update public.exam_orders
      set status = 'resulted'
    where id = target_exam_order_id
      and tenant_id = target_tenant_id;
  end if;

  perform public.log_audit(
    target_tenant_id,
    'diagnostic_exam.saved',
    'diagnostic_exam_results',
    result_id,
    audit_request_id,
    jsonb_build_object('modality', modality_value, 'status', status_value, 'version', next_version)
  );

  return result_id;
end;
$$;

alter table public.diagnostic_exam_results enable row level security;
alter table public.diagnostic_exam_result_versions enable row level security;

create policy diagnostic_exam_results_read on public.diagnostic_exam_results
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy diagnostic_exam_results_manage on public.diagnostic_exam_results
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'exams.manage'))
  with check (public.has_tenant_permission(tenant_id, 'exams.manage') and created_by = auth.uid());
create policy diagnostic_exam_versions_read on public.diagnostic_exam_result_versions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy diagnostic_exam_versions_insert on public.diagnostic_exam_result_versions
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'exams.manage') and created_by = auth.uid());

grant execute on function public.save_diagnostic_exam_result(
  uuid,
  uuid,
  text,
  text,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  text,
  text,
  jsonb,
  text,
  text
) to authenticated;

commit;
