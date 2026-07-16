-- Fase E checkpoint: encaminhamento com pacote de exames do motor de protocolo.

create or replace function public.create_referral_with_protocol(
  target_tenant_id uuid,
  target_company_id uuid,
  target_worker_id uuid,
  occupational_exam_type_value text,
  valid_until_value date,
  exam_items_value jsonb,
  exam_preview_value jsonb,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  referral_id uuid;
  item record;
  item_exam_id uuid;
  item_source text;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'referrals.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if occupational_exam_type_value not in (
    'admission', 'periodic', 'dismissal', 'return_to_work', 'change_of_risk'
  ) then
    raise exception 'invalid occupational exam type' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(exam_items_value, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(exam_items_value) < 1 then
    raise exception 'protocol exams required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.companies company
    where company.id = target_company_id and company.tenant_id = target_tenant_id
  ) then
    raise exception 'company not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.workers worker
    where worker.id = target_worker_id and worker.tenant_id = target_tenant_id
  ) then
    raise exception 'worker not found' using errcode = 'P0002';
  end if;

  insert into public.referrals (
    tenant_id,
    company_id,
    worker_id,
    occupational_exam_type,
    status,
    valid_until,
    exam_preview
  )
  values (
    target_tenant_id,
    target_company_id,
    target_worker_id,
    occupational_exam_type_value,
    'ready_to_schedule',
    valid_until_value,
    coalesce(exam_preview_value, '[]'::jsonb)
  )
  returning id into referral_id;

  for item in
    select value from jsonb_array_elements(exam_items_value) as elements(value)
  loop
    item_exam_id := nullif(item.value ->> 'examCatalogId', '')::uuid;
    item_source := coalesce(nullif(item.value ->> 'source', ''), 'protocol');

    if item_exam_id is null then
      raise exception 'invalid referral exam item' using errcode = '22023';
    end if;

    if item_source not in ('protocol', 'manual', 'import') then
      raise exception 'invalid referral item source' using errcode = '22023';
    end if;

    insert into public.referral_items (
      tenant_id,
      referral_id,
      exam_catalog_id,
      source,
      status
    )
    values (
      target_tenant_id,
      referral_id,
      item_exam_id,
      item_source,
      'pending'
    );
  end loop;

  perform public.append_audit_log(
    target_tenant_id,
    'referral.created_with_protocol',
    'referral',
    referral_id,
    audit_request_id,
    jsonb_build_object(
      'examCount', jsonb_array_length(exam_items_value),
      'occupationalExamType', occupational_exam_type_value
    )
  );

  return referral_id;
end;
$$;

revoke all on function public.create_referral_with_protocol(
  uuid, uuid, uuid, text, date, jsonb, jsonb, text
) from public;
grant execute on function public.create_referral_with_protocol(
  uuid, uuid, uuid, text, date, jsonb, jsonb, text
) to authenticated;
