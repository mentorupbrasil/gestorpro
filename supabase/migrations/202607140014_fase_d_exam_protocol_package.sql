-- Fase D checkpoint: criar/ativar pacote de protocolo de exames (RPC only).

create or replace function public.create_exam_protocol_package(
  target_tenant_id uuid,
  target_pcmso_version_id uuid,
  occupational_exam_type_value text,
  items_value jsonb,
  activate_protocol boolean,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  protocol_id uuid;
  item record;
  item_exam_id uuid;
  item_required boolean;
  item_conditions jsonb;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'protocols.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if occupational_exam_type_value not in (
    'admission', 'periodic', 'dismissal', 'return_to_work', 'change_of_risk'
  ) then
    raise exception 'invalid occupational exam type' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(items_value, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(items_value) < 1 then
    raise exception 'protocol items required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.pcmso_versions version
    where version.id = target_pcmso_version_id
      and version.tenant_id = target_tenant_id
      and version.status = 'approved'
  ) then
    raise exception 'approved pcmso version not found' using errcode = 'P0002';
  end if;

  insert into public.exam_protocols (
    tenant_id,
    pcmso_version_id,
    occupational_exam_type,
    status
  )
  values (
    target_tenant_id,
    target_pcmso_version_id,
    occupational_exam_type_value,
    case when activate_protocol then 'approved' else 'draft' end
  )
  returning id into protocol_id;

  if activate_protocol then
    update public.exam_protocols
    set status = 'inactive', updated_at = now()
    where tenant_id = target_tenant_id
      and pcmso_version_id = target_pcmso_version_id
      and occupational_exam_type = occupational_exam_type_value
      and id <> protocol_id
      and status = 'approved';
  end if;

  for item in
    select value
    from jsonb_array_elements(items_value) as elements(value)
  loop
    item_exam_id := nullif(item.value ->> 'examCatalogId', '')::uuid;
    item_required := coalesce((item.value ->> 'required')::boolean, true);
    item_conditions := coalesce(item.value -> 'conditions', '{}'::jsonb);

    if item_exam_id is null then
      raise exception 'invalid protocol item' using errcode = '22023';
    end if;

    if not exists (
      select 1
      from public.exam_catalog catalog
      where catalog.id = item_exam_id
        and catalog.tenant_id = target_tenant_id
        and catalog.active
    ) then
      raise exception 'exam catalog item not found' using errcode = 'P0002';
    end if;

    insert into public.exam_protocol_items (
      tenant_id,
      exam_protocol_id,
      exam_catalog_id,
      required,
      conditions
    )
    values (
      target_tenant_id,
      protocol_id,
      item_exam_id,
      item_required,
      item_conditions
    );
  end loop;

  perform public.append_audit_log(
    target_tenant_id,
    'exam_protocol.package_created',
    'exam_protocol',
    protocol_id,
    audit_request_id,
    jsonb_build_object(
      'activated', activate_protocol,
      'occupationalExamType', occupational_exam_type_value,
      'pcmsoVersionId', target_pcmso_version_id
    )
  );

  return protocol_id;
end;
$$;

revoke all on function public.create_exam_protocol_package(uuid, uuid, text, jsonb, boolean, text) from public;
grant execute on function public.create_exam_protocol_package(uuid, uuid, text, jsonb, boolean, text) to authenticated;
