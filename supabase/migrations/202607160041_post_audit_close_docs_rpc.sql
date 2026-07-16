-- 041: Post-audit hard fixes — close bypass, document fail-closed, RPC surface, readiness.
-- Does NOT edit 037–040. Applied only on empty/upgrade paths via new migration.

begin;

-- ---------------------------------------------------------------------------
-- 0) Default privileges: future functions must grant execute explicitly
-- ---------------------------------------------------------------------------
alter default privileges in schema public
  revoke execute on functions from public;

alter default privileges in schema public
  revoke execute on functions from anon;

alter default privileges in schema public
  revoke execute on functions from authenticated;

-- ---------------------------------------------------------------------------
-- 1) Appointment / referral status expansion (check-in must not complete)
-- ---------------------------------------------------------------------------
alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments
  add constraint appointments_status_check
  check (status in (
    'scheduled', 'confirmed', 'checked_in', 'in_service',
    'completed', 'cancelled', 'no_show', 'rescheduled'
  ));

alter table public.referrals drop constraint if exists referrals_status_check;
alter table public.referrals
  add constraint referrals_status_check
  check (status in (
    'draft', 'pending_review', 'ready_to_schedule', 'approved',
    'scheduled', 'checked_in', 'in_progress', 'completed',
    'cancelled', 'expired'
  ));

alter table public.encounter_steps drop constraint if exists encounter_steps_status_check;
alter table public.encounter_steps
  add constraint encounter_steps_status_check
  check (status in (
    'pending', 'available', 'in_progress', 'blocked',
    'completed', 'cancelled', 'waived', 'no_show', 'failed'
  ));

-- Backfill delivery step for open encounters that only have document → billing.
insert into public.encounter_steps (
  tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
)
select
  document_step.tenant_id,
  document_step.encounter_id,
  'delivery',
  case
    when document_step.status = 'completed' and billing_step.status in ('completed', 'waived')
      then 'completed'
    when document_step.status = 'completed' then 'available'
    else 'blocked'
  end,
  document_step.sequence + 1,
  document_step.id
from public.encounter_steps document_step
join public.encounters encounter
  on encounter.id = document_step.encounter_id
 and encounter.tenant_id = document_step.tenant_id
left join public.encounter_steps billing_step
  on billing_step.encounter_id = document_step.encounter_id
 and billing_step.tenant_id = document_step.tenant_id
 and billing_step.step_type = 'billing'
where document_step.step_type = 'document'
  and encounter.status in ('checked_in', 'in_progress', 'waiting')
  and not exists (
    select 1 from public.encounter_steps existing
    where existing.encounter_id = document_step.encounter_id
      and existing.tenant_id = document_step.tenant_id
      and existing.step_type = 'delivery'
  );

update public.encounter_steps billing_step
set depends_on_step_id = delivery_step.id,
    sequence = greatest(billing_step.sequence, delivery_step.sequence + 1),
    updated_at = now()
from public.encounter_steps delivery_step
where billing_step.tenant_id = delivery_step.tenant_id
  and billing_step.encounter_id = delivery_step.encounter_id
  and billing_step.step_type = 'billing'
  and delivery_step.step_type = 'delivery'
  and billing_step.depends_on_step_id is distinct from delivery_step.id;

insert into public.encounter_step_dependencies (
  tenant_id, encounter_id, step_id, depends_on_step_id, dependency_group, is_required
)
select
  delivery_step.tenant_id,
  delivery_step.encounter_id,
  delivery_step.id,
  document_step.id,
  'post_consult',
  true
from public.encounter_steps delivery_step
join public.encounter_steps document_step
  on document_step.encounter_id = delivery_step.encounter_id
 and document_step.tenant_id = delivery_step.tenant_id
 and document_step.step_type = 'document'
where delivery_step.step_type = 'delivery'
on conflict (tenant_id, step_id, depends_on_step_id) do nothing;

insert into public.encounter_step_dependencies (
  tenant_id, encounter_id, step_id, depends_on_step_id, dependency_group, is_required
)
select
  billing_step.tenant_id,
  billing_step.encounter_id,
  billing_step.id,
  delivery_step.id,
  'post_consult',
  true
from public.encounter_steps billing_step
join public.encounter_steps delivery_step
  on delivery_step.encounter_id = billing_step.encounter_id
 and delivery_step.tenant_id = billing_step.tenant_id
 and delivery_step.step_type = 'delivery'
where billing_step.step_type = 'billing'
on conflict (tenant_id, step_id, depends_on_step_id) do nothing;

-- ---------------------------------------------------------------------------
-- 2) Document versions: storage verification columns + immutable exception
-- ---------------------------------------------------------------------------
alter table public.document_versions
  add column if not exists storage_verified_at timestamptz,
  add column if not exists storage_size_bytes bigint,
  add column if not exists storage_mime_type text,
  add column if not exists storage_verification_id text,
  add column if not exists render_failure_reason text;

create or replace function public.reject_document_version_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and current_setting('app.document_render_finalize', true) = 'on'
     and old.render_status in ('pending', 'rendering')
     and new.render_status in ('rendered', 'failed')
     and new.tenant_id is not distinct from old.tenant_id
     and new.generated_document_id is not distinct from old.generated_document_id
     and new.version is not distinct from old.version
     and new.snapshot_payload is not distinct from old.snapshot_payload
     and new.storage_bucket is not distinct from old.storage_bucket
     and new.storage_path is not distinct from old.storage_path
     and new.rectification_reason is not distinct from old.rectification_reason
     and new.created_by is not distinct from old.created_by
     and new.print_config is not distinct from old.print_config
  then
    return new;
  end if;

  raise exception 'document versions are immutable' using errcode = '42501';
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Finalize render — service_role only, with storage verification payload
-- ---------------------------------------------------------------------------
drop function if exists public.finalize_document_version_render(uuid, uuid, text, text, text);

