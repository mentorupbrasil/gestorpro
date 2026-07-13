begin;

insert into public.permissions (code, description)
values
  ('exams.read', 'Visualizar exames complementares conforme escopo'),
  ('exams.manage', 'Registrar exames complementares')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in ('exams.read', 'exams.manage')
on conflict do nothing;

create table public.visual_acuity_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  exam_order_id uuid not null references public.exam_orders(id) on delete restrict,
  status text not null default 'in_progress' check (
    status in ('in_progress', 'completed', 'repeated', 'cancelled')
  ),
  current_version int not null default 1 check (current_version > 0),
  started_by uuid not null references public.user_profiles(id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_by uuid references public.user_profiles(id) on delete restrict,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visual_acuity_results_order_uq unique (tenant_id, exam_order_id)
);

create table public.visual_acuity_result_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  visual_acuity_result_id uuid not null references public.visual_acuity_results(id) on delete restrict,
  version int not null check (version > 0),
  right_eye jsonb not null,
  left_eye jsonb not null,
  binocular jsonb not null,
  test_conditions jsonb not null,
  equipment_name text not null,
  chart_type text not null,
  observations text,
  professional_conclusion text,
  correction_reason text not null,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint visual_acuity_versions_result_version_uq unique (
    tenant_id,
    visual_acuity_result_id,
    version
  )
);

create or replace function public.start_visual_acuity_exam(
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

  insert into public.visual_acuity_results (
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
          when public.visual_acuity_results.status = 'completed' then 'repeated'
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
    'visual_acuity.started',
    auth.uid(),
    jsonb_build_object('examOrderId', target_exam_order_id, 'resultId', result_id)
  );

  perform public.log_audit(
    target_tenant_id,
    'visual_acuity.started',
    'visual_acuity_results',
    result_id,
    audit_request_id,
    jsonb_build_object('examOrderId', target_exam_order_id)
  );

  return result_id;
end;
$$;

create or replace function public.save_visual_acuity_result(
  target_tenant_id uuid,
  target_result_id uuid,
  right_eye_value jsonb,
  left_eye_value jsonb,
  binocular_value jsonb,
  test_conditions_value jsonb,
  equipment_name_value text,
  chart_type_value text,
  observations_value text,
  professional_conclusion_value text,
  correction_reason_value text,
  complete_result boolean,
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
  next_version int;
  version_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'exams.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select *
    into result_record
  from public.visual_acuity_results
  where id = target_result_id
    and tenant_id = target_tenant_id
  for update;

  if result_record.id is null then
    raise exception 'visual acuity result not found' using errcode = 'P0002';
  end if;

  next_version := result_record.current_version;
  if exists (
    select 1
    from public.visual_acuity_result_versions version
    where version.tenant_id = target_tenant_id
      and version.visual_acuity_result_id = target_result_id
      and version.version = next_version
  ) then
    next_version := result_record.current_version + 1;
  end if;

  insert into public.visual_acuity_result_versions (
    tenant_id,
    visual_acuity_result_id,
    version,
    right_eye,
    left_eye,
    binocular,
    test_conditions,
    equipment_name,
    chart_type,
    observations,
    professional_conclusion,
    correction_reason,
    created_by
  )
  values (
    target_tenant_id,
    target_result_id,
    next_version,
    right_eye_value,
    left_eye_value,
    binocular_value,
    test_conditions_value,
    nullif(trim(equipment_name_value), ''),
    nullif(trim(chart_type_value), ''),
    nullif(trim(observations_value), ''),
    nullif(trim(professional_conclusion_value), ''),
    nullif(trim(correction_reason_value), ''),
    auth.uid()
  )
  returning id into version_id;

  update public.visual_acuity_results
    set current_version = next_version,
        status = case when complete_result then 'completed' else 'in_progress' end,
        completed_at = case when complete_result then now() else completed_at end,
        completed_by = case when complete_result then auth.uid() else completed_by end,
        updated_at = now()
  where id = target_result_id
    and tenant_id = target_tenant_id;

  if complete_result then
    update public.exam_orders
      set status = 'resulted'
    where id = result_record.exam_order_id
      and tenant_id = target_tenant_id;

    update public.encounter_steps
      set status = 'completed',
          updated_at = now()
    where tenant_id = target_tenant_id
      and encounter_id = result_record.encounter_id
      and step_type = 'exam'
      and status in ('available', 'in_progress');

    update public.encounter_steps
      set status = 'available',
          updated_at = now()
    where tenant_id = target_tenant_id
      and encounter_id = result_record.encounter_id
      and step_type = 'consultation'
      and status = 'blocked';
  end if;

  insert into public.encounter_events (tenant_id, encounter_id, event_type, created_by, payload)
  values (
    target_tenant_id,
    result_record.encounter_id,
    case when complete_result then 'visual_acuity.completed' else 'visual_acuity.saved' end,
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
    case when complete_result then 'visual_acuity.completed' else 'visual_acuity.saved' end,
    'visual_acuity_results',
    target_result_id,
    audit_request_id,
    jsonb_build_object('version', next_version)
  );

  return version_id;
end;
$$;

alter table public.visual_acuity_results enable row level security;
alter table public.visual_acuity_result_versions enable row level security;

create policy visual_acuity_results_read on public.visual_acuity_results
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy visual_acuity_results_manage on public.visual_acuity_results
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'exams.manage'))
  with check (public.has_tenant_permission(tenant_id, 'exams.manage'));
create policy visual_acuity_versions_read on public.visual_acuity_result_versions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy visual_acuity_versions_insert on public.visual_acuity_result_versions
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'exams.manage') and created_by = auth.uid());

grant execute on function public.start_visual_acuity_exam(uuid, uuid, text) to authenticated;
grant execute on function public.save_visual_acuity_result(
  uuid,
  uuid,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  text,
  text,
  text,
  text,
  text,
  boolean,
  text
) to authenticated;

commit;
