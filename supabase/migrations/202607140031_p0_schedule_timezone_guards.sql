-- Agenda: endurece create_scheduled_appointment (AAL2, unidade, referral
-- obrigatório para ocupacional) e valida período/conflito de recurso.

begin;

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
  resource_unit_id uuid;
  referral_worker_id uuid;
  referral_status text;
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

  if not public.has_unit_permission(target_clinic_unit_id, 'schedule.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if ends_at_value <= starts_at_value then
    raise exception 'invalid appointment period' using errcode = '22023';
  end if;

  if target_referral_id is null then
    raise exception 'occupational appointment requires referral' using errcode = '22023';
  end if;

  select referral.worker_id, referral.status
    into referral_worker_id, referral_status
  from public.referrals referral
  where referral.id = target_referral_id
    and referral.tenant_id = target_tenant_id
  for share;

  if referral_worker_id is null then
    raise exception 'referral not found' using errcode = 'P0002';
  end if;

  if referral_status in ('cancelled', 'draft') then
    raise exception 'referral is not eligible for scheduling' using errcode = '22023';
  end if;

  select resource.clinic_unit_id
    into resource_unit_id
  from public.schedule_resources resource
  where resource.id = target_resource_id
    and resource.tenant_id = target_tenant_id
  for share;

  if resource_unit_id is null then
    raise exception 'schedule resource not found' using errcode = 'P0002';
  end if;

  if resource_unit_id <> target_clinic_unit_id then
    raise exception 'resource does not belong to clinic unit' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.appointments appointment
    where appointment.tenant_id = target_tenant_id
      and appointment.resource_id = target_resource_id
      and appointment.status in ('scheduled', 'confirmed', 'rescheduled')
      and tstzrange(appointment.starts_at, appointment.ends_at, '[)')
          && tstzrange(starts_at_value, ends_at_value, '[)')
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

revoke all on function public.create_scheduled_appointment(
  uuid, uuid, uuid, uuid, timestamptz, timestamptz, text, text
) from public, anon, authenticated;
grant execute on function public.create_scheduled_appointment(
  uuid, uuid, uuid, uuid, timestamptz, timestamptz, text, text
) to authenticated;

commit;
