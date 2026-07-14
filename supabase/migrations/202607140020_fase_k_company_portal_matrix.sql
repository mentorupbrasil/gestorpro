-- Fase K checkpoint: portal empresarial — membership, matriz de documentos, overview sem clínico.

create or replace function public.is_company_portal_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_portal_users portal_user
    where portal_user.company_id = target_company_id
      and portal_user.user_id = auth.uid()
      and portal_user.status = 'active'
  );
$$;

create or replace function public.upsert_company_portal_user(
  target_tenant_id uuid,
  target_company_id uuid,
  target_user_id uuid,
  status_value text,
  scopes_value jsonb,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  portal_user_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'company_portal.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if status_value not in ('active', 'suspended', 'revoked') then
    raise exception 'invalid portal user status' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.companies company
    where company.id = target_company_id and company.tenant_id = target_tenant_id
  ) then
    raise exception 'company not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.user_profiles profile
    where profile.id = target_user_id
  ) then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  insert into public.company_portal_users (
    tenant_id, company_id, user_id, status, scopes
  )
  values (
    target_tenant_id,
    target_company_id,
    target_user_id,
    status_value,
    coalesce(scopes_value, '[]'::jsonb)
  )
  on conflict (tenant_id, company_id, user_id) do update
    set status = excluded.status,
        scopes = excluded.scopes
  returning id into portal_user_id;

  perform public.append_audit_log(
    target_tenant_id,
    'company_portal.user.upserted',
    'company_portal_users',
    portal_user_id,
    audit_request_id,
    jsonb_build_object('companyId', target_company_id, 'status', status_value)
  );

  return portal_user_id;
end;
$$;

