-- Estabilização: snapshot de preço resolve unit_price_cents no servidor (não confiar no cliente).

create or replace function public.create_encounter_price_snapshot(
  target_tenant_id uuid,
  target_encounter_id uuid,
  target_contract_id uuid,
  target_price_table_id uuid,
  snapshot_payload_value jsonb,
  content_hash_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  snapshot_id uuid;
  price_table_record record;
  source_items jsonb;
  resolved_items jsonb := '[]'::jsonb;
  source_item jsonb;
  billable_code_value text;
  unit_price int;
  item_description text;
  is_repeat boolean;
  repeat_billable boolean;
  is_billable boolean;
  resolved_payload jsonb;
  expected_hash text;
  total_cents int := 0;
begin
  -- content_hash_value mantido na assinatura; preço/hash finais são sempre do servidor.
  perform coalesce(content_hash_value, '');

  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'finance.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.encounters encounter
    where encounter.id = target_encounter_id
      and encounter.tenant_id = target_tenant_id
  ) then
    raise exception 'encounter not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.commercial_contracts contract
    where contract.id = target_contract_id
      and contract.tenant_id = target_tenant_id
  ) then
    raise exception 'contract not found' using errcode = 'P0002';
  end if;

  select
    price_table.id,
    price_table.contract_id,
    price_table.status
  into price_table_record
  from public.commercial_price_tables price_table
  where price_table.id = target_price_table_id
    and price_table.tenant_id = target_tenant_id;

  if price_table_record.id is null then
    raise exception 'price table not found' using errcode = 'P0002';
  end if;

  if price_table_record.contract_id <> target_contract_id then
    raise exception 'price table does not belong to contract' using errcode = '22023';
  end if;

  if price_table_record.status <> 'approved' then
    raise exception 'price table must be approved' using errcode = '22023';
  end if;

  source_items := coalesce(snapshot_payload_value -> 'items', '[]'::jsonb);
  if jsonb_typeof(source_items) <> 'array' or jsonb_array_length(source_items) = 0 then
    raise exception 'snapshot items required' using errcode = '22023';
  end if;

  for source_item in
    select value from jsonb_array_elements(source_items) as elements(value)
  loop
    billable_code_value := nullif(trim(coalesce(source_item ->> 'billableCode', '')), '');
    if billable_code_value is null then
      raise exception 'billableCode required' using errcode = '22023';
    end if;

    select
      price_item.unit_price_cents,
      price_item.description,
      price_item.technical_repeat_billable
    into unit_price, item_description, repeat_billable
    from public.commercial_price_items price_item
    where price_item.tenant_id = target_tenant_id
      and price_item.price_table_id = target_price_table_id
      and price_item.billable_code = billable_code_value;

    if unit_price is null then
      raise exception 'price item not found for billable code' using errcode = 'P0002';
    end if;

    is_repeat := coalesce((source_item ->> 'technicalRepeat')::boolean, false);
    is_billable := not is_repeat or coalesce(repeat_billable, false);

    if is_repeat and not coalesce(repeat_billable, false) then
      is_billable := false;
    end if;

    if is_billable then
      total_cents := total_cents + unit_price;
    end if;

    resolved_items := resolved_items || jsonb_build_array(
      jsonb_build_object(
        'billableCode', billable_code_value,
        'description', item_description,
        'amountCents', unit_price,
        'billable', is_billable,
        'technicalRepeat', is_repeat,
        'nonBillableReason', case
          when is_repeat and not is_billable then 'technical_repeat'
          when not is_billable then coalesce(
            nullif(trim(source_item ->> 'nonBillableReason'), ''),
            'non_billable'
          )
          else null
        end
      )
    );
  end loop;

  resolved_payload := jsonb_build_object(
    'description', 'Snapshot comercial do atendimento',
    'items', resolved_items,
    'totalCents', total_cents,
    'source', 'server_price_table'
  );

  expected_hash := encode(digest(resolved_payload::text, 'sha256'), 'hex');

  insert into public.encounter_price_snapshots (
    tenant_id,
    encounter_id,
    contract_id,
    price_table_id,
    snapshot_payload,
    content_hash,
    created_by
  )
  values (
    target_tenant_id,
    target_encounter_id,
    target_contract_id,
    target_price_table_id,
    resolved_payload,
    expected_hash,
    auth.uid()
  )
  returning id into snapshot_id;

  perform public.append_audit_log(
    target_tenant_id,
    'finance.price_snapshot.created',
    'encounter_price_snapshots',
    snapshot_id,
    audit_request_id,
    jsonb_build_object(
      'encounterId', target_encounter_id,
      'totalCents', total_cents,
      'source', 'server_price_table'
    )
  );

  return snapshot_id;
end;
$$;

revoke all on function public.create_encounter_price_snapshot(uuid, uuid, uuid, uuid, jsonb, text, text) from public;
grant execute on function public.create_encounter_price_snapshot(uuid, uuid, uuid, uuid, jsonb, text, text) to authenticated;
