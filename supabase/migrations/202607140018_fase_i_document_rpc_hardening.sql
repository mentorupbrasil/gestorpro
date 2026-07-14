-- Fase I checkpoint: endurecer create/sign de documentos (AAL2 + escopo encounter).

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
begin
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

  insert into public.document_versions (
    tenant_id,
    generated_document_id,
    version,
    snapshot_payload,
    render_status,
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
    'rendered',
    storage_path_value,
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
    jsonb_build_object('documentType', document_type_value, 'version', version_number)
  );

  return version_id;
end;
$$;

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
  target_document_id uuid;
  target_encounter_id uuid;
  existing_hash text;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if coalesce(aal_value, '') <> 'aal2' then
    raise exception 'document signing requires aal2' using errcode = '42501';
  end if;

  select version.generated_document_id, version.content_hash, document.encounter_id
    into target_document_id, existing_hash, target_encounter_id
  from public.document_versions version
  join public.generated_documents document
    on document.id = version.generated_document_id
   and document.tenant_id = version.tenant_id
  where version.id = target_document_version_id
    and version.tenant_id = target_tenant_id
  for update of version;

  if target_document_id is null then
    raise exception 'document version not found' using errcode = 'P0002';
  end if;

  if target_encounter_id is null
     or not public.has_encounter_permission(target_encounter_id, 'documents.sign') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if existing_hash is distinct from signed_hash_value then
    raise exception 'signed hash mismatch' using errcode = '22023';
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

revoke all on function public.create_generated_document_version(
  uuid, uuid, uuid, text, text, jsonb, text, text, text, text
) from public;
revoke all on function public.sign_document_version(
  uuid, uuid, text, text, inet, text, text, text
) from public;

grant execute on function public.create_generated_document_version(
  uuid, uuid, uuid, text, text, jsonb, text, text, text, text
) to authenticated;
grant execute on function public.sign_document_version(
  uuid, uuid, text, text, inet, text, text, text
) to authenticated;