create or replace function public.upsert_company_document_release_rule(
  target_tenant_id uuid,
  target_company_id uuid,
  document_type_value text,
  release_to_company_value boolean,
  redaction_profile_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  rule_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'company_portal.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if document_type_value not in ('aso', 'triage_form', 'exam_report', 'generic') then
    raise exception 'invalid document type' using errcode = '22023';
  end if;

  if coalesce(nullif(trim(redaction_profile_value), ''), 'operational') not in (
    'operational', 'minimal', 'full_allowed'
  ) then
    raise exception 'invalid redaction profile' using errcode = '22023';
  end if;

  insert into public.company_document_release_rules (
    tenant_id,
    company_id,
    document_type,
    release_to_company,
    redaction_profile
  )
  values (
    target_tenant_id,
    target_company_id,
    document_type_value,
    coalesce(release_to_company_value, false),
    coalesce(nullif(trim(redaction_profile_value), ''), 'operational')
  )
  on conflict (tenant_id, company_id, document_type) do update
    set release_to_company = excluded.release_to_company,
        redaction_profile = excluded.redaction_profile
  returning id into rule_id;

  perform public.append_audit_log(
    target_tenant_id,
    'company_portal.release_rule.upserted',
    'company_document_release_rules',
    rule_id,
    audit_request_id,
    jsonb_build_object(
      'companyId', target_company_id,
      'documentType', document_type_value,
      'releaseToCompany', release_to_company_value
    )
  );

  return rule_id;
end;
$$;

create or replace function public.get_company_portal_overview(
  target_tenant_id uuid,
  target_company_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not (
    public.has_tenant_permission(target_tenant_id, 'company_portal.read')
    or public.has_tenant_permission(target_tenant_id, 'company_portal.manage')
    or public.is_company_portal_member(target_company_id)
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.companies company
    where company.id = target_company_id and company.tenant_id = target_tenant_id
  ) then
    raise exception 'company not found' using errcode = 'P0002';
  end if;

  -- Portal member may only query a company they belong to.
  if not (
    public.has_tenant_permission(target_tenant_id, 'company_portal.read')
    or public.has_tenant_permission(target_tenant_id, 'company_portal.manage')
  ) then
    if not public.is_company_portal_member(target_company_id) then
      raise exception 'permission denied' using errcode = '42501';
    end if;
  end if;

  select jsonb_build_object(
    'companyId', target_company_id,
    'invoices', coalesce((
      select jsonb_agg(to_jsonb(row_data))
      from (
        select
          invoice.id,
          invoice.status,
          invoice.total_cents as "totalCents",
          invoice.due_on as "dueOn",
          invoice.issued_at as "issuedAt"
        from public.invoices invoice
        where invoice.tenant_id = target_tenant_id
          and invoice.company_id = target_company_id
        order by invoice.created_at desc
        limit 40
      ) row_data
    ), '[]'::jsonb),
    'releasedDocuments', coalesce((
      select jsonb_agg(to_jsonb(row_data))
      from (
        select
          document.id,
          document.document_type as "documentType",
          document.status,
          document.current_version as "currentVersion",
          document.created_at as "createdAt"
        from public.generated_documents document
        join public.encounters encounter
          on encounter.id = document.encounter_id
         and encounter.tenant_id = document.tenant_id
        join public.referrals referral
          on referral.id = encounter.referral_id
         and referral.tenant_id = encounter.tenant_id
        join public.company_document_release_rules release_rule
          on release_rule.tenant_id = document.tenant_id
         and release_rule.company_id = referral.company_id
         and release_rule.document_type = document.document_type
         and release_rule.release_to_company = true
        where document.tenant_id = target_tenant_id
          and referral.company_id = target_company_id
        order by document.created_at desc
        limit 40
      ) row_data
    ), '[]'::jsonb),
    'encountersSafe', coalesce((
      select jsonb_agg(to_jsonb(row_data))
      from (
        select
          encounter.id,
          case encounter.status
            when 'checked_in' then 'Em atendimento'
            when 'in_progress' then 'Em atendimento'
            when 'waiting' then 'Aguardando'
            when 'completed' then 'Concluído'
            when 'cancelled' then 'Cancelado'
            else 'Em processamento'
          end as "statusLabel",
          encounter.checked_in_at as "checkedInAt"
        from public.encounters encounter
        join public.referrals referral
          on referral.id = encounter.referral_id
         and referral.tenant_id = encounter.tenant_id
        where encounter.tenant_id = target_tenant_id
          and referral.company_id = target_company_id
        order by encounter.checked_in_at desc
        limit 40
      ) row_data
    ), '[]'::jsonb),
    'releaseRules', coalesce((
      select jsonb_agg(to_jsonb(row_data))
      from (
        select
          rule.document_type as "documentType",
          rule.release_to_company as "releaseToCompany",
          rule.redaction_profile as "redactionProfile"
        from public.company_document_release_rules rule
        where rule.tenant_id = target_tenant_id
          and rule.company_id = target_company_id
        order by rule.document_type
      ) row_data
    ), '[]'::jsonb)
  ) into result;

  return coalesce(result, '{}'::jsonb);
end;
$$;

drop policy if exists portal_users_self_select on public.company_portal_users;
create policy portal_users_self_select on public.company_portal_users
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.has_tenant_permission(tenant_id, 'company_portal.read')
    or public.has_tenant_permission(tenant_id, 'company_portal.manage')
  );

drop policy if exists portal_release_rules_select on public.company_document_release_rules;
create policy portal_release_rules_select on public.company_document_release_rules
  for select to authenticated
  using (
    public.is_company_portal_member(company_id)
    or public.has_tenant_permission(tenant_id, 'company_portal.read')
    or public.has_tenant_permission(tenant_id, 'company_portal.manage')
  );

drop policy if exists portal_invoices_company_select on public.invoices;
create policy portal_invoices_company_select on public.invoices
  for select to authenticated
  using (
    public.is_company_portal_member(company_id)
    or public.has_tenant_permission(tenant_id, 'finance.read')
  );

revoke all on function public.is_company_portal_member(uuid) from public;
revoke all on function public.upsert_company_portal_user(uuid, uuid, uuid, text, jsonb, text) from public;
revoke all on function public.upsert_company_document_release_rule(uuid, uuid, text, boolean, text, text) from public;
revoke all on function public.get_company_portal_overview(uuid, uuid) from public;

grant execute on function public.is_company_portal_member(uuid) to authenticated;
grant execute on function public.upsert_company_portal_user(uuid, uuid, uuid, text, jsonb, text) to authenticated;
grant execute on function public.upsert_company_document_release_rule(uuid, uuid, text, boolean, text, text) to authenticated;
grant execute on function public.get_company_portal_overview(uuid, uuid) to authenticated;
