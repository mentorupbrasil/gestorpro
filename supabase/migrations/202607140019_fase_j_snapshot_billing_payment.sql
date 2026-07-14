-- Fase J checkpoint: snapshot imutável + billing a partir do snapshot + pagamento.

create or replace function public.reject_encounter_price_snapshot_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'encounter price snapshots are immutable' using errcode = '42501';
end;
$$;

drop trigger if exists encounter_price_snapshots_immutable on public.encounter_price_snapshots;
create trigger encounter_price_snapshots_immutable
before update or delete on public.encounter_price_snapshots
for each row execute function public.reject_encounter_price_snapshot_mutation();

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
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'finance.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if snapshot_payload_value is null or snapshot_payload_value = '{}'::jsonb then
    raise exception 'snapshot payload required' using errcode = '22023';
  end if;

  if nullif(trim(content_hash_value), '') is null then
    raise exception 'content hash required' using errcode = '22023';
  end if;

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
    snapshot_payload_value,
    content_hash_value,
    auth.uid()
  )
  returning id into snapshot_id;

  perform public.append_audit_log(
    target_tenant_id,
    'finance.price_snapshot.created',
    'encounter_price_snapshots',
    snapshot_id,
    audit_request_id,
    jsonb_build_object('encounterId', target_encounter_id)
  );

  return snapshot_id;
end;
$$;

create or replace function public.create_billing_from_snapshot(
  target_tenant_id uuid,
  target_snapshot_id uuid,
  audit_request_id text
)
returns int
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  snapshot_record record;
  company_id uuid;
  item jsonb;
  amount_cents int;
  is_billable boolean;
  is_repeat boolean;
  description_value text;
  created_count int := 0;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'finance.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select
    snapshot.id,
    snapshot.encounter_id,
    snapshot.contract_id,
    snapshot.snapshot_payload,
    snapshot.content_hash
  into snapshot_record
  from public.encounter_price_snapshots snapshot
  where snapshot.id = target_snapshot_id
    and snapshot.tenant_id = target_tenant_id;

  if snapshot_record.id is null then
    raise exception 'snapshot not found' using errcode = 'P0002';
  end if;

  select contract.company_id into company_id
  from public.commercial_contracts contract
  where contract.id = snapshot_record.contract_id
    and contract.tenant_id = target_tenant_id;

  if company_id is null then
    raise exception 'contract company not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.billing_items item
    where item.tenant_id = target_tenant_id
      and item.encounter_id = snapshot_record.encounter_id
      and item.status <> 'cancelled'
  ) then
    raise exception 'billing already exists for encounter' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(snapshot_record.snapshot_payload -> 'items', '[]'::jsonb)) = 'array'
     and jsonb_array_length(snapshot_record.snapshot_payload -> 'items') > 0 then
    for item in
      select value from jsonb_array_elements(snapshot_record.snapshot_payload -> 'items') as elements(value)
    loop
      amount_cents := coalesce((item ->> 'amountCents')::int, 0);
      is_billable := coalesce((item ->> 'billable')::boolean, true);
      is_repeat := coalesce((item ->> 'technicalRepeat')::boolean, false);
      description_value := coalesce(nullif(trim(item ->> 'description'), ''), 'Item faturável');

      if is_repeat then
        is_billable := false;
      end if;

      insert into public.billing_items (
        tenant_id,
        company_id,
        encounter_id,
        description,
        amount_cents,
        billable,
        non_billable_reason,
        status,
        price_snapshot
      )
      values (
        target_tenant_id,
        company_id,
        snapshot_record.encounter_id,
        description_value,
        greatest(amount_cents, 0),
        is_billable,
        case
          when is_repeat then 'technical_repeat'
          when not is_billable then coalesce(nullif(trim(item ->> 'nonBillableReason'), ''), 'courtesy')
          else null
        end,
        case when is_billable then 'ready' else 'pending' end,
        jsonb_build_object(
          'snapshotId', snapshot_record.id,
          'contentHash', snapshot_record.content_hash,
          'item', item
        )
      );

      created_count := created_count + 1;
    end loop;
  else
    amount_cents := coalesce((snapshot_record.snapshot_payload ->> 'totalCents')::int, 0);
    insert into public.billing_items (
      tenant_id,
      company_id,
      encounter_id,
      description,
      amount_cents,
      billable,
      status,
      price_snapshot
    )
    values (
      target_tenant_id,
      company_id,
      snapshot_record.encounter_id,
      coalesce(nullif(trim(snapshot_record.snapshot_payload ->> 'description'), ''), 'Atendimento ocupacional'),
      greatest(amount_cents, 0),
      true,
      'ready',
      jsonb_build_object(
        'snapshotId', snapshot_record.id,
        'contentHash', snapshot_record.content_hash,
        'payload', snapshot_record.snapshot_payload
      )
    );
    created_count := 1;
  end if;

  perform public.append_audit_log(
    target_tenant_id,
    'finance.billing.created_from_snapshot',
    'encounter_price_snapshots',
    target_snapshot_id,
    audit_request_id,
    jsonb_build_object('createdCount', created_count)
  );

  return created_count;
