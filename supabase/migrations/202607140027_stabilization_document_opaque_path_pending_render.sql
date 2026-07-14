-- Estabilização: documentos — path opaco server-side, pending até bytes, bucket privado.

-- 1) Bucket privado (idempotente)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinical-private',
  'clinical-private',
  false,
  20971520,
  array['application/pdf']::text[]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) Imutabilidade com exceção estreita para finalize de render
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
  then
    return new;
  end if;

  raise exception 'document versions are immutable' using errcode = '42501';
end;
$$;

-- 3) Create version: ignora path do cliente; marca pending
create or replace function public.create_generated_document_version(
  target_tenant_id uuid,
  target_template_version_id uuid,
  target_encounter_id uuid,
  document_type_value text,
  idempotency_key_value text,
  snapshot_payload_value jsonb,
  storage_path_value text,
  content_hash_value text,
  rectification_reason_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  document_id uuid;
  version_number int;
  version_id uuid;
  encounter_worker_id uuid;
  opaque_path text;
begin
  -- Assinatura mantém storage_path_value, mas o valor do cliente é ignorado.
  perform coalesce(storage_path_value, '');

  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_encounter_permission(target_encounter_id, 'documents.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if document_type_value not in ('aso', 'triage_form', 'exam_report', 'generic') then
    raise exception 'invalid document type' using errcode = '22023';
  end if;

  if document_type_value = 'aso' and not exists (
    select 1
    from public.medical_conclusions conclusion
    where conclusion.tenant_id = target_tenant_id
      and conclusion.encounter_id = target_encounter_id
      and conclusion.signature_status in ('prepared', 'signed')
  ) then
    raise exception 'aso requires medical conclusion' using errcode = '22023';
  end if;

  select worker_id into encounter_worker_id
  from public.encounters
  where id = target_encounter_id
    and tenant_id = target_tenant_id;

  if encounter_worker_id is null then
    raise exception 'encounter not found' using errcode = 'P0002';
  end if;

  insert into public.generated_documents (
    tenant_id,
    encounter_id,
    worker_id,
    template_version_id,
    document_type,
    status,
    idempotency_key,
    created_by
  )
  values (
    target_tenant_id,
    target_encounter_id,
    encounter_worker_id,
    target_template_version_id,
    document_type_value,
    'issued',
    idempotency_key_value,
    auth.uid()
  )
  on conflict (tenant_id, idempotency_key) do update
    set status = 'rectified'
  returning id, current_version into document_id, version_number;

  if exists (
    select 1 from public.document_versions version
    where version.tenant_id = target_tenant_id
      and version.generated_document_id = document_id
      and version.version = version_number
  ) then
    version_number := version_number + 1;
    update public.generated_documents
      set current_version = version_number
    where id = document_id
      and tenant_id = target_tenant_id;
  end if;

  opaque_path :=
    target_tenant_id::text
    || '/'
    || target_encounter_id::text
    || '/'
    || document_id::text
    || '/v'
    || version_number::text
    || '/'
    || gen_random_uuid()::text
    || '.pdf';

  insert into public.document_versions (
    tenant_id,
    generated_document_id,
    version,
    snapshot_payload,
    render_status,
    storage_bucket,
    storage_path,
    content_hash,
    rectification_reason,
    created_by
  )
  values (
    target_tenant_id,
    document_id,
    version_number,
    snapshot_payload_value,
    'pending',
    'clinical-private',
    opaque_path,
    content_hash_value,
    nullif(trim(rectification_reason_value), ''),
    auth.uid()
  )
  returning id into version_id;

  update public.generated_documents
    set vigente_version_id = version_id,
        status = case when version_number > 1 then 'rectified' else 'issued' end
  where id = document_id
    and tenant_id = target_tenant_id;

  perform public.append_audit_log(
    target_tenant_id,
    'document.generated',
    'generated_documents',
    document_id,
    audit_request_id,
    jsonb_build_object(
      'documentType', document_type_value,
      'version', version_number,
      'renderStatus', 'pending',
      'storagePathOpaque', true
    )
  );

  return version_id;
end;
$$;

-- 4) Finalize: pending/rendering -> rendered|failed após bytes no storage (app sobe antes)
create or replace function public.finalize_document_version_render(
  target_tenant_id uuid,
  target_document_version_id uuid,
  render_status_value text,
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
  target_encounter_id uuid;
  current_status text;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if render_status_value not in ('rendered', 'failed') then
    raise exception 'invalid render status' using errcode = '22023';
  end if;

  if nullif(trim(content_hash_value), '') is null then
    raise exception 'content hash required' using errcode = '22023';
  end if;

  select document.encounter_id, version.render_status
    into target_encounter_id, current_status
  from public.document_versions version
  join public.generated_documents document
    on document.id = version.generated_document_id
   and document.tenant_id = version.tenant_id
  where version.id = target_document_version_id
    and version.tenant_id = target_tenant_id
  for update of version;

  if target_encounter_id is null then
    raise exception 'document version not found' using errcode = 'P0002';
  end if;

  if not public.has_encounter_permission(target_encounter_id, 'documents.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if current_status not in ('pending', 'rendering') then
    raise exception 'document version already finalized' using errcode = '22023';
  end if;

  perform set_config('app.document_render_finalize', 'on', true);

  update public.document_versions
    set render_status = render_status_value,
        content_hash = content_hash_value
  where id = target_document_version_id
    and tenant_id = target_tenant_id;

  perform public.append_audit_log(
    target_tenant_id,
    'document.render.finalized',
    'document_versions',
    target_document_version_id,
    audit_request_id,
    jsonb_build_object('renderStatus', render_status_value)
  );

  return target_document_version_id;
end;
$$;

revoke all on function public.create_generated_document_version(
  uuid, uuid, uuid, text, text, jsonb, text, text, text, text
) from public;
revoke all on function public.finalize_document_version_render(uuid, uuid, text, text, text) from public;

grant execute on function public.create_generated_document_version(
  uuid, uuid, uuid, text, text, jsonb, text, text, text, text
) to authenticated;
grant execute on function public.finalize_document_version_render(uuid, uuid, text, text, text) to authenticated;