create or replace function public.finalize_document_version_render(
  target_tenant_id uuid,
  target_document_version_id uuid,
  render_status_value text,
  content_hash_value text,
  storage_size_bytes_value bigint,
  storage_mime_type_value text,
  storage_verification_id_value text,
  failure_reason_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_status text;
  current_bucket text;
  current_path text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service_role required for document finalize' using errcode = '42501';
  end if;

  if render_status_value not in ('rendered', 'failed') then
    raise exception 'invalid render status' using errcode = '22023';
  end if;

  if render_status_value = 'rendered' then
    if nullif(trim(content_hash_value), '') is null then
      raise exception 'content hash required' using errcode = '22023';
    end if;
    if coalesce(storage_size_bytes_value, 0) <= 0 then
      raise exception 'storage size must be > 0' using errcode = '22023';
    end if;
    if coalesce(storage_mime_type_value, '') is distinct from 'application/pdf' then
      raise exception 'storage mime must be application/pdf' using errcode = '22023';
    end if;
    if nullif(trim(storage_verification_id_value), '') is null then
      raise exception 'storage verification id required' using errcode = '22023';
    end if;
  end if;

  select version.render_status, version.storage_bucket, version.storage_path
    into current_status, current_bucket, current_path
  from public.document_versions version
  where version.id = target_document_version_id
    and version.tenant_id = target_tenant_id
  for update;

  if current_status is null then
    raise exception 'document version not found' using errcode = 'P0002';
  end if;

  if current_status not in ('pending', 'rendering') then
    -- idempotent: already finalized with same hash
    if current_status = render_status_value
       and exists (
         select 1 from public.document_versions v
         where v.id = target_document_version_id
           and v.tenant_id = target_tenant_id
           and v.content_hash = content_hash_value
           and v.storage_verified_at is not null
       ) then
      return target_document_version_id;
    end if;
    raise exception 'document version already finalized' using errcode = '22023';
  end if;

  if current_bucket is distinct from 'clinical-private' then
    raise exception 'invalid storage bucket' using errcode = '22023';
  end if;

  if nullif(trim(current_path), '') is null then
    raise exception 'storage path missing' using errcode = '22023';
  end if;

  perform set_config('app.document_render_finalize', 'on', true);

  update public.document_versions
    set render_status = render_status_value,
        content_hash = case
          when render_status_value = 'rendered' then content_hash_value
          else content_hash
        end,
        storage_verified_at = case
          when render_status_value = 'rendered' then now()
          else null
        end,
        storage_size_bytes = case
          when render_status_value = 'rendered' then storage_size_bytes_value
          else null
        end,
        storage_mime_type = case
          when render_status_value = 'rendered' then storage_mime_type_value
          else null
        end,
        storage_verification_id = case
          when render_status_value = 'rendered' then storage_verification_id_value
          else null
        end,
        render_failure_reason = case
          when render_status_value = 'failed' then nullif(trim(failure_reason_value), '')
          else null
        end
  where id = target_document_version_id
    and tenant_id = target_tenant_id;

  perform public.append_audit_log(
    target_tenant_id,
    case when render_status_value = 'rendered'
      then 'document.render.finalized'
      else 'document.render.failed'
    end,
    'document_versions',
    target_document_version_id,
    audit_request_id,
    jsonb_build_object(
      'renderStatus', render_status_value,
      'storageVerified', render_status_value = 'rendered',
      'storageSizeBytes', storage_size_bytes_value
    )
  );

  return target_document_version_id;
end;
$$;

revoke all on function public.finalize_document_version_render(
  uuid, uuid, text, text, bigint, text, text, text, text
) from public, anon, authenticated;

grant execute on function public.finalize_document_version_render(
  uuid, uuid, text, text, bigint, text, text, text, text
) to service_role;

-- ---------------------------------------------------------------------------
-- 4) Canonical sign_document_version — fail-closed on storage/hash/vigente
-- ---------------------------------------------------------------------------
create or replace function public.sign_document_version(
  target_tenant_id uuid,
  target_document_version_id uuid,
  method_value text,
  aal_value text,
  ip_value inet,
  user_agent_value text,
  signed_hash_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  signature_id uuid;
  version_record record;
  document_record record;
  template_ok boolean;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if coalesce(aal_value, '') <> 'aal2' then
    raise exception 'document signing requires aal2' using errcode = '42501';
  end if;

  if method_value not in ('mfa_session', 'password_reauth', 'certificate_future') then
    raise exception 'invalid signature method' using errcode = '22023';
  end if;

  if nullif(trim(signed_hash_value), '') is null then
    raise exception 'signed hash required' using errcode = '22023';
  end if;

  select version.*
    into version_record
  from public.document_versions version
  where version.id = target_document_version_id
    and version.tenant_id = target_tenant_id
  for update;

  if version_record.id is null then
    raise exception 'document version not found' using errcode = 'P0002';
  end if;

  select document.*
    into document_record
  from public.generated_documents document
  where document.id = version_record.generated_document_id
    and document.tenant_id = target_tenant_id
  for update;

  if document_record.id is null then
    raise exception 'document not found' using errcode = 'P0002';
  end if;

  if document_record.encounter_id is null
     or not public.has_encounter_permission(document_record.encounter_id, 'documents.sign') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if document_record.status = 'revoked' then
    raise exception 'document revoked' using errcode = '22023';
  end if;

  if document_record.vigente_version_id is distinct from version_record.id then
    raise exception 'version is not vigente' using errcode = '22023';
  end if;

  if version_record.render_status is distinct from 'rendered' then
    raise exception 'document not rendered' using errcode = '22023';
  end if;

  if version_record.storage_verified_at is null then
    raise exception 'storage not verified' using errcode = '22023';
  end if;

  if version_record.content_hash is distinct from signed_hash_value then
    raise exception 'signed hash mismatch' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.document_signatures signature
    where signature.tenant_id = target_tenant_id
      and signature.document_version_id = target_document_version_id
  ) then
    raise exception 'document already signed' using errcode = '22023';
  end if;

  select exists (
    select 1
    from public.document_template_versions template_version
    join public.document_templates template
      on template.id = template_version.template_id
     and template.tenant_id = template_version.tenant_id
    where template_version.id = document_record.template_version_id
      and template_version.tenant_id = target_tenant_id
      and template_version.status = 'approved'
      and template.tenant_id = target_tenant_id
      and template.document_type = document_record.document_type
  ) into template_ok;

  if not coalesce(template_ok, false) then
    raise exception 'approved compatible template required' using errcode = '22023';
  end if;

  insert into public.document_signatures (
    tenant_id,
    document_version_id,
    signer_user_id,
    method,
    aal,
    ip_address,
    user_agent,
    signed_hash
  )
  values (
    target_tenant_id,
    target_document_version_id,
    auth.uid(),
    method_value,
    aal_value,
    ip_value,
    nullif(trim(user_agent_value), ''),
    signed_hash_value
  )
  returning id into signature_id;

  perform public.append_audit_log(
    target_tenant_id,
    'document.signed',
    'document_signature',
    signature_id,
    audit_request_id,
    jsonb_build_object(
      'documentVersionId', target_document_version_id,
      'method', method_value
    )
  );

  return signature_id;
end;
$$;

revoke all on function public.sign_document_version(
  uuid, uuid, text, text, inet, text, text, text
) from public, anon, authenticated;
grant execute on function public.sign_document_version(
  uuid, uuid, text, text, inet, text, text, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) encounter_closures — immutable close record
-- ---------------------------------------------------------------------------
create table public.encounter_closures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null,
  encounter_version int not null,
  conclusion_id uuid,
  conclusion_version int,
  aso_document_id uuid,
  aso_version_id uuid,
  aso_signature_id uuid,
  storage_content_hash text not null,
  price_snapshot_id uuid,
  invoice_id uuid,
  payment_policy text not null default 'invoice_issued',
  gates_checklist jsonb not null default '{}'::jsonb,
  gates_checklist_hash text not null,
  closed_at timestamptz not null default now(),
  closed_by uuid not null references public.user_profiles(id) on delete restrict,
  request_id text not null,
  idempotency_key text not null,
  constraint encounter_closures_encounter_uq unique (tenant_id, encounter_id),
  constraint encounter_closures_idempotency_uq unique (tenant_id, idempotency_key)
);

create index encounter_closures_tenant_closed_idx
  on public.encounter_closures (tenant_id, closed_at desc);

alter table public.encounter_closures enable row level security;

