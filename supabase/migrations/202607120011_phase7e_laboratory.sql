begin;

create table public.external_laboratories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  name text not null,
  tax_id text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.laboratory_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  external_laboratory_id uuid references public.external_laboratories(id) on delete restrict,
  status text not null default 'ordered' check (
    status in ('ordered', 'collecting', 'received', 'processing', 'review', 'released', 'cancelled')
  ),
  barcode_value text,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.laboratory_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  laboratory_order_id uuid not null references public.laboratory_orders(id) on delete restrict,
  exam_order_id uuid references public.exam_orders(id) on delete restrict,
  analyte_code text not null,
  analyte_name text not null,
  reference_range_config jsonb not null default '{}'::jsonb,
  status text not null default 'ordered' check (
    status in ('ordered', 'collected', 'received', 'processing', 'resulted', 'reviewed', 'released', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

create table public.laboratory_samples (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  laboratory_order_id uuid not null references public.laboratory_orders(id) on delete restrict,
  sample_code text not null,
  sample_type text not null,
  status text not null default 'pending_collection' check (
    status in ('pending_collection', 'collected', 'received', 'processing', 'disposed', 'cancelled')
  ),
  collected_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  constraint laboratory_samples_order_code_uq unique (tenant_id, laboratory_order_id, sample_code)
);

create table public.laboratory_sample_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  sample_id uuid not null references public.laboratory_samples(id) on delete restrict,
  event_type text not null check (
    event_type in ('collected', 'received', 'processing_started', 'disposed', 'cancelled', 'corrected')
  ),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.laboratory_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  laboratory_order_item_id uuid not null references public.laboratory_order_items(id) on delete restrict,
  version int not null default 1 check (version > 0),
  result_payload jsonb not null,
  reference_range_snapshot jsonb not null default '{}'::jsonb,
  critical_flag boolean not null default false,
  critical_confirmed_at timestamptz,
  status text not null default 'resulted' check (
    status in ('resulted', 'reviewed', 'released', 'repeated', 'cancelled')
  ),
  reviewed_by uuid references public.user_profiles(id) on delete restrict,
  released_by uuid references public.user_profiles(id) on delete restrict,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  released_at timestamptz,
  constraint laboratory_results_item_version_uq unique (tenant_id, laboratory_order_item_id, version)
);

create table public.laboratory_critical_confirmations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  laboratory_result_id uuid not null references public.laboratory_results(id) on delete restrict,
  confirmation_note text not null,
  confirmed_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create or replace function public.record_laboratory_sample_event(
  target_tenant_id uuid,
  target_sample_id uuid,
  event_type_value text,
  payload_value jsonb,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  event_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'exams.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  insert into public.laboratory_sample_events (tenant_id, sample_id, event_type, payload, created_by)
  values (target_tenant_id, target_sample_id, event_type_value, coalesce(payload_value, '{}'::jsonb), auth.uid())
  returning id into event_id;

  update public.laboratory_samples
    set status = case
      when event_type_value = 'collected' then 'collected'
      when event_type_value = 'received' then 'received'
      when event_type_value = 'processing_started' then 'processing'
      when event_type_value = 'disposed' then 'disposed'
      when event_type_value = 'cancelled' then 'cancelled'
      else status
    end,
    collected_at = case when event_type_value = 'collected' then now() else collected_at end,
    received_at = case when event_type_value = 'received' then now() else received_at end
  where id = target_sample_id
    and tenant_id = target_tenant_id;

  perform public.log_audit(
    target_tenant_id,
    'laboratory_sample.event',
    'laboratory_samples',
    target_sample_id,
    audit_request_id,
    jsonb_build_object('eventType', event_type_value)
  );

  return event_id;
end;
$$;

create or replace function public.save_laboratory_result(
  target_tenant_id uuid,
  target_order_item_id uuid,
  result_payload_value jsonb,
  reference_range_snapshot_value jsonb,
  critical_flag_value boolean,
  status_value text,
  correction_reason text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  next_version int;
  result_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'exams.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select coalesce(max(version), 0) + 1
    into next_version
  from public.laboratory_results
  where tenant_id = target_tenant_id
    and laboratory_order_item_id = target_order_item_id;

  if status_value = 'released' and critical_flag_value and not exists (
    select 1 from public.laboratory_critical_confirmations confirmation
    join public.laboratory_results result on result.id = confirmation.laboratory_result_id
    where result.tenant_id = target_tenant_id
      and result.laboratory_order_item_id = target_order_item_id
  ) then
    raise exception 'critical result confirmation required' using errcode = '22023';
  end if;

  insert into public.laboratory_results (
    tenant_id,
    laboratory_order_item_id,
    version,
    result_payload,
    reference_range_snapshot,
    critical_flag,
    status,
    reviewed_by,
    released_by,
    created_by,
    reviewed_at,
    released_at
  )
  values (
    target_tenant_id,
    target_order_item_id,
    next_version,
    result_payload_value,
    coalesce(reference_range_snapshot_value, '{}'::jsonb),
    critical_flag_value,
    status_value,
    case when status_value in ('reviewed', 'released') then auth.uid() else null end,
    case when status_value = 'released' then auth.uid() else null end,
    auth.uid(),
    case when status_value in ('reviewed', 'released') then now() else null end,
    case when status_value = 'released' then now() else null end
  )
  returning id into result_id;

  update public.laboratory_order_items
    set status = case
      when status_value = 'released' then 'released'
      when status_value = 'reviewed' then 'reviewed'
      else 'resulted'
    end
  where id = target_order_item_id
    and tenant_id = target_tenant_id;

  perform public.log_audit(
    target_tenant_id,
    'laboratory_result.saved',
    'laboratory_results',
    result_id,
    audit_request_id,
    jsonb_build_object('version', next_version, 'critical', critical_flag_value, 'reason', correction_reason)
  );

  return result_id;
end;
$$;

alter table public.external_laboratories enable row level security;
alter table public.laboratory_orders enable row level security;
alter table public.laboratory_order_items enable row level security;
alter table public.laboratory_samples enable row level security;
alter table public.laboratory_sample_events enable row level security;
alter table public.laboratory_results enable row level security;
alter table public.laboratory_critical_confirmations enable row level security;

create policy external_labs_read on public.external_laboratories
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy external_labs_manage on public.external_laboratories
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'exams.manage'))
  with check (public.has_tenant_permission(tenant_id, 'exams.manage'));

create policy laboratory_orders_read on public.laboratory_orders
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy laboratory_orders_manage on public.laboratory_orders
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'exams.manage'))
  with check (public.has_tenant_permission(tenant_id, 'exams.manage') and created_by = auth.uid());
create policy laboratory_items_read on public.laboratory_order_items
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy laboratory_items_manage on public.laboratory_order_items
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'exams.manage'))
  with check (public.has_tenant_permission(tenant_id, 'exams.manage'));
create policy laboratory_samples_read on public.laboratory_samples
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy laboratory_samples_manage on public.laboratory_samples
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'exams.manage'))
  with check (public.has_tenant_permission(tenant_id, 'exams.manage'));
create policy laboratory_sample_events_read on public.laboratory_sample_events
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy laboratory_sample_events_insert on public.laboratory_sample_events
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'exams.manage') and created_by = auth.uid());
create policy laboratory_results_read on public.laboratory_results
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy laboratory_results_insert on public.laboratory_results
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'exams.manage') and created_by = auth.uid());
create policy laboratory_confirmations_read on public.laboratory_critical_confirmations
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'exams.read'));
create policy laboratory_confirmations_insert on public.laboratory_critical_confirmations
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'exams.manage') and confirmed_by = auth.uid());

grant execute on function public.record_laboratory_sample_event(uuid, uuid, text, jsonb, text) to authenticated;
grant execute on function public.save_laboratory_result(uuid, uuid, jsonb, jsonb, boolean, text, text, text) to authenticated;

commit;
