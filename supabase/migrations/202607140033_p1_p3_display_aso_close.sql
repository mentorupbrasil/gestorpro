-- P1/P3: painel dispositivo (token/heartbeat), assinatura de conclusão,
-- encerramento ocupacional orquestrado, permissões unitárias em conclusão.

begin;

alter table public.display_panels
  add column if not exists device_token_hash text;

alter table public.display_panels
  add column if not exists privacy_mode text not null default 'token_only'
    check (privacy_mode in ('token_only', 'kiosk'));

alter table public.medical_conclusions
  add column if not exists version int not null default 1 check (version > 0);

alter table public.medical_conclusions
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists display_panels_device_token_hash_uq
  on public.display_panels (tenant_id, device_token_hash)
  where device_token_hash is not null;

create or replace function public.hash_device_token(token_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(convert_to(trim(token_value), 'UTF8'), 'sha256'), 'hex');
$$;

create or replace function public.issue_display_panel_device_token(
  target_tenant_id uuid,
  target_display_panel_id uuid,
  plain_token_value text,
  audit_request_id text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  panel_unit uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;
  if char_length(trim(plain_token_value)) < 24 then
    raise exception 'device token too short' using errcode = '22023';
  end if;

  select clinic_unit_id into panel_unit
  from public.display_panels
  where id = target_display_panel_id
    and tenant_id = target_tenant_id
  for update;

  if panel_unit is null then
    raise exception 'display panel not found' using errcode = 'P0002';
  end if;
  if not public.has_unit_permission(panel_unit, 'display.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  update public.display_panels
  set device_token_hash = public.hash_device_token(plain_token_value),
      updated_at = now()
  where id = target_display_panel_id
    and tenant_id = target_tenant_id;

  perform public.append_audit_log(
    target_tenant_id,
    'display_panel.device_token_issued',
    'display_panel',
    target_display_panel_id,
    audit_request_id,
    jsonb_build_object('rotated', true)
  );

  return true;
end;
$$;

create or replace function public.register_display_panel_session(
  device_token_value text,
  device_label_value text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  panel_record record;
  session_id uuid;
  token_hash text := public.hash_device_token(device_token_value);
begin
  select id, tenant_id, clinic_unit_id, status
    into panel_record
  from public.display_panels
  where device_token_hash = token_hash
    and status = 'active'
  for update;

  if panel_record.id is null then
    raise exception 'invalid device token' using errcode = '42501';
  end if;

  insert into public.display_panel_sessions (
    tenant_id, display_panel_id, device_label, status, last_heartbeat_at
  )
  values (
    panel_record.tenant_id,
    panel_record.id,
    coalesce(nullif(trim(device_label_value), ''), 'kiosk'),
    'online',
    now()
  )
  returning id into session_id;

  return session_id;
end;
$$;

create or replace function public.heartbeat_display_panel_session(
  device_token_value text,
  target_session_id uuid
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  panel_id uuid;
  token_hash text := public.hash_device_token(device_token_value);
begin
  select panel.id into panel_id
  from public.display_panels panel
  where panel.device_token_hash = token_hash
    and panel.status = 'active';

  if panel_id is null then
    raise exception 'invalid device token' using errcode = '42501';
  end if;

  update public.display_panel_sessions
  set last_heartbeat_at = now(),
      status = 'online'
  where id = target_session_id
    and display_panel_id = panel_id;

  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;

  return true;
end;
$$;

create or replace function public.get_display_panel_public_state(
  device_token_value text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  panel_record record;
  active_call jsonb;
  recent jsonb;
  token_hash text := public.hash_device_token(device_token_value);
begin
  select id, tenant_id, clinic_unit_id, name, channel_name, privacy_mode
    into panel_record
  from public.display_panels
  where device_token_hash = token_hash
    and status = 'active';

  if panel_record.id is null then
    raise exception 'invalid device token' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'callEventId', call_event.id,
    'action', call_event.action,
    'payload', call_event.payload_public,
    'createdAt', call_event.created_at
  )
    into active_call
  from public.call_events call_event
  where call_event.display_panel_id = panel_record.id
    and call_event.tenant_id = panel_record.tenant_id
    and call_event.status = 'active'
  order by call_event.created_at desc
  limit 1;

  select coalesce(jsonb_agg(item order by item->>'createdAt' desc), '[]'::jsonb)
    into recent
  from (
    select jsonb_build_object(
      'ticketCode', call_event.payload_public ->> 'ticketCode',
      'room', call_event.payload_public ->> 'room',
      'createdAt', call_event.created_at
    ) as item
    from public.call_events call_event
    where call_event.display_panel_id = panel_record.id
      and call_event.tenant_id = panel_record.tenant_id
    order by call_event.created_at desc
    limit 8
  ) listed;

  return jsonb_build_object(
    'panelName', panel_record.name,
    'channelName', panel_record.channel_name,
    'privacyMode', panel_record.privacy_mode,
    'activeCall', active_call,
    'recentCalls', recent,
    'serverTime', now()
  );
end;
$$;

create or replace function public.acknowledge_call_delivery(
  device_token_value text,
  target_call_event_id uuid,
  target_session_id uuid,
  ack_kind text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  panel_id uuid;
  token_hash text := public.hash_device_token(device_token_value);
begin
  if ack_kind not in ('delivered', 'acknowledged', 'displayed') then
    raise exception 'invalid ack kind' using errcode = '22023';
  end if;

  select id into panel_id
  from public.display_panels
  where device_token_hash = token_hash
    and status = 'active';

  if panel_id is null then
    raise exception 'invalid device token' using errcode = '42501';
  end if;

  update public.call_deliveries delivery
  set status = case
        when ack_kind = 'delivered' then 'delivered'
        else 'acknowledged'
      end,
      delivered_at = coalesce(delivery.delivered_at, now()),
      acknowledged_at = case when ack_kind <> 'delivered' then now() else delivery.acknowledged_at end
  from public.call_events call_event
  where delivery.call_event_id = call_event.id
    and call_event.id = target_call_event_id
    and call_event.display_panel_id = panel_id
    and delivery.display_panel_session_id = target_session_id;

  return true;
end;
$$;

create or replace function public.sign_medical_conclusion(
  target_tenant_id uuid,
  target_conclusion_id uuid,
  expected_version int,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conclusion_record record;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  select *
    into conclusion_record
  from public.medical_conclusions conclusion
  where conclusion.id = target_conclusion_id
    and conclusion.tenant_id = target_tenant_id
  for update;

  if conclusion_record.id is null then
    raise exception 'medical conclusion not found' using errcode = 'P0002';
  end if;

  if conclusion_record.version is distinct from expected_version then
    raise exception 'version conflict' using errcode = '40001';
  end if;

  if not public.has_encounter_permission(conclusion_record.encounter_id, 'conclusions.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if conclusion_record.signature_status = 'signed' then
    return conclusion_record.id;
  end if;

  if conclusion_record.signature_status <> 'prepared' then
    raise exception 'conclusion cannot be signed' using errcode = '42501';
  end if;

  update public.medical_conclusions
  set signature_status = 'signed',
      signed_at = now(),
      version = version + 1,
      updated_at = now()
  where id = conclusion_record.id;

  insert into public.encounter_events (
    tenant_id, encounter_id, event_type, created_by, payload
  )
  values (
    target_tenant_id,
    conclusion_record.encounter_id,
    'conclusion.signed',
    auth.uid(),
    jsonb_build_object('conclusionId', conclusion_record.id)
  );

  perform public.append_audit_log(
    target_tenant_id,
    'medical_conclusion.signed',
    'medical_conclusion',
    conclusion_record.id,
    audit_request_id,
    jsonb_build_object('after', jsonb_build_object('signature_status', 'signed'))
  );

  return conclusion_record.id;
end;
$$;

create or replace function public.close_occupational_encounter(
  target_tenant_id uuid,
  target_encounter_id uuid,
  expected_version int,
  idempotency_key_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  existing_response jsonb;
  encounter_record record;
  open_steps int;
  pending_exams int;
  has_signed_conclusion boolean;
  has_signed_aso boolean;
  has_billing boolean;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  select response_reference into existing_response
  from public.idempotency_keys
  where tenant_id = target_tenant_id
    and scope = 'encounter-close'
    and key = idempotency_key_value
  for update;

  if existing_response ? 'encounterId' then
    return (existing_response ->> 'encounterId')::uuid;
  end if;

  select * into encounter_record
  from public.encounters encounter
  where encounter.id = target_encounter_id
    and encounter.tenant_id = target_tenant_id
  for update;

  if encounter_record.id is null then
    raise exception 'encounter not found' using errcode = 'P0002';
  end if;

  if encounter_record.version is distinct from expected_version then
    raise exception 'version conflict' using errcode = '40001';
  end if;

  if not public.has_unit_permission(encounter_record.clinic_unit_id, 'encounters.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if encounter_record.status = 'completed' then
    return encounter_record.id;
  end if;

  select count(*)::int into open_steps
  from public.encounter_steps step
  where step.encounter_id = encounter_record.id
    and step.tenant_id = target_tenant_id
    and step.step_type in ('reception', 'triage', 'consultation', 'conclusion', 'document', 'billing')
    and step.status not in ('completed', 'cancelled');

  if open_steps > 0 then
    raise exception 'mandatory steps still open' using errcode = '22023';
  end if;

  select count(*)::int into pending_exams
  from public.exam_orders exam_order
  where exam_order.encounter_id = encounter_record.id
    and exam_order.tenant_id = target_tenant_id
    and exam_order.status in ('ordered', 'collected');

  if pending_exams > 0 then
    raise exception 'required exams pending' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.medical_conclusions conclusion
    where conclusion.encounter_id = encounter_record.id
      and conclusion.tenant_id = target_tenant_id
      and conclusion.signature_status = 'signed'
  ) into has_signed_conclusion;

  if not has_signed_conclusion then
    raise exception 'signed medical conclusion required' using errcode = '22023';
  end if;

  select exists (
    select 1
    from public.generated_documents document
    join public.document_versions version
      on version.generated_document_id = document.id
     and version.tenant_id = document.tenant_id
    join public.document_signatures signature
      on signature.document_version_id = version.id
     and signature.tenant_id = version.tenant_id
    where document.encounter_id = encounter_record.id
      and document.tenant_id = target_tenant_id
      and document.document_type = 'aso'
  ) into has_signed_aso;

  if not has_signed_aso then
    raise exception 'signed ASO document required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.encounter_price_snapshots snapshot
    where snapshot.encounter_id = encounter_record.id
      and snapshot.tenant_id = target_tenant_id
  ) then
    raise exception 'price snapshot required before close' using errcode = '22023';
  end if;

  select exists (
    select 1
    from public.billing_items billing_item
    join public.invoice_items invoice_item
      on invoice_item.billing_item_id = billing_item.id
     and invoice_item.tenant_id = billing_item.tenant_id
    join public.invoices invoice
      on invoice.id = invoice_item.invoice_id
     and invoice.tenant_id = billing_item.tenant_id
    where billing_item.encounter_id = encounter_record.id
      and billing_item.tenant_id = target_tenant_id
      and invoice.status in ('issued', 'partially_paid', 'paid')
  ) into has_billing;

  if not has_billing then
    raise exception 'consolidated invoice required before close' using errcode = '22023';
  end if;

  insert into public.idempotency_keys (tenant_id, scope, key, request_hash, expires_at)
  values (
    target_tenant_id,
    'encounter-close',
    idempotency_key_value,
    coalesce(nullif(trim(audit_request_id), ''), idempotency_key_value),
    now() + interval '1 day'
  )
  on conflict (tenant_id, scope, key) do nothing;

  update public.encounters
  set status = 'completed',
      version = version + 1,
      updated_at = now()
  where id = encounter_record.id;

  insert into public.encounter_events (
    tenant_id, encounter_id, event_type, created_by, payload
  )
  values (
    target_tenant_id,
    encounter_record.id,
    'encounter.closed',
    auth.uid(),
    jsonb_build_object('billingConsolidated', coalesce(has_billing, false))
  );

  insert into public.outbox_events (
    tenant_id, aggregate_type, aggregate_id, event_type, payload_redacted
  )
  values (
    target_tenant_id,
    'encounter',
    encounter_record.id,
    'encounter.closed',
    jsonb_build_object('clinicUnitId', encounter_record.clinic_unit_id)
  );

  update public.idempotency_keys
  set response_reference = jsonb_build_object('encounterId', encounter_record.id)
  where tenant_id = target_tenant_id
    and scope = 'encounter-close'
    and key = idempotency_key_value;

  perform public.append_audit_log(
    target_tenant_id,
    'encounter.closed',
    'encounter',
    encounter_record.id,
    audit_request_id,
    jsonb_build_object('status', 'completed')
  );

  return encounter_record.id;
end;
$$;

-- conclusão médica: permissão unitária via encounter (compatível com papéis P0)
create or replace function public.create_medical_conclusion(
  target_tenant_id uuid,
  target_encounter_id uuid,
  consultation_id_value uuid,
  physician_credential_id_value uuid,
  conclusion_code_value text,
  restrictions_value jsonb,
  notes_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conclusion_id uuid;
  rule_record record;
  credential_record record;
  encounter_unit uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  select clinic_unit_id into encounter_unit
  from public.encounters
  where id = target_encounter_id
    and tenant_id = target_tenant_id
  for share;

  if encounter_unit is null then
    raise exception 'encounter not found' using errcode = 'P0002';
  end if;

  if not public.has_unit_permission(encounter_unit, 'conclusions.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select *
    into credential_record
  from public.clinical_professional_credentials
  where id = physician_credential_id_value
    and tenant_id = target_tenant_id
    and user_id = auth.uid()
    and professional_role = 'physician'
    and status = 'active';

  if credential_record.id is null then
    raise exception 'physician credential missing' using errcode = '42501';
  end if;

  if credential_record.council_code is null
    or credential_record.council_region is null
    or credential_record.registration_number is null then
    raise exception 'professional registration missing' using errcode = '22023';
  end if;

  if conclusion_code_value = 'fit_with_restrictions'
     and jsonb_typeof(coalesce(restrictions_value, 'null'::jsonb)) <> 'array' then
    raise exception 'restrictions required for fit_with_restrictions' using errcode = '22023';
  end if;

  if conclusion_code_value in ('unfit', 'inconclusive')
     and char_length(trim(coalesce(notes_value, ''))) < 10 then
    raise exception 'justification required for unfit/inconclusive' using errcode = '22023';
  end if;

  select *
    into rule_record
  from public.medical_conclusion_rules
  where tenant_id = target_tenant_id
    and status = 'active'
  order by created_at desc
  limit 1;

  if coalesce(rule_record.block_when_no_closed_triage, true)
    and not exists (
      select 1 from public.triage_records triage
      where triage.tenant_id = target_tenant_id
        and triage.encounter_id = target_encounter_id
        and triage.status = 'closed'
    ) then
    raise exception 'closed triage required' using errcode = '22023';
  end if;

  if coalesce(rule_record.block_when_no_closed_consultation, true)
    and not exists (
      select 1 from public.medical_consultations consultation
      where consultation.tenant_id = target_tenant_id
        and consultation.id = consultation_id_value
        and consultation.encounter_id = target_encounter_id
        and consultation.status = 'closed'
    ) then
    raise exception 'closed consultation required' using errcode = '22023';
  end if;

  if coalesce(rule_record.block_when_pending_required_exams, true)
    and exists (
      select 1 from public.exam_orders exam_order
      where exam_order.tenant_id = target_tenant_id
        and exam_order.encounter_id = target_encounter_id
        and exam_order.status in ('ordered', 'collected')
    ) then
    raise exception 'required exams pending' using errcode = '22023';
  end if;

  if coalesce(rule_record.block_when_flow_paused, true)
    and exists (
      select 1 from public.encounter_flow_pauses pause
      where pause.tenant_id = target_tenant_id
        and pause.encounter_id = target_encounter_id
        and pause.status = 'active'
    ) then
    raise exception 'encounter flow paused' using errcode = '22023';
  end if;

  insert into public.medical_conclusions (
    tenant_id,
    encounter_id,
    consultation_id,
    physician_credential_id,
    conclusion_code,
    restrictions,
    notes,
    signature_status,
    created_by
  )
  values (
    target_tenant_id,
    target_encounter_id,
    consultation_id_value,
    physician_credential_id_value,
    conclusion_code_value,
    coalesce(restrictions_value, '[]'::jsonb),
    nullif(trim(notes_value), ''),
    'prepared',
    auth.uid()
  )
  returning id into conclusion_id;

  perform public.append_audit_log(
    target_tenant_id,
    'medical_conclusion.prepared',
    'medical_conclusion',
    conclusion_id,
    audit_request_id,
    jsonb_build_object('conclusionCode', conclusion_code_value)
  );

  return conclusion_id;
end;
$$;

revoke all on function public.hash_device_token(text) from public, anon, authenticated;
revoke all on function public.issue_display_panel_device_token(uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.register_display_panel_session(text, text)
  from public, anon, authenticated;
revoke all on function public.heartbeat_display_panel_session(text, uuid)
  from public, anon, authenticated;
revoke all on function public.get_display_panel_public_state(text)
  from public, anon, authenticated;
revoke all on function public.acknowledge_call_delivery(text, uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.sign_medical_conclusion(uuid, uuid, int, text)
  from public, anon, authenticated;
revoke all on function public.close_occupational_encounter(uuid, uuid, int, text, text)
  from public, anon, authenticated;
revoke all on function public.create_medical_conclusion(uuid, uuid, uuid, uuid, text, jsonb, text, text)
  from public, anon, authenticated;

grant execute on function public.issue_display_panel_device_token(uuid, uuid, text, text) to authenticated;
grant execute on function public.register_display_panel_session(text, text) to anon, authenticated;
grant execute on function public.heartbeat_display_panel_session(text, uuid) to anon, authenticated;
grant execute on function public.get_display_panel_public_state(text) to anon, authenticated;
grant execute on function public.acknowledge_call_delivery(text, uuid, uuid, text) to anon, authenticated;
grant execute on function public.sign_medical_conclusion(uuid, uuid, int, text) to authenticated;
grant execute on function public.close_occupational_encounter(uuid, uuid, int, text, text) to authenticated;
grant execute on function public.create_medical_conclusion(uuid, uuid, uuid, uuid, text, jsonb, text, text) to authenticated;

commit;
