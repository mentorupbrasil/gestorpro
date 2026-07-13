begin;

-- P0.6 — auditoria de leitura sensível (metadados apenas; sem conteúdo clínico).

create or replace function public.log_sensitive_read(
  target_tenant_id uuid,
  audit_action text,
  audit_entity_type text,
  audit_entity_id uuid,
  audit_request_id text,
  access_result text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  allowed_actions text[] := array[
    'chart.viewed',
    'result.viewed',
    'document.previewed',
    'document.downloaded',
    'document.printed',
    'document.signed_url',
    'document.list_viewed',
    'sensitive_search.performed',
    'export.performed',
    'break_glass.accessed'
  ];
  audit_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if audit_action is null or not (audit_action = any (allowed_actions)) then
    raise exception 'invalid sensitive read action' using errcode = '22023';
  end if;

  if access_result is null or access_result not in ('allowed', 'denied') then
    raise exception 'invalid access result' using errcode = '22023';
  end if;

  if not public.is_active_tenant_member(target_tenant_id) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if char_length(coalesce(audit_request_id, '')) < 1
    or char_length(audit_request_id) > 128 then
    raise exception 'invalid request id' using errcode = '22023';
  end if;

  select public.append_audit_log(
    target_tenant_id,
    audit_action,
    audit_entity_type,
    audit_entity_id,
    audit_request_id,
    jsonb_build_object(
      'aal', coalesce(auth.jwt() ->> 'aal', 'unknown'),
      'result', access_result
    )
  )
  into audit_id;

  return audit_id;
end;
$$;

create or replace function public.log_document_access(
  target_tenant_id uuid,
  target_document_version_id uuid,
  access_type_value text,
  audit_request_id text,
  expires_at_value timestamptz
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  access_id uuid;
  generated_document_id uuid;
  sensitive_action text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if access_type_value not in ('preview', 'download', 'print', 'signed_url') then
    raise exception 'invalid document access type' using errcode = '22023';
  end if;

  select document_version.generated_document_id
    into generated_document_id
  from public.document_versions document_version
  where document_version.id = target_document_version_id
    and document_version.tenant_id = target_tenant_id;

  if generated_document_id is null then
    raise exception 'document version not found' using errcode = 'P0002';
  end if;

  if not public.has_document_permission(generated_document_id, 'documents.read') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  insert into public.document_access_logs (
    tenant_id,
    document_version_id,
    actor_user_id,
    access_type,
    request_id,
    expires_at
  )
  values (
    target_tenant_id,
    target_document_version_id,
    auth.uid(),
    access_type_value,
    audit_request_id,
    expires_at_value
  )
  returning id into access_id;

  sensitive_action := case access_type_value
    when 'preview' then 'document.previewed'
    when 'download' then 'document.downloaded'
    when 'print' then 'document.printed'
    else 'document.signed_url'
  end;

  perform public.log_sensitive_read(
    target_tenant_id,
    sensitive_action,
    'document_version',
    target_document_version_id,
    audit_request_id,
    'allowed'
  );

  return access_id;
end;
$$;

revoke all on function public.log_sensitive_read(uuid, text, text, uuid, text, text) from public;
revoke all on function public.log_document_access(uuid, uuid, text, text, timestamptz) from public;
grant execute on function public.log_sensitive_read(uuid, text, text, uuid, text, text) to authenticated;
grant execute on function public.log_document_access(uuid, uuid, text, text, timestamptz) to authenticated;

commit;
