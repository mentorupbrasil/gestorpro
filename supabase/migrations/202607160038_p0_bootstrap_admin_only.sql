-- P0: bootstrap admin-only — cria estrutura administrativa mínima.
-- NÃO atribui papéis clínicos/financeiros; NÃO aprova templates clínicos/ASO.
-- Templates ficam em draft para aprovação humana explícita.
-- Demo clínico completo permanece atrás de seed/ambiente de teste, não deste RPC.

begin;

create or replace function public.bootstrap_tenant_operations(
  target_tenant_id uuid,
  audit_request_id text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_membership_id uuid;
  unit_id uuid;
  unit_created boolean := false;
  template_id uuid;
  form_version_id uuid;
  form_created boolean := false;
  aso_template_id uuid;
  aso_version_id uuid;
  aso_created boolean := false;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'roles.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select membership.id
    into current_membership_id
  from public.tenant_memberships membership
  join public.user_profiles profile on profile.id = membership.user_id
  where membership.tenant_id = target_tenant_id
    and membership.user_id = auth.uid()
    and membership.status = 'active'
    and profile.status = 'active'
    and membership.valid_from <= now()
    and (membership.valid_until is null or membership.valid_until > now())
  for update of membership;

  if current_membership_id is null then
    raise exception 'tenant access denied' using errcode = '42501';
  end if;

  select unit.id
    into unit_id
  from public.clinic_units unit
  where unit.tenant_id = target_tenant_id
    and unit.status = 'active'
  order by unit.created_at
  limit 1
  for share;

  if unit_id is null then
    insert into public.clinic_units (tenant_id, code, name, status, timezone)
    values (target_tenant_id, 'SEDE', 'Unidade principal', 'active', 'America/Fortaleza')
    returning id into unit_id;
    unit_created := true;
  end if;

  -- Formulário de triagem em draft (nunca autoaprovado).
  select version.id, version.template_id
    into form_version_id, template_id
  from public.triage_form_versions version
  where version.tenant_id = target_tenant_id
  order by case when version.status = 'approved' then 0 else 1 end, version.version desc
  limit 1
  for share;

  if form_version_id is null then
    insert into public.triage_form_templates (tenant_id, code, name, status)
    values (target_tenant_id, 'TRIAGE_DEFAULT', 'Triagem ocupacional padrão', 'active')
    on conflict (tenant_id, code) do update
      set status = 'active',
          name = excluded.name
    returning id into template_id;

    if template_id is null then
      select id into template_id
      from public.triage_form_templates
      where tenant_id = target_tenant_id
        and code = 'TRIAGE_DEFAULT';
    end if;

    insert into public.triage_form_versions (
      tenant_id,
      template_id,
      version,
      schema_json,
      status
    )
    values (
      target_tenant_id,
      template_id,
      1,
      jsonb_build_object(
        'code', 'TRIAGE_DEFAULT',
        'sections', jsonb_build_array(
          jsonb_build_object('code', 'vitals', 'label', 'Sinais vitais'),
          jsonb_build_object('code', 'anthropometry', 'label', 'Antropometria'),
          jsonb_build_object('code', 'habits', 'label', 'Hábitos')
        )
      ),
      'draft'
    )
    on conflict (tenant_id, template_id, version) do update
      set schema_json = excluded.schema_json
    returning id into form_version_id;

    form_created := true;
  end if;

  -- Template ASO em draft (nunca stub aprovado automaticamente).
  select version.id
    into aso_version_id
  from public.document_template_versions version
  join public.document_templates template
    on template.id = version.template_id
   and template.tenant_id = version.tenant_id
  where version.tenant_id = target_tenant_id
    and template.document_type = 'aso'
  order by case when version.status = 'approved' then 0 else 1 end, version.version desc
  limit 1
  for share;

  if aso_version_id is null then
    insert into public.document_templates (tenant_id, code, name, document_type, status)
    values (target_tenant_id, 'ASO_DEFAULT', 'ASO padrão', 'aso', 'active')
    on conflict (tenant_id, code) do update
      set status = 'active',
          name = excluded.name
    returning id into aso_template_id;

    if aso_template_id is null then
      select id into aso_template_id
      from public.document_templates
      where tenant_id = target_tenant_id
        and code = 'ASO_DEFAULT';
    end if;

    insert into public.document_template_versions (
      tenant_id,
      template_id,
      version,
      layout_payload,
      variable_schema,
      preview_fixture,
      status
    )
    values (
      target_tenant_id,
      aso_template_id,
      1,
      jsonb_build_object('kind', 'aso_operational', 'pages', 1),
      '{}'::jsonb,
      '{}'::jsonb,
      'draft'
    )
    on conflict (tenant_id, template_id, version) do update
      set layout_payload = excluded.layout_payload
    returning id into aso_version_id;

    aso_created := true;
  end if;

  perform public.append_audit_log(
    target_tenant_id,
    'tenant.operations_bootstrapped',
    'tenant',
    target_tenant_id,
    audit_request_id,
    jsonb_build_object(
      'aso_created', aso_created,
      'aso_version_id', aso_version_id,
      'form_created', form_created,
      'form_version_id', form_version_id,
      'roles_assigned', '[]'::jsonb,
      'self_grant_clinical', false,
      'unit_created', unit_created,
      'unit_id', unit_id
    )
  );

  return jsonb_build_object(
    'asoCreated', aso_created,
    'asoVersionId', aso_version_id,
    'formCreated', form_created,
    'formVersionId', form_version_id,
    'rolesAssigned', '[]'::jsonb,
    'unitCreated', unit_created,
    'unitId', unit_id
  );
end;
$$;

revoke all on function public.bootstrap_tenant_operations(uuid, text) from public, anon, authenticated;
grant execute on function public.bootstrap_tenant_operations(uuid, text) to authenticated;

commit;
