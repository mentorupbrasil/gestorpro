begin;

insert into public.permissions (code, description)
values
  ('clinical.read', 'Visualizar dados clínicos conforme escopo'),
  ('triage.manage', 'Registrar triagem ocupacional'),
  ('consultations.manage', 'Registrar consulta médica ocupacional'),
  ('conclusions.manage', 'Registrar conclusão médica humana'),
  ('clinical.reopen', 'Reabrir registro clínico fechado com justificativa')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in (
    'clinical.read',
    'triage.manage',
    'consultations.manage',
    'conclusions.manage',
    'clinical.reopen'
  )
on conflict do nothing;

create table public.clinical_professional_credentials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  user_id uuid not null references public.user_profiles(id) on delete restrict,
  clinic_unit_id uuid references public.clinic_units(id) on delete restrict,
  professional_role text not null check (professional_role in ('physician', 'nurse', 'technician')),
  council_code text,
  council_region text,
  registration_number text,
  status text not null default 'active' check (status in ('active', 'suspended', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_credentials_identity_uq unique (
    tenant_id,
    user_id,
    professional_role,
    council_code,
    council_region,
    registration_number
  )
);

create table public.triage_form_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  created_at timestamptz not null default now(),
  constraint triage_form_templates_tenant_code_uq unique (tenant_id, code)
);

create table public.triage_form_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  template_id uuid not null references public.triage_form_templates(id) on delete restrict,
  version int not null check (version > 0),
  schema_json jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'retired')),
  approved_by uuid references public.user_profiles(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint triage_form_versions_template_version_uq unique (tenant_id, template_id, version)
);

create table public.triage_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  form_version_id uuid not null references public.triage_form_versions(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'closed', 'reopened', 'voided')),
  current_version int not null default 1 check (current_version > 0),
  closed_at timestamptz,
  closed_by uuid references public.user_profiles(id) on delete restrict,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint triage_records_encounter_uq unique (tenant_id, encounter_id)
);

create table public.triage_record_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  triage_record_id uuid not null references public.triage_records(id) on delete restrict,
  version int not null check (version > 0),
  payload jsonb not null,
  reason text not null,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint triage_record_versions_record_version_uq unique (tenant_id, triage_record_id, version)
);

create table public.clinical_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  source_type text not null check (source_type in ('triage', 'exam', 'manual')),
  severity text not null check (severity in ('info', 'attention', 'urgent')),
  message text not null,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'dismissed')),
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.clinical_alert_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  alert_id uuid not null references public.clinical_alerts(id) on delete restrict,
  acknowledged_by uuid not null references public.user_profiles(id) on delete restrict,
  note text,
  created_at timestamptz not null default now(),
  constraint clinical_alert_ack_user_uq unique (tenant_id, alert_id, acknowledged_by)
);

create table public.encounter_flow_pauses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  reason text not null,
  status text not null default 'active' check (status in ('active', 'resolved', 'cancelled')),
  resolved_note text,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  resolved_by uuid references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.medical_consultations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  physician_credential_id uuid not null references public.clinical_professional_credentials(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'closed', 'reopened', 'voided')),
  current_version int not null default 1 check (current_version > 0),
  closed_at timestamptz,
  closed_by uuid references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medical_consultations_encounter_uq unique (tenant_id, encounter_id)
);

create table public.medical_consultation_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  consultation_id uuid not null references public.medical_consultations(id) on delete restrict,
  version int not null check (version > 0),
  subjective jsonb not null default '{}'::jsonb,
  objective jsonb not null default '{}'::jsonb,
  assessment text,
  plan text,
  reason text not null,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint medical_consultation_versions_consultation_version_uq unique (
    tenant_id,
    consultation_id,
    version
  )
);

create table public.medical_consultation_addenda (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  consultation_id uuid not null references public.medical_consultations(id) on delete restrict,
  note text not null,
  reason text not null,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.medical_conclusion_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null,
  block_when_pending_required_exams boolean not null default true,
  block_when_no_closed_triage boolean not null default true,
  block_when_no_closed_consultation boolean not null default true,
  block_when_flow_paused boolean not null default true,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  constraint medical_conclusion_rules_code_uq unique (tenant_id, code)
);

