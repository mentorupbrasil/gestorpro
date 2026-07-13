begin;

insert into public.permissions (code, description)
values
  ('referrals.read', 'Visualizar encaminhamentos'),
  ('referrals.manage', 'Gerenciar encaminhamentos'),
  ('schedule.read', 'Visualizar agenda'),
  ('schedule.manage', 'Gerenciar agenda'),
  ('imports.manage', 'Gerenciar importações de encaminhamentos')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in (
    'referrals.read',
    'referrals.manage',
    'schedule.read',
    'schedule.manage',
    'imports.manage'
  )
on conflict do nothing;

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  worker_id uuid not null references public.workers(id) on delete restrict,
  employment_contract_id uuid references public.employment_contracts(id) on delete restrict,
  occupational_exam_type text not null check (occupational_exam_type in ('admission', 'periodic', 'dismissal', 'return_to_work', 'change_of_risk')),
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'ready_to_schedule', 'scheduled', 'cancelled', 'expired')),
  valid_until date,
  idempotency_key text,
  divergence_report jsonb not null default '[]'::jsonb,
  exam_preview jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referrals_tenant_idempotency_uq unique (tenant_id, idempotency_key)
);

create table public.referral_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  referral_id uuid not null references public.referrals(id) on delete restrict,
  exam_catalog_id uuid references public.exam_catalog(id) on delete restrict,
  source text not null check (source in ('protocol', 'manual', 'import')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.referral_import_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  file_name text not null,
  idempotency_key text not null,
  status text not null default 'preview' check (status in ('preview', 'imported', 'rejected')),
  row_count int not null default 0,
  valid_count int not null default 0,
  invalid_count int not null default 0,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint referral_import_batches_tenant_key_uq unique (tenant_id, idempotency_key)
);

create table public.referral_import_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  batch_id uuid not null references public.referral_import_batches(id) on delete restrict,
  row_number int not null,
  raw_payload jsonb not null,
  normalized_payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('valid', 'invalid', 'corrected', 'imported')),
  errors jsonb not null default '[]'::jsonb,
  referral_id uuid references public.referrals(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint referral_import_lines_batch_row_uq unique (tenant_id, batch_id, row_number)
);

create table public.schedule_resources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  clinic_unit_id uuid not null references public.clinic_units(id) on delete restrict,
  resource_type text not null check (resource_type in ('room', 'professional', 'equipment', 'procedure')),
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null check (char_length(trim(name)) between 2 and 160),
  status text not null default 'active' check (status in ('active', 'blocked', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_resources_tenant_unit_code_uq unique (tenant_id, clinic_unit_id, code)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  clinic_unit_id uuid not null references public.clinic_units(id) on delete restrict,
  referral_id uuid references public.referrals(id) on delete restrict,
  resource_id uuid not null references public.schedule_resources(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'cancelled', 'rescheduled', 'no_show', 'completed')),
  preparation_instructions text,
  version int not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_period_ck check (ends_at > starts_at)
);

create index appointments_resource_time_idx
  on public.appointments (tenant_id, resource_id, starts_at, ends_at)
  where status in ('scheduled', 'confirmed', 'rescheduled');

create table public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  event_type text not null check (event_type in ('scheduled', 'confirmed', 'cancelled', 'rescheduled')),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  referral_id uuid not null references public.referrals(id) on delete restrict,
  clinic_unit_id uuid not null references public.clinic_units(id) on delete restrict,
  desired_from timestamptz,
  priority int not null default 100,
  status text not null default 'waiting' check (status in ('waiting', 'offered', 'scheduled', 'cancelled')),
  created_at timestamptz not null default now()
);