drop policy if exists encounter_closures_select on public.encounter_closures;
create policy encounter_closures_select on public.encounter_closures
  for select to authenticated
  using (public.is_active_tenant_member(tenant_id));

-- ---------------------------------------------------------------------------
-- 6) get_encounter_close_readiness — server-side operational blockers
-- ---------------------------------------------------------------------------
create or replace function public.get_encounter_close_readiness(
  target_tenant_id uuid,
  target_encounter_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  encounter_record record;
  blockers jsonb := '[]'::jsonb;
  open_required_steps int := 0;
  pending_exams int := 0;
  critical_alerts int := 0;
  has_signed_conclusion boolean := false;
  has_signed_aso boolean := false;
  aso_render text := 'missing';
  aso_storage text := 'missing';
  has_snapshot boolean := false;
  has_invoice boolean := false;
  delivery_status text := 'missing';
  flow_paused boolean := false;
  ready boolean := false;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if not public.is_active_tenant_member(target_tenant_id) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select * into encounter_record
  from public.encounters encounter
  where encounter.id = target_encounter_id
    and encounter.tenant_id = target_tenant_id;

  if encounter_record.id is null then
    raise exception 'encounter not found' using errcode = 'P0002';
  end if;

  if not (
    public.has_unit_permission(encounter_record.clinic_unit_id, 'encounters.manage')
    or public.has_unit_permission(encounter_record.clinic_unit_id, 'clinical.read')
    or public.has_unit_permission(encounter_record.clinic_unit_id, 'conclusions.manage')
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select count(*)::int into open_required_steps
  from public.encounter_steps step
  where step.encounter_id = encounter_record.id
    and step.tenant_id = target_tenant_id
    and step.step_type in (
      'reception', 'triage', 'consultation', 'conclusion',
      'document', 'delivery', 'billing'
    )
    and step.status not in ('completed', 'waived');

  select count(*)::int into pending_exams
  from public.exam_orders exam_order
  where exam_order.encounter_id = encounter_record.id
    and exam_order.tenant_id = target_tenant_id
    and exam_order.status in ('ordered', 'collected');

  select exists (
    select 1 from public.medical_conclusions conclusion
    where conclusion.encounter_id = encounter_record.id
      and conclusion.tenant_id = target_tenant_id
      and conclusion.signature_status = 'signed'
  ) into has_signed_conclusion;

  select exists (
    select 1 from public.encounter_flow_pauses pause
    where pause.encounter_id = encounter_record.id
      and pause.tenant_id = target_tenant_id
      and pause.status = 'active'
  ) into flow_paused;

  select coalesce((
    select case
      when version.render_status = 'rendered'
           and version.storage_verified_at is not null
           and signature.id is not null
        then true
      else false
    end
    from public.generated_documents document
    join public.document_versions version
      on version.id = document.vigente_version_id
     and version.tenant_id = document.tenant_id
    left join public.document_signatures signature
      on signature.document_version_id = version.id
     and signature.tenant_id = version.tenant_id
    where document.encounter_id = encounter_record.id
      and document.tenant_id = target_tenant_id
      and document.document_type = 'aso'
      and document.status is distinct from 'revoked'
    order by document.created_at desc
    limit 1
  ), false) into has_signed_aso;

  select coalesce((
    select version.render_status
    from public.generated_documents document
    join public.document_versions version
      on version.id = document.vigente_version_id
     and version.tenant_id = document.tenant_id
    where document.encounter_id = encounter_record.id
      and document.tenant_id = target_tenant_id
      and document.document_type = 'aso'
    order by document.created_at desc
    limit 1
  ), 'missing') into aso_render;

  select case
    when has_signed_aso then 'verified'
    when aso_render = 'rendered' then 'unverified_or_unsigned'
    when aso_render in ('pending', 'rendering', 'failed') then aso_render
    else 'missing'
  end into aso_storage;

  select exists (
    select 1 from public.encounter_price_snapshots snapshot
    where snapshot.encounter_id = encounter_record.id
      and snapshot.tenant_id = target_tenant_id
  ) into has_snapshot;

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
  ) into has_invoice;

  select coalesce((
    select step.status
    from public.encounter_steps step
    where step.encounter_id = encounter_record.id
      and step.tenant_id = target_tenant_id
      and step.step_type = 'delivery'
    order by step.sequence
    limit 1
  ), 'missing') into delivery_status;

  select count(*)::int into critical_alerts
  from public.clinical_alerts alert
  where alert.encounter_id = encounter_record.id
    and alert.tenant_id = target_tenant_id
    and alert.severity = 'urgent'
    and coalesce(alert.status, 'open') = 'open';

  if open_required_steps > 0 then
    blockers := blockers || jsonb_build_array(jsonb_build_object(
      'code', 'OPEN_STEPS',
      'message', open_required_steps || ' etapa(s) obrigatória(s) aberta(s)',
      'owner', 'operations'
    ));
  end if;
  if pending_exams > 0 then
    blockers := blockers || jsonb_build_array(jsonb_build_object(
      'code', 'PENDING_EXAMS',
      'message', 'Exames obrigatórios pendentes',
      'owner', 'exams'
    ));
  end if;
  if not has_signed_conclusion then
    blockers := blockers || jsonb_build_array(jsonb_build_object(
      'code', 'UNSIGNED_CONCLUSION',
      'message', 'Conclusão médica não assinada',
      'owner', 'physician'
    ));
  end if;
  if not has_signed_aso then
    blockers := blockers || jsonb_build_array(jsonb_build_object(
      'code', 'UNSIGNED_ASO',
      'message', 'ASO vigente renderizado/assinado/storage ausente',
      'owner', 'documents'
    ));
  end if;
  if delivery_status is distinct from 'completed'
     and delivery_status is distinct from 'waived' then
    blockers := blockers || jsonb_build_array(jsonb_build_object(
      'code', 'DELIVERY_OPEN',
      'message', 'Etapa de entrega não concluída',
      'owner', 'documents.deliver'
    ));
  end if;
  if not has_snapshot then
    blockers := blockers || jsonb_build_array(jsonb_build_object(
      'code', 'MISSING_SNAPSHOT',
      'message', 'Snapshot comercial ausente',
      'owner', 'finance'
    ));
  end if;
  if not has_invoice then
    blockers := blockers || jsonb_build_array(jsonb_build_object(
      'code', 'MISSING_INVOICE',
      'message', 'Fatura consolidada ausente',
      'owner', 'finance'
    ));
  end if;
  if flow_paused then
    blockers := blockers || jsonb_build_array(jsonb_build_object(
      'code', 'FLOW_PAUSED',
      'message', 'Fluxo clínico pausado',
      'owner', 'clinical'
    ));
  end if;
  if critical_alerts > 0 then
    blockers := blockers || jsonb_build_array(jsonb_build_object(
      'code', 'CRITICAL_ALERTS',
      'message', 'Alertas críticos abertos',
      'owner', 'clinical'
    ));
  end if;
  if encounter_record.status = 'cancelled' then
    blockers := blockers || jsonb_build_array(jsonb_build_object(
      'code', 'CANCELLED',
      'message', 'Atendimento cancelado',
      'owner', 'operations'
    ));
  end if;

  ready := jsonb_array_length(blockers) = 0
    and encounter_record.status is distinct from 'cancelled';

  return jsonb_build_object(
    'ready', ready,
    'blockers', blockers,
    'conclusionStatus', case when has_signed_conclusion then 'signed' else 'unsigned' end,
    'asoStatus', case when has_signed_aso then 'signed' else aso_render end,
    'storageStatus', aso_storage,
    'deliveryStatus', delivery_status,
    'billingStatus', case when has_snapshot then 'snapshotted' else 'missing' end,
    'invoiceStatus', case when has_invoice then 'issued' else 'missing' end,
    'paymentStatus', case when has_invoice then 'policy_invoice_issued' else 'unresolved' end,
    'openRequiredSteps', open_required_steps,
    'pendingRequiredExams', pending_exams,
    'criticalAlerts', critical_alerts,
    'encounterVersion', encounter_record.version,
    'encounterStatus', encounter_record.status
  );
end;
$$;

revoke all on function public.get_encounter_close_readiness(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.get_encounter_close_readiness(uuid, uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 7) close_occupational_encounter — no early-return without closure record
-- ---------------------------------------------------------------------------
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
  existing_closure record;
  encounter_record record;
  readiness jsonb;
  gates_hash text;
  conclusion_row record;
  aso_row record;
  snapshot_id uuid;
  invoice_id uuid;
  closure_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;
  if nullif(trim(idempotency_key_value), '') is null then
    raise exception 'idempotency key required' using errcode = '22023';
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

  select * into existing_closure
  from public.encounter_closures closure
  where closure.tenant_id = target_tenant_id
    and closure.encounter_id = target_encounter_id;

  if encounter_record.status = 'completed' then
    if existing_closure.id is null then
      raise exception 'encounter completed without closure record' using errcode = '22023';
    end if;
    return encounter_record.id;
  end if;

  if existing_closure.id is not null then
    return encounter_record.id;
  end if;

  readiness := public.get_encounter_close_readiness(target_tenant_id, target_encounter_id);
  if coalesce((readiness ->> 'ready')::boolean, false) is not true then
    raise exception 'close readiness failed: %', readiness -> 'blockers'
      using errcode = '22023';
  end if;

  select conclusion.id, conclusion.version
    into conclusion_row
  from public.medical_conclusions conclusion
  where conclusion.encounter_id = encounter_record.id
    and conclusion.tenant_id = target_tenant_id
    and conclusion.signature_status = 'signed'
  order by conclusion.created_at desc
  limit 1;

  select
    document.id as document_id,
    version.id as version_id,
    signature.id as signature_id,
    version.content_hash as content_hash
    into aso_row
  from public.generated_documents document
  join public.document_versions version
    on version.id = document.vigente_version_id
   and version.tenant_id = document.tenant_id
  join public.document_signatures signature
    on signature.document_version_id = version.id
   and signature.tenant_id = version.tenant_id
  where document.encounter_id = encounter_record.id
    and document.tenant_id = target_tenant_id
    and document.document_type = 'aso'
    and document.status is distinct from 'revoked'
    and version.render_status = 'rendered'
    and version.storage_verified_at is not null
  order by document.created_at desc
  limit 1;

  if aso_row.version_id is null or nullif(trim(aso_row.content_hash), '') is null then
    raise exception 'signed ASO with verified storage required' using errcode = '22023';
  end if;

  select snapshot.id into snapshot_id
  from public.encounter_price_snapshots snapshot
  where snapshot.encounter_id = encounter_record.id
    and snapshot.tenant_id = target_tenant_id
  order by snapshot.created_at desc
  limit 1;

  select invoice.id into invoice_id
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
  order by invoice.created_at desc
  limit 1;

  gates_hash := encode(extensions.digest(convert_to(readiness::text, 'UTF8'), 'sha256'), 'hex');

  insert into public.idempotency_keys (tenant_id, scope, key, request_hash, expires_at)
  values (
    target_tenant_id,
    'encounter-close',
    idempotency_key_value,
    coalesce(nullif(trim(audit_request_id), ''), idempotency_key_value),
    now() + interval '1 day'
  )
  on conflict (tenant_id, scope, key) do nothing;

  insert into public.encounter_closures (
    tenant_id,
    encounter_id,
    encounter_version,
    conclusion_id,
    conclusion_version,
    aso_document_id,
    aso_version_id,
    aso_signature_id,
    storage_content_hash,
    price_snapshot_id,
    invoice_id,
    payment_policy,
    gates_checklist,
    gates_checklist_hash,
    closed_by,
    request_id,
    idempotency_key
  )
  values (
    target_tenant_id,
    encounter_record.id,
    encounter_record.version,
    conclusion_row.id,
    conclusion_row.version,
    aso_row.document_id,
    aso_row.version_id,
    aso_row.signature_id,
    aso_row.content_hash,
    snapshot_id,
    invoice_id,
    'invoice_issued',
    readiness,
    gates_hash,
    auth.uid(),
    coalesce(nullif(trim(audit_request_id), ''), idempotency_key_value),
    idempotency_key_value
  )
  returning id into closure_id;

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
    jsonb_build_object(
      'closureId', closure_id,
      'gatesHash', gates_hash
    )
  );

  insert into public.outbox_events (
    tenant_id, aggregate_type, aggregate_id, event_type, payload_redacted
  )
  values (
    target_tenant_id,
    'encounter',
    encounter_record.id,
    'encounter.closed',
    jsonb_build_object(
      'clinicUnitId', encounter_record.clinic_unit_id,
      'closureId', closure_id
    )
  );

  update public.idempotency_keys
  set response_reference = jsonb_build_object(
    'encounterId', encounter_record.id,
    'closureId', closure_id
  )
  where tenant_id = target_tenant_id
    and scope = 'encounter-close'
    and key = idempotency_key_value;

  perform public.append_audit_log(
    target_tenant_id,
    'encounter.closed',
    'encounter',
    encounter_record.id,
    audit_request_id,
    jsonb_build_object('status', 'completed', 'closureId', closure_id)
  );

  return encounter_record.id;
end;
$$;

revoke all on function public.close_occupational_encounter(uuid, uuid, int, text, text)
  from public, anon, authenticated;
grant execute on function public.close_occupational_encounter(uuid, uuid, int, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 8) transition_encounter_step — never auto-complete encounter; waived/no_show
-- ---------------------------------------------------------------------------
create or replace function public.transition_encounter_step(
  target_tenant_id uuid,
  target_encounter_step_id uuid,
  target_action text,
  justification_text text,
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
  step_record record;
  encounter_record record;
  dependent record;
  deps_incomplete int;
  new_ticket_id uuid;
  queue_id uuid;
  permission_code text;
  next_status text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if target_action not in (
    'start', 'complete', 'return', 'pause', 'waive', 'no_show', 'cancel', 'reopen'
  ) then
    raise exception 'invalid transition action' using errcode = '22023';
  end if;

  if nullif(trim(idempotency_key_value), '') is null then
    raise exception 'idempotency key required' using errcode = '22023';
  end if;

  select response_reference into existing_response
  from public.idempotency_keys
  where tenant_id = target_tenant_id
    and scope = 'encounter-step-transition'
    and key = idempotency_key_value
  for update;

  if existing_response ? 'stepId' then
    return (existing_response ->> 'stepId')::uuid;
  end if;

  select *
    into step_record
  from public.encounter_steps step
  where step.id = target_encounter_step_id
    and step.tenant_id = target_tenant_id
  for update;

  if step_record.id is null then
    raise exception 'encounter step not found' using errcode = 'P0002';
  end if;

  if step_record.version is distinct from expected_version then
    raise exception 'version conflict' using errcode = '40001';
  end if;

  select *
    into encounter_record
  from public.encounters encounter
  where encounter.id = step_record.encounter_id
    and encounter.tenant_id = target_tenant_id
  for update;

  if encounter_record.id is null then
    raise exception 'encounter not found' using errcode = 'P0002';
  end if;

  if encounter_record.status in ('completed', 'cancelled') then
    raise exception 'encounter is closed' using errcode = '42501';
  end if;

  permission_code := case
    when target_action = 'reopen' then 'clinical.reopen'
    when step_record.step_type = 'reception' then 'encounters.manage'
    when step_record.step_type = 'triage' then 'triage.manage'
    when step_record.step_type = 'consultation' then 'consultations.manage'
    when step_record.step_type = 'conclusion' then 'conclusions.manage'
    when step_record.step_type = 'document' then 'documents.manage'
    when step_record.step_type = 'delivery' then 'documents.deliver'
    when step_record.step_type = 'billing' then 'finance.manage'
    else 'exams.manage'
  end;

  if not public.has_unit_permission(encounter_record.clinic_unit_id, permission_code) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if target_action in ('waive', 'cancel', 'reopen')
     and char_length(trim(coalesce(justification_text, ''))) < 10 then
    raise exception 'justification required' using errcode = '22023';
  end if;

  if target_action = 'no_show' and step_record.status = 'in_progress' then
    raise exception 'no_show not allowed after clinical start' using errcode = '42501';
  end if;

  next_status := case target_action
    when 'start' then 'in_progress'
    when 'complete' then 'completed'
    when 'return' then 'available'
    when 'pause' then 'blocked'
    when 'waive' then 'waived'
    when 'no_show' then 'no_show'
    when 'cancel' then 'cancelled'
    when 'reopen' then 'available'
  end;

  if target_action = 'start' and step_record.status not in ('available', 'pending') then
    raise exception 'step cannot be started from current status' using errcode = '42501';
  end if;

  if target_action = 'complete' and step_record.status not in ('available', 'in_progress') then
    raise exception 'step cannot be completed from current status' using errcode = '42501';
  end if;

  if target_action = 'pause' and step_record.status <> 'in_progress' then
    raise exception 'step cannot be paused from current status' using errcode = '42501';
  end if;

  insert into public.idempotency_keys (tenant_id, scope, key, request_hash, expires_at)
  values (
    target_tenant_id,
    'encounter-step-transition',
    idempotency_key_value,
    coalesce(nullif(trim(audit_request_id), ''), idempotency_key_value),
    now() + interval '1 day'
  )
  on conflict (tenant_id, scope, key) do nothing;

  update public.encounter_steps
  set status = next_status,
      version = version + 1,
      updated_at = now()
  where id = step_record.id
    and tenant_id = target_tenant_id;

  update public.queue_tickets
  set status = case
    when target_action = 'start' then 'in_service'
    when target_action in ('complete', 'waive') then 'done'
    when target_action in ('no_show', 'cancel') then 'cancelled'
    when target_action = 'return' then 'waiting'
    else status
  end
  where tenant_id = target_tenant_id
    and encounter_step_id = step_record.id
    and status in ('waiting', 'called', 'in_service');

  if target_action in ('complete', 'waive') then
    for dependent in
      select child.*
      from public.encounter_step_dependencies dep
      join public.encounter_steps child
        on child.id = dep.step_id
       and child.tenant_id = dep.tenant_id
      where dep.tenant_id = target_tenant_id
        and dep.depends_on_step_id = step_record.id
        and child.encounter_id = step_record.encounter_id
        and child.status = 'blocked'
      order by child.sequence
      for update of child
    loop
      select count(*)::int into deps_incomplete
      from public.encounter_step_dependencies dep
      join public.encounter_steps ancestor
        on ancestor.id = dep.depends_on_step_id
       and ancestor.tenant_id = dep.tenant_id
      where dep.tenant_id = target_tenant_id
        and dep.step_id = dependent.id
        and dep.is_required
        -- cancelled / no_show / failed do NOT satisfy required deps
        and ancestor.status not in ('completed', 'waived');

      if deps_incomplete = 0 then
        update public.encounter_steps
        set status = 'available',
            version = version + 1,
            updated_at = now()
        where id = dependent.id;

        queue_id := public.ensure_queue_for_step(
          target_tenant_id,
          encounter_record.clinic_unit_id,
          dependent.step_type
        );

        insert into public.queue_tickets (
          tenant_id, queue_definition_id, encounter_id, encounter_step_id, status
        )
        values (
          target_tenant_id, queue_id, encounter_record.id, dependent.id, 'waiting'
        )
        returning id into new_ticket_id;
      end if;
    end loop;

    -- NEVER mark encounter completed here. Only close_occupational_encounter may.
    if encounter_record.status = 'checked_in' then
      update public.encounters
      set status = 'in_progress', updated_at = now()
      where id = encounter_record.id;
    end if;
  end if;

  insert into public.encounter_events (
    tenant_id, encounter_id, event_type, created_by, payload
  )
  values (
    target_tenant_id,
    encounter_record.id,
    'step.' || target_action,
    auth.uid(),
    jsonb_build_object(
      'stepId', step_record.id,
      'stepType', step_record.step_type,
      'justification', nullif(trim(justification_text), ''),
      'newTicketId', new_ticket_id
    )
  );

  insert into public.outbox_events (
    tenant_id, aggregate_type, aggregate_id, event_type, payload_redacted
  )
  values (
    target_tenant_id,
    'encounter',
    encounter_record.id,
    'encounter.step.' || target_action,
    jsonb_build_object(
      'stepType', step_record.step_type,
      'clinicUnitId', encounter_record.clinic_unit_id
    )
  );

  update public.idempotency_keys
  set response_reference = jsonb_build_object(
    'stepId', step_record.id,
    'action', target_action,
    'newTicketId', new_ticket_id
  )
  where tenant_id = target_tenant_id
    and scope = 'encounter-step-transition'
    and key = idempotency_key_value;

  perform public.append_audit_log(
    target_tenant_id,
    'encounter.step.' || target_action,
    'encounter_step',
    step_record.id,
    audit_request_id,
    jsonb_build_object(
      'action', target_action,
      'stepType', step_record.step_type,
      'permission', permission_code
    )
  );

  return step_record.id;
end;
$$;

revoke all on function public.transition_encounter_step(uuid, uuid, text, text, int, text, text)
  from public, anon, authenticated;
grant execute on function public.transition_encounter_step(uuid, uuid, text, text, int, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 9) Patch check-in statuses + delivery step via companion statements
--     (full function body applied immediately below)
-- ---------------------------------------------------------------------------


create or replace function public.check_in_appointment(
  target_tenant_id uuid,
  target_appointment_id uuid,
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
  expected_key text := 'checkin:appointment:' || target_appointment_id::text;
  existing_response jsonb;
  appointment_record record;
  worker_record record;
  contract_record record;
  pcmso_count int;
  protocol_count int;
  pcmso_version_id uuid;
  protocol_id uuid;
  protocol_rule_version int;
  new_encounter_id uuid;
  new_snapshot_id uuid;
  reception_step_id uuid;
  triage_step_id uuid;
  previous_step_id uuid;
  new_step_id uuid;
  exam_row record;
  exam_count int := 0;
  override_count int := 0;
  reception_queue_id uuid;
  sequence_no int := 1;
  snapshot_payload jsonb;
  overrides jsonb := '[]'::jsonb;
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

  if nullif(trim(idempotency_key_value), '') is distinct from expected_key then
    raise exception 'idempotency key must be checkin:appointment:<appointment_id>'
      using errcode = '22023';
  end if;

  select response_reference into existing_response
  from public.idempotency_keys
  where tenant_id = target_tenant_id
    and scope = 'check-in'
    and key = expected_key
  for update;

  if existing_response ? 'encounterId' then
    return (existing_response ->> 'encounterId')::uuid;
  end if;

  select
    appointment.id,
    appointment.clinic_unit_id,
    appointment.status,
    appointment.referral_id,
    appointment.resource_id,
    appointment.starts_at,
    appointment.ends_at,
    referral.worker_id,
    referral.company_id,
    referral.occupational_exam_type,
    coalesce(referral.exam_preview, '[]'::jsonb) as exam_preview,
    referral.status as referral_status
  into appointment_record
  from public.appointments appointment
  left join public.referrals referral
    on referral.id = appointment.referral_id
   and referral.tenant_id = appointment.tenant_id
  where appointment.id = target_appointment_id
    and appointment.tenant_id = target_tenant_id
  for update of appointment;

  if appointment_record.id is null then
    raise exception 'appointment not found' using errcode = 'P0002';
  end if;

  if not public.has_unit_permission(appointment_record.clinic_unit_id, 'encounters.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if appointment_record.status not in ('scheduled', 'confirmed') then
    raise exception 'appointment cannot be checked in' using errcode = '42501';
  end if;

  -- Agendamento ocupacional exige encaminhamento + trabalhador válidos
  if appointment_record.referral_id is null
     or appointment_record.worker_id is null
     or appointment_record.company_id is null then
    raise exception 'occupational check-in requires valid referral and worker'
      using errcode = '22023';
  end if;

  if appointment_record.referral_status in ('cancelled', 'draft') then
    raise exception 'referral is not eligible for check-in' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.encounters encounter
    where encounter.tenant_id = target_tenant_id
      and encounter.appointment_id = appointment_record.id
      and encounter.status in ('checked_in', 'in_progress', 'waiting')
  ) then
    raise exception 'active encounter already exists for appointment' using errcode = '23P01';
  end if;

  if exists (
    select 1
    from public.encounters encounter
    where encounter.tenant_id = target_tenant_id
      and encounter.worker_id = appointment_record.worker_id
      and encounter.clinic_unit_id = appointment_record.clinic_unit_id
      and encounter.status in ('checked_in', 'in_progress', 'waiting')
      and encounter.appointment_id is distinct from appointment_record.id
  ) then
    raise exception 'worker already has an active encounter in this unit'
      using errcode = '23P01';
  end if;

  select worker.id, worker.status, worker.full_name, worker.version
    into worker_record
  from public.workers worker
  where worker.id = appointment_record.worker_id
    and worker.tenant_id = target_tenant_id
  for share;

  if worker_record.id is null then
    raise exception 'worker not found' using errcode = 'P0002';
  end if;

  if worker_record.status <> 'active' then
    raise exception 'worker is not active' using errcode = '22023';
  end if;

  select
    contract.id,
    contract.sector_id,
    contract.job_position_id,
    contract.exposure_group_id,
    contract.status,
    contract.version,
    sector.name as sector_name,
    job.name as job_position_name,
    ghe.name as exposure_group_name
  into contract_record
  from public.employment_contracts contract
  left join public.sectors sector
    on sector.id = contract.sector_id and sector.tenant_id = contract.tenant_id
  left join public.job_positions job
    on job.id = contract.job_position_id and job.tenant_id = contract.tenant_id
  left join public.exposure_groups ghe
    on ghe.id = contract.exposure_group_id and ghe.tenant_id = contract.tenant_id
  where contract.tenant_id = target_tenant_id
    and contract.worker_id = appointment_record.worker_id
    and contract.company_id = appointment_record.company_id
    and contract.status = 'active'
    and contract.starts_on <= current_date
    and (contract.ends_on is null or contract.ends_on > current_date)
  order by contract.starts_on desc
  limit 2;

  get diagnostics override_count = row_count;
  -- re-count active contracts for ambiguity
  select count(*)::int into override_count
  from public.employment_contracts contract
  where contract.tenant_id = target_tenant_id
    and contract.worker_id = appointment_record.worker_id
    and contract.company_id = appointment_record.company_id
    and contract.status = 'active'
    and contract.starts_on <= current_date
    and (contract.ends_on is null or contract.ends_on > current_date);

  if override_count = 0 then
    raise exception 'active employment contract missing' using errcode = '22023';
  end if;

  if override_count > 1 then
    raise exception 'ambiguous active employment contracts' using errcode = '22023';
  end if;

  select count(*)::int into pcmso_count
  from public.pcmso_versions pcmso
  where pcmso.tenant_id = target_tenant_id
    and pcmso.company_id = appointment_record.company_id
    and pcmso.status = 'approved'
    and pcmso.valid_from <= current_date
    and (pcmso.valid_until is null or pcmso.valid_until > current_date);

  if pcmso_count = 0 then
    raise exception 'approved PCMSO version missing for company' using errcode = '22023';
  end if;

  if pcmso_count > 1 then
    raise exception 'ambiguous approved PCMSO versions for company' using errcode = '22023';
  end if;

  select pcmso.id into pcmso_version_id
  from public.pcmso_versions pcmso
  where pcmso.tenant_id = target_tenant_id
    and pcmso.company_id = appointment_record.company_id
    and pcmso.status = 'approved'
    and pcmso.valid_from <= current_date
    and (pcmso.valid_until is null or pcmso.valid_until > current_date)
  limit 1;

  select count(*)::int into protocol_count
  from public.exam_protocols protocol
  where protocol.tenant_id = target_tenant_id
    and protocol.pcmso_version_id = pcmso_version_id
    and protocol.occupational_exam_type = appointment_record.occupational_exam_type
    and protocol.status = 'approved';

  if protocol_count = 0 then
    raise exception 'approved exam protocol missing for occupational type'
      using errcode = '22023';
  end if;

  if protocol_count > 1 then
    raise exception 'ambiguous approved exam protocols for occupational type'
      using errcode = '22023';
  end if;

  select protocol.id, protocol.rule_version
    into protocol_id, protocol_rule_version
  from public.exam_protocols protocol
  where protocol.tenant_id = target_tenant_id
    and protocol.pcmso_version_id = pcmso_version_id
    and protocol.occupational_exam_type = appointment_record.occupational_exam_type
    and protocol.status = 'approved'
  limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', override.id,
    'examCatalogId', override.exam_catalog_id,
    'action', override.action,
    'justification', override.justification
  ) order by override.created_at), '[]'::jsonb)
    into overrides
  from public.exam_protocol_overrides override
  where override.tenant_id = target_tenant_id
    and (
      override.worker_id = appointment_record.worker_id
      or override.employment_contract_id = contract_record.id
    );

  insert into public.idempotency_keys (tenant_id, scope, key, request_hash, expires_at)
  values (
    target_tenant_id,
    'check-in',
    expected_key,
    coalesce(nullif(trim(audit_request_id), ''), expected_key),
    now() + interval '1 day'
  )
  on conflict (tenant_id, scope, key) do nothing;

  insert into public.encounters (
    tenant_id, clinic_unit_id, worker_id, appointment_id, referral_id, status
  )
  values (
    target_tenant_id,
    appointment_record.clinic_unit_id,
    appointment_record.worker_id,
    appointment_record.id,
    appointment_record.referral_id,
    'checked_in'
  )
  returning id into new_encounter_id;

  snapshot_payload := jsonb_build_object(
    'schema', 'encounter_checkin_snapshot/v2',
    'checkedInAt', now(),
    'appointment', jsonb_build_object(
      'id', appointment_record.id,
      'resourceId', appointment_record.resource_id,
      'startsAt', appointment_record.starts_at,
      'endsAt', appointment_record.ends_at
    ),
    'referral', jsonb_build_object(
      'id', appointment_record.referral_id,
      'companyId', appointment_record.company_id,
      'occupationalExamType', appointment_record.occupational_exam_type,
      'examPreview', appointment_record.exam_preview
    ),
    'worker', jsonb_build_object(
      'id', worker_record.id,
      'fullName', worker_record.full_name,
      'version', worker_record.version
    ),
    'employmentContract', jsonb_build_object(
      'id', contract_record.id,
      'version', contract_record.version,
      'sectorId', contract_record.sector_id,
      'sectorName', contract_record.sector_name,
      'jobPositionId', contract_record.job_position_id,
      'jobPositionName', contract_record.job_position_name,
      'exposureGroupId', contract_record.exposure_group_id,
      'exposureGroupName', contract_record.exposure_group_name
    ),
    'pcmsoVersionId', pcmso_version_id,
    'protocol', jsonb_build_object(
      'id', protocol_id,
      'ruleVersion', protocol_rule_version
    ),
    'overrides', overrides,
    'risks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', risk.id,
        'code', risk.code,
        'name', risk.name,
        'riskType', risk.risk_type
      ) order by risk.code)
      from public.risk_assignments assignment
      join public.occupational_risks risk
        on risk.id = assignment.occupational_risk_id
       and risk.tenant_id = assignment.tenant_id
      where assignment.tenant_id = target_tenant_id
        and assignment.company_id = appointment_record.company_id
        and (
          assignment.job_position_id = contract_record.job_position_id
          or assignment.exposure_group_id = contract_record.exposure_group_id
        )
        and assignment.starts_on <= current_date
        and (assignment.ends_on is null or assignment.ends_on > current_date)
    ), '[]'::jsonb)
  );

  insert into public.encounter_snapshots (
    tenant_id, encounter_id, schema_version, payload, content_hash
  )
  values (
    target_tenant_id,
    new_encounter_id,
    2,
    snapshot_payload,
    encode(extensions.digest(convert_to(snapshot_payload::text, 'UTF8'), 'sha256'), 'hex')
  )
  returning id into new_snapshot_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence
  )
  values (target_tenant_id, new_encounter_id, 'reception', 'available', sequence_no)
  returning id into reception_step_id;

  sequence_no := sequence_no + 1;
  previous_step_id := reception_step_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
  )
  values (
    target_tenant_id, new_encounter_id, 'triage', 'blocked', sequence_no, previous_step_id
  )
  returning id into triage_step_id;

  insert into public.encounter_step_dependencies (
    tenant_id, encounter_id, step_id, depends_on_step_id, dependency_group, is_required
  ) values (
    target_tenant_id, new_encounter_id, triage_step_id, reception_step_id, 'intake', true
  );

  sequence_no := sequence_no + 1;
  previous_step_id := triage_step_id;

  for exam_row in
    select
      item.id as referral_item_id,
      item.exam_catalog_id,
      item.source,
      catalog.code as exam_code,
      catalog.name as exam_name,
      catalog.result_type,
      public.map_exam_result_type_to_step(catalog.result_type) as step_type
    from public.referral_items item
    join public.exam_catalog catalog
      on catalog.id = item.exam_catalog_id
     and catalog.tenant_id = item.tenant_id
    where item.tenant_id = target_tenant_id
      and item.referral_id = appointment_record.referral_id
      and item.status <> 'cancelled'
      and item.exam_catalog_id is not null
    order by catalog.code
  loop
    insert into public.exam_orders (
      tenant_id, encounter_id, exam_catalog_id, protocol_snapshot
    )
    values (
      target_tenant_id,
      new_encounter_id,
      exam_row.exam_catalog_id,
      jsonb_build_object(
        'source', exam_row.source,
        'referralItemId', exam_row.referral_item_id,
        'examCode', exam_row.exam_code,
        'examName', exam_row.exam_name,
        'protocolId', protocol_id,
        'pcmsoVersionId', pcmso_version_id
      )
    );

    insert into public.encounter_steps (
      tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
    )
    values (
      target_tenant_id,
      new_encounter_id,
      exam_row.step_type,
      'blocked',
      sequence_no,
      triage_step_id
    )
    returning id into new_step_id;

    insert into public.encounter_step_dependencies (
      tenant_id, encounter_id, step_id, depends_on_step_id, dependency_group, is_required
    ) values (
      target_tenant_id, new_encounter_id, new_step_id, triage_step_id, 'exams_parallel', true
    );

    exam_count := exam_count + 1;
    sequence_no := sequence_no + 1;
  end loop;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
  )
  values (
    target_tenant_id,
    new_encounter_id,
    'consultation',
    'blocked',
    sequence_no,
    case when exam_count = 0 then triage_step_id else null end
  )
  returning id into new_step_id;

  if exam_count = 0 then
    insert into public.encounter_step_dependencies (
      tenant_id, encounter_id, step_id, depends_on_step_id, dependency_group, is_required
    ) values (
      target_tenant_id, new_encounter_id, new_step_id, triage_step_id, 'pre_consult', true
    );
  else
    insert into public.encounter_step_dependencies (
      tenant_id, encounter_id, step_id, depends_on_step_id, dependency_group, is_required
    )
    select
      target_tenant_id,
      new_encounter_id,
      new_step_id,
      exam_step.id,
      'pre_consult',
      true
    from public.encounter_steps exam_step
    where exam_step.tenant_id = target_tenant_id
      and exam_step.encounter_id = new_encounter_id
      and exam_step.step_type not in (
        'reception', 'triage', 'consultation', 'conclusion', 'document', 'delivery', 'billing'
      );
  end if;

  sequence_no := sequence_no + 1;
  previous_step_id := new_step_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
  )
  values (
    target_tenant_id, new_encounter_id, 'conclusion', 'blocked', sequence_no, previous_step_id
  )
  returning id into new_step_id;

  insert into public.encounter_step_dependencies (
    tenant_id, encounter_id, step_id, depends_on_step_id, dependency_group, is_required
  ) values (
    target_tenant_id, new_encounter_id, new_step_id, previous_step_id, 'post_consult', true
  );

  sequence_no := sequence_no + 1;
  previous_step_id := new_step_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
  )
  values (
    target_tenant_id, new_encounter_id, 'document', 'blocked', sequence_no, previous_step_id
  )
  returning id into new_step_id;

  insert into public.encounter_step_dependencies (
    tenant_id, encounter_id, step_id, depends_on_step_id, dependency_group, is_required
  ) values (
    target_tenant_id, new_encounter_id, new_step_id, previous_step_id, 'post_consult', true
  );

  sequence_no := sequence_no + 1;
  previous_step_id := new_step_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
  )
  values (
    target_tenant_id, new_encounter_id, 'delivery', 'blocked', sequence_no, previous_step_id
  )
  returning id into new_step_id;

  insert into public.encounter_step_dependencies (
    tenant_id, encounter_id, step_id, depends_on_step_id, dependency_group, is_required
  ) values (
    target_tenant_id, new_encounter_id, new_step_id, previous_step_id, 'post_consult', true
  );

  sequence_no := sequence_no + 1;
  previous_step_id := new_step_id;

  insert into public.encounter_steps (
    tenant_id, encounter_id, step_type, status, sequence, depends_on_step_id
  )
  values (
    target_tenant_id, new_encounter_id, 'billing', 'blocked', sequence_no, previous_step_id
  )
  returning id into new_step_id;

  insert into public.encounter_step_dependencies (
    tenant_id, encounter_id, step_id, depends_on_step_id, dependency_group, is_required
  ) values (
    target_tenant_id, new_encounter_id, new_step_id, previous_step_id, 'post_consult', true
  );

  select id into reception_queue_id
  from public.queue_definitions
  where tenant_id = target_tenant_id
    and clinic_unit_id = appointment_record.clinic_unit_id
    and step_type = 'reception'
    and status = 'active'
  order by created_at
  limit 1;

  if reception_queue_id is null then
    insert into public.queue_definitions (
      tenant_id, clinic_unit_id, code, name, step_type
    )
    values (
      target_tenant_id,
      appointment_record.clinic_unit_id,
      'RECEPCAO',
      'Recepção',
      'reception'
    )
    returning id into reception_queue_id;
  end if;

  -- Apenas o primeiro ticket (recepção). Próximas filas nascem na transição.
  insert into public.queue_tickets (
    tenant_id, queue_definition_id, encounter_id, encounter_step_id
  )
  values (
    target_tenant_id, reception_queue_id, new_encounter_id, reception_step_id
  );

  insert into public.encounter_events (
    tenant_id, encounter_id, event_type, created_by, payload
  )
  values (
    target_tenant_id,
    new_encounter_id,
    'checked_in',
    auth.uid(),
    jsonb_build_object(
      'examCount', exam_count,
      'snapshotId', new_snapshot_id,
      'protocolId', protocol_id
    )
  );

  insert into public.outbox_events (
    tenant_id, aggregate_type, aggregate_id, event_type, payload_redacted
  )
  values (
    target_tenant_id,
    'encounter',
    new_encounter_id,
    'encounter.checked_in',
    jsonb_build_object(
      'clinicUnitId', appointment_record.clinic_unit_id,
      'examCount', exam_count
    )
  );

  update public.appointments
  set status = 'checked_in', updated_at = now()
  where id = appointment_record.id
    and tenant_id = target_tenant_id;

  update public.referrals
  set status = 'checked_in', updated_at = now()
  where id = appointment_record.referral_id
    and tenant_id = target_tenant_id;

  update public.idempotency_keys
  set response_reference = jsonb_build_object(
    'encounterId', new_encounter_id,
    'examCount', exam_count,
    'snapshotId', new_snapshot_id
  )
  where tenant_id = target_tenant_id
    and scope = 'check-in'
    and key = expected_key;

  perform public.append_audit_log(
    target_tenant_id,
    'encounter.checked_in',
    'encounter',
    new_encounter_id,
    audit_request_id,
    jsonb_build_object(
      'appointmentId', appointment_record.id,
      'examCount', exam_count,
      'protocolId', protocol_id,
      'pcmsoVersionId', pcmso_version_id
    )
  );

  return new_encounter_id;