create table public.medical_conclusions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  consultation_id uuid not null references public.medical_consultations(id) on delete restrict,
  physician_credential_id uuid not null references public.clinical_professional_credentials(id) on delete restrict,
  conclusion_code text not null check (
    conclusion_code in ('fit', 'fit_with_restrictions', 'unfit', 'inconclusive')
  ),
  restrictions jsonb not null default '[]'::jsonb,
  notes text,
  signed_at timestamptz,
  signature_status text not null default 'prepared' check (
    signature_status in ('prepared', 'signed', 'revoked')
  ),
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint medical_conclusions_encounter_uq unique (tenant_id, encounter_id)
);

create or replace function public.save_triage_record(
  target_tenant_id uuid,
  target_encounter_id uuid,
  target_form_version_id uuid,
  payload_value jsonb,
  close_record boolean,
  change_reason text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  record_id uuid;
  next_version int;
begin
  if not public.has_tenant_permission(target_tenant_id, 'triage.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select id, current_version + 1
    into record_id, next_version
  from public.triage_records
  where tenant_id = target_tenant_id
    and encounter_id = target_encounter_id
  for update;

  if record_id is null then
    insert into public.triage_records (
      tenant_id,
      encounter_id,
      form_version_id,
      status,
      closed_at,
      closed_by,
      created_by
    )
    values (
      target_tenant_id,
      target_encounter_id,
      target_form_version_id,
      case when close_record then 'closed' else 'draft' end,
      case when close_record then now() else null end,
      case when close_record then auth.uid() else null end,
      auth.uid()
    )
    returning id, current_version into record_id, next_version;
  else
    update public.triage_records
      set current_version = next_version,
          status = case when close_record then 'closed' else 'reopened' end,
          closed_at = case when close_record then now() else null end,
          closed_by = case when close_record then auth.uid() else null end,
          updated_at = now()
    where id = record_id
      and tenant_id = target_tenant_id;
  end if;

  insert into public.triage_record_versions (
    tenant_id,
    triage_record_id,
    version,
    payload,
    reason,
    created_by
  )
  values (
    target_tenant_id,
    record_id,
    coalesce(next_version, 1),
    payload_value,
    nullif(trim(change_reason), ''),
    auth.uid()
  );

  perform public.log_audit(
    target_tenant_id,
    'triage.saved',
    'triage_records',
    record_id,
    audit_request_id,
    jsonb_build_object('closed', close_record)
  );

  return record_id;
end;
$$;

create or replace function public.close_medical_consultation(
  target_tenant_id uuid,
  target_encounter_id uuid,
  physician_credential_id_value uuid,
  subjective_value jsonb,
  objective_value jsonb,
  assessment_value text,
  plan_value text,
  change_reason text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  consultation_id uuid;
  next_version int;
  credential_record record;
begin
  if not public.has_tenant_permission(target_tenant_id, 'consultations.manage') then
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

  select id, current_version + 1
    into consultation_id, next_version
  from public.medical_consultations
  where tenant_id = target_tenant_id
    and encounter_id = target_encounter_id
  for update;

  if consultation_id is null then
    insert into public.medical_consultations (
      tenant_id,
      encounter_id,
      physician_credential_id,
      status,
      closed_at,
      closed_by
    )
    values (
      target_tenant_id,
      target_encounter_id,
      physician_credential_id_value,
      'closed',
      now(),
      auth.uid()
    )
    returning id, current_version into consultation_id, next_version;
  else
    update public.medical_consultations
      set current_version = next_version,
          physician_credential_id = physician_credential_id_value,
          status = 'closed',
          closed_at = now(),
          closed_by = auth.uid(),
          updated_at = now()
    where id = consultation_id
      and tenant_id = target_tenant_id;
  end if;

  insert into public.medical_consultation_versions (
    tenant_id,
    consultation_id,
    version,
    subjective,
    objective,
    assessment,
    plan,
    reason,
    created_by
  )
  values (
    target_tenant_id,
    consultation_id,
    coalesce(next_version, 1),
    coalesce(subjective_value, '{}'::jsonb),
    coalesce(objective_value, '{}'::jsonb),
    nullif(trim(assessment_value), ''),
    nullif(trim(plan_value), ''),
    nullif(trim(change_reason), ''),
    auth.uid()
  );

  perform public.log_audit(
    target_tenant_id,
    'consultation.closed',
    'medical_consultations',
    consultation_id,
    audit_request_id,
    '{}'::jsonb
  );

  return consultation_id;
end;
$$;

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
begin
  if not public.has_tenant_permission(target_tenant_id, 'conclusions.manage') then
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
    auth.uid()
  )
  returning id into conclusion_id;

  perform public.log_audit(
    target_tenant_id,
    'medical_conclusion.prepared',
    'medical_conclusions',
    conclusion_id,
    audit_request_id,
    jsonb_build_object('conclusionCode', conclusion_code_value)
  );

  return conclusion_id;
end;
$$;

alter table public.clinical_professional_credentials enable row level security;
alter table public.triage_form_templates enable row level security;
alter table public.triage_form_versions enable row level security;
alter table public.triage_records enable row level security;
alter table public.triage_record_versions enable row level security;
alter table public.clinical_alerts enable row level security;
alter table public.clinical_alert_acknowledgements enable row level security;
alter table public.encounter_flow_pauses enable row level security;
alter table public.medical_consultations enable row level security;
alter table public.medical_consultation_versions enable row level security;
alter table public.medical_consultation_addenda enable row level security;
alter table public.medical_conclusion_rules enable row level security;
alter table public.medical_conclusions enable row level security;

create policy clinical_credentials_read on public.clinical_professional_credentials
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy clinical_credentials_manage on public.clinical_professional_credentials
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'consultations.manage'))
  with check (public.has_tenant_permission(tenant_id, 'consultations.manage'));

