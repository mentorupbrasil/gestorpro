begin;

-- Compatibilidade: RPCs históricas chamam public.log_audit; a função canônica é append_audit_log.
create or replace function public.log_audit(
  target_tenant_id uuid,
  audit_action text,
  audit_entity_type text,
  audit_entity_id uuid,
  audit_request_id text,
  audit_metadata_redacted jsonb default '{}'::jsonb
)
returns uuid
language sql
volatile
security definer
set search_path = ''
as $$
  select public.append_audit_log(
    target_tenant_id,
    audit_action,
    audit_entity_type,
    audit_entity_id,
    audit_request_id,
    coalesce(audit_metadata_redacted, '{}'::jsonb)
  );
$$;

revoke all on function public.log_audit(uuid, text, text, uuid, text, jsonb) from public;
grant execute on function public.log_audit(uuid, text, text, uuid, text, jsonb) to authenticated;

commit;