end;
$$;


revoke all on function public.check_in_appointment(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.check_in_appointment(uuid, uuid, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 10) RPC inventory + unexpected public overload guard
-- ---------------------------------------------------------------------------
create or replace view public.rpc_execute_inventory as
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  p.prosecdef as security_definer,
  pg_get_userbyid(p.proowner) as owner_name,
  coalesce((
    select bool_or(acl.grantee = 0 and acl.privilege_type = 'EXECUTE')
    from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
  ), false) as grant_public,
  coalesce((
    select bool_or(r.rolname = 'anon' and acl.privilege_type = 'EXECUTE')
    from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    left join pg_roles r on r.oid = acl.grantee
  ), false) as grant_anon,
  coalesce((
    select bool_or(r.rolname = 'authenticated' and acl.privilege_type = 'EXECUTE')
    from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    left join pg_roles r on r.oid = acl.grantee
  ), false) as grant_authenticated,
  coalesce((
    select bool_or(r.rolname = 'service_role' and acl.privilege_type = 'EXECUTE')
    from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    left join pg_roles r on r.oid = acl.grantee
  ), false) as grant_service_role
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f';

revoke all on public.rpc_execute_inventory from public, anon;
grant select on public.rpc_execute_inventory to authenticated, service_role;

create or replace function public.assert_canonical_public_rpc_overloads()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  bad text;
begin
  select string_agg(function_name || '(' || identity_args || ')', ', ' order by 1)
    into bad
  from (
    select function_name, identity_args, count(*) over (partition by function_name) as c
    from public.rpc_execute_inventory
    where (grant_authenticated or grant_anon or grant_public)
      and function_name in (
        'sign_document_version',
        'finalize_document_version_render',
        'create_generated_document_version',
        'close_occupational_encounter',
        'transition_encounter_step',
        'create_call_event',
        'check_in_appointment',
        'get_encounter_close_readiness'
      )
  ) q
  where c > 1;

  if bad is not null then
    raise exception 'unexpected public RPC overloads: %', bad using errcode = '22023';
  end if;

  if exists (
    select 1 from public.rpc_execute_inventory
    where function_name = 'finalize_document_version_render'
      and (grant_authenticated or grant_anon or grant_public)
  ) then
    raise exception 'finalize_document_version_render must not be executable by authenticated/anon/public'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.assert_canonical_public_rpc_overloads() from public, anon, authenticated;
grant execute on function public.assert_canonical_public_rpc_overloads() to service_role;

drop function if exists public.create_call_event(uuid, uuid, uuid, text, text);
drop function if exists public.finalize_document_version_render(uuid, uuid, text, text, text);

select public.assert_canonical_public_rpc_overloads();

commit;