create policy triage_templates_read on public.triage_form_templates
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy triage_templates_manage on public.triage_form_templates
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'triage.manage'))
  with check (public.has_tenant_permission(tenant_id, 'triage.manage'));
create policy triage_versions_read on public.triage_form_versions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy triage_versions_manage on public.triage_form_versions
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'triage.manage'))
  with check (public.has_tenant_permission(tenant_id, 'triage.manage'));

create policy triage_records_read on public.triage_records
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy triage_records_manage on public.triage_records
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'triage.manage'))
  with check (public.has_tenant_permission(tenant_id, 'triage.manage'));
create policy triage_record_versions_read on public.triage_record_versions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy triage_record_versions_insert on public.triage_record_versions
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'triage.manage') and created_by = auth.uid());

create policy clinical_alerts_read on public.clinical_alerts
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy clinical_alerts_manage on public.clinical_alerts
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'consultations.manage'))
  with check (public.has_tenant_permission(tenant_id, 'consultations.manage') and created_by = auth.uid());
create policy clinical_alert_acks_read on public.clinical_alert_acknowledgements
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy clinical_alert_acks_insert on public.clinical_alert_acknowledgements
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'consultations.manage') and acknowledged_by = auth.uid());

create policy encounter_pauses_read on public.encounter_flow_pauses
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy encounter_pauses_manage on public.encounter_flow_pauses
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'consultations.manage'))
  with check (public.has_tenant_permission(tenant_id, 'consultations.manage') and created_by = auth.uid());

create policy medical_consultations_read on public.medical_consultations
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy medical_consultations_manage on public.medical_consultations
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'consultations.manage'))
  with check (public.has_tenant_permission(tenant_id, 'consultations.manage'));
create policy medical_consultation_versions_read on public.medical_consultation_versions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy medical_consultation_versions_insert on public.medical_consultation_versions
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'consultations.manage') and created_by = auth.uid());
create policy medical_consultation_addenda_read on public.medical_consultation_addenda
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy medical_consultation_addenda_insert on public.medical_consultation_addenda
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'consultations.manage') and created_by = auth.uid());

create policy medical_conclusion_rules_read on public.medical_conclusion_rules
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy medical_conclusion_rules_manage on public.medical_conclusion_rules
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'conclusions.manage'))
  with check (public.has_tenant_permission(tenant_id, 'conclusions.manage'));
create policy medical_conclusions_read on public.medical_conclusions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'clinical.read'));
create policy medical_conclusions_insert on public.medical_conclusions
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'conclusions.manage') and created_by = auth.uid());

grant execute on function public.save_triage_record(uuid, uuid, uuid, jsonb, boolean, text, text) to authenticated;
grant execute on function public.close_medical_consultation(uuid, uuid, uuid, jsonb, jsonb, text, text, text, text) to authenticated;
grant execute on function public.create_medical_conclusion(uuid, uuid, uuid, uuid, text, jsonb, text, text) to authenticated;

commit;