end;
$$;

create or replace function public.issue_invoice(
  target_tenant_id uuid,
  target_company_id uuid,
  billing_item_ids uuid[],
  due_on_value date,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  invoice_id uuid;
  total_value int;
  selected_count int;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'finance.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if billing_item_ids is null or cardinality(billing_item_ids) < 1 then
    raise exception 'billing items required' using errcode = '22023';
  end if;

  select count(*), coalesce(sum(amount_cents), 0)
    into selected_count, total_value
  from public.billing_items item
  where item.tenant_id = target_tenant_id
    and item.company_id = target_company_id
    and item.id = any(billing_item_ids)
    and item.status in ('pending', 'ready')
    and item.billable = true;

  if selected_count < 1 then
    raise exception 'no billable items selected' using errcode = '22023';
  end if;

  insert into public.invoices (tenant_id, company_id, status, total_cents, due_on, issued_at, created_by)
  values (target_tenant_id, target_company_id, 'issued', total_value, due_on_value, now(), auth.uid())
  returning id into invoice_id;

  insert into public.invoice_items (tenant_id, invoice_id, billing_item_id, description, amount_cents)
  select target_tenant_id, invoice_id, item.id, item.description, item.amount_cents
  from public.billing_items item
  where item.tenant_id = target_tenant_id
    and item.company_id = target_company_id
    and item.id = any(billing_item_ids)
    and item.status in ('pending', 'ready')
    and item.billable = true;

  update public.billing_items
    set status = 'invoiced'
  where tenant_id = target_tenant_id
    and company_id = target_company_id
    and id = any(billing_item_ids)
    and billable = true
    and status in ('pending', 'ready');

  perform public.append_audit_log(
    target_tenant_id,
    'invoice.issued',
    'invoices',
    invoice_id,
    audit_request_id,
    jsonb_build_object('totalCents', total_value, 'itemCount', selected_count)
  );

  return invoice_id;
end;
$$;

create or replace function public.record_invoice_payment(
  target_tenant_id uuid,
  target_invoice_id uuid,
  amount_cents_value int,
  method_value text,
  reference_value text,
  paid_at_value timestamptz,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  invoice_record record;
  payment_id uuid;
  paid_total int;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'finance.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if amount_cents_value is null or amount_cents_value <= 0 then
    raise exception 'payment amount required' using errcode = '22023';
  end if;

  if nullif(trim(method_value), '') is null then
    raise exception 'payment method required' using errcode = '22023';
  end if;

  select invoice.id, invoice.status, invoice.total_cents
    into invoice_record
  from public.invoices invoice
  where invoice.id = target_invoice_id
    and invoice.tenant_id = target_tenant_id
  for update;

  if invoice_record.id is null then
    raise exception 'invoice not found' using errcode = 'P0002';
  end if;

  if invoice_record.status in ('cancelled', 'paid') then
    raise exception 'invoice not open for payment' using errcode = '22023';
  end if;

  insert into public.payments (
    tenant_id,
    invoice_id,
    amount_cents,
    paid_at,
    method,
    reference,
    created_by
  )
  values (
    target_tenant_id,
    target_invoice_id,
    amount_cents_value,
    coalesce(paid_at_value, now()),
    trim(method_value),
    nullif(trim(reference_value), ''),
    auth.uid()
  )
  returning id into payment_id;

  select coalesce(sum(amount_cents), 0) into paid_total
  from public.payments
  where tenant_id = target_tenant_id
    and invoice_id = target_invoice_id;

  update public.invoices
  set status = case
    when paid_total >= invoice_record.total_cents then 'paid'
    when paid_total > 0 then 'partially_paid'
    else status
  end
  where id = target_invoice_id
    and tenant_id = target_tenant_id;

  perform public.append_audit_log(
    target_tenant_id,
    'invoice.payment.recorded',
    'payments',
    payment_id,
    audit_request_id,
    jsonb_build_object(
      'invoiceId', target_invoice_id,
      'amountCents', amount_cents_value,
      'paidTotal', paid_total
    )
  );

  return payment_id;
end;
$$;

revoke all on function public.reject_encounter_price_snapshot_mutation() from public;
revoke all on function public.create_encounter_price_snapshot(uuid, uuid, uuid, uuid, jsonb, text, text) from public;
revoke all on function public.create_billing_from_snapshot(uuid, uuid, text) from public;
revoke all on function public.issue_invoice(uuid, uuid, uuid[], date, text) from public;
revoke all on function public.record_invoice_payment(uuid, uuid, int, text, text, timestamptz, text) from public;

grant execute on function public.create_encounter_price_snapshot(uuid, uuid, uuid, uuid, jsonb, text, text) to authenticated;
grant execute on function public.create_billing_from_snapshot(uuid, uuid, text) to authenticated;
grant execute on function public.issue_invoice(uuid, uuid, uuid[], date, text) to authenticated;
grant execute on function public.record_invoice_payment(uuid, uuid, int, text, text, timestamptz, text) to authenticated;