create or replace function public.create_scheduled_appointment(
  target_tenant_id uuid,
  target_clinic_unit_id uuid,
  target_referral_id uuid,
  target_resource_id uuid,
  starts_at_value timestamptz,
  ends_at_value timestamptz,
  preparation_text text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  new_appointment_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'schedule.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if ends_at_value <= starts_at_value then
    raise exception 'invalid appointment period' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.appointments appointment
    where appointment.tenant_id = target_tenant_id
      and appointment.resource_id = target_resource_id
      and appointment.status in ('scheduled', 'confirmed', 'rescheduled')
      and tstzrange(appointment.starts_at, appointment.ends_at, '[)') && tstzrange(starts_at_value, ends_at_value, '[)')
  ) then
    raise exception 'schedule conflict' using errcode = '23P01';
  end if;

  insert into public.appointments (
    tenant_id,
    clinic_unit_id,
    referral_id,
    resource_id,
    starts_at,
    ends_at,
    preparation_instructions
  )
  values (
    target_tenant_id,
    target_clinic_unit_id,
    target_referral_id,
    target_resource_id,
    starts_at_value,
    ends_at_value,
    nullif(trim(preparation_text), '')
  )
  returning id into new_appointment_id;

  update public.referrals
  set status = 'scheduled', updated_at = now()
  where id = target_referral_id
    and tenant_id = target_tenant_id;

  insert into public.appointment_events (tenant_id, appointment_id, event_type, created_by, payload)
  values (
    target_tenant_id,
    new_appointment_id,
    'scheduled',
    auth.uid(),
    jsonb_build_object('resourceId', target_resource_id)
  );

  perform public.append_audit_log(
    target_tenant_id,
    'appointment.scheduled',
    'appointment',
    new_appointment_id,
    audit_request_id,
    jsonb_build_object('referralId', target_referral_id)
  );

  return new_appointment_id;
end;
$$;

revoke all on function public.create_scheduled_appointment(uuid, uuid, uuid, uuid, timestamptz, timestamptz, text, text) from public;
grant execute on function public.create_scheduled_appointment(uuid, uuid, uuid, uuid, timestamptz, timestamptz, text, text) to authenticated;

alter table public.referrals enable row level security;
alter table public.referral_items enable row level security;
alter table public.referral_import_batches enable row level security;
alter table public.referral_import_lines enable row level security;
alter table public.schedule_resources enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;
alter table public.waitlist_entries enable row level security;

create policy referrals_select on public.referrals for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'referrals.read'));
create policy referrals_write on public.referrals for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'referrals.manage'))
  with check (public.has_tenant_permission(tenant_id, 'referrals.manage'));

create policy referral_items_select on public.referral_items for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'referrals.read'));
create policy referral_items_write on public.referral_items for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'referrals.manage'))
  with check (public.has_tenant_permission(tenant_id, 'referrals.manage'));

create policy referral_import_batches_select on public.referral_import_batches for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'referrals.read'));
create policy referral_import_batches_write on public.referral_import_batches for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'imports.manage'))
  with check (public.has_tenant_permission(tenant_id, 'imports.manage') and created_by = auth.uid());

create policy referral_import_lines_select on public.referral_import_lines for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'referrals.read'));
create policy referral_import_lines_write on public.referral_import_lines for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'imports.manage'))
  with check (public.has_tenant_permission(tenant_id, 'imports.manage'));

create policy schedule_resources_select on public.schedule_resources for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'schedule.read'));
create policy schedule_resources_write on public.schedule_resources for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'schedule.manage'))
  with check (public.has_tenant_permission(tenant_id, 'schedule.manage'));

create policy appointments_select on public.appointments for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'schedule.read'));
create policy appointments_write on public.appointments for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'schedule.manage'))
  with check (public.has_tenant_permission(tenant_id, 'schedule.manage'));

create policy appointment_events_select on public.appointment_events for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'schedule.read'));
create policy appointment_events_insert on public.appointment_events for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'schedule.manage') and created_by = auth.uid());

create policy waitlist_entries_select on public.waitlist_entries for select to authenticated
  using (public.has_tenant_permission(tenant_id, 'schedule.read'));
create policy waitlist_entries_write on public.waitlist_entries for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'schedule.manage'))
  with check (public.has_tenant_permission(tenant_id, 'schedule.manage'));

commit;
