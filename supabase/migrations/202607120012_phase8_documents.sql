begin;

insert into public.permissions (code, description)
values
  ('documents.read', 'Visualizar documentos autorizados'),
  ('documents.manage', 'Gerar e retificar documentos'),
  ('documents.sign', 'Assinar documentos com autenticação reforçada'),
  ('documents.deliver', 'Gerenciar entrega documental')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in ('documents.read', 'documents.manage', 'documents.sign', 'documents.deliver')
on conflict do nothing;

create table public.document_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text not null,
  document_type text not null check (document_type in ('aso', 'triage_form', 'exam_report', 'generic')),
  status text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  created_at timestamptz not null default now(),
  constraint document_templates_code_uq unique (tenant_id, code)
);

create table public.document_template_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  template_id uuid not null references public.document_templates(id) on delete restrict,
  version int not null check (version > 0),
  layout_payload jsonb not null,
  variable_schema jsonb not null default '{}'::jsonb,
  preview_fixture jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved', 'retired')),
  approved_by uuid references public.user_profiles(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint document_template_versions_uq unique (tenant_id, template_id, version)
);

create table public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  encounter_id uuid references public.encounters(id) on delete restrict,
  worker_id uuid references public.workers(id) on delete restrict,
  template_version_id uuid not null references public.document_template_versions(id) on delete restrict,
  document_type text not null check (document_type in ('aso', 'triage_form', 'exam_report', 'generic')),
  status text not null default 'draft' check (
    status in ('draft', 'rendering', 'issued', 'rectified', 'cancelled', 'failed')
  ),
  current_version int not null default 1 check (current_version > 0),
  vigente_version_id uuid,
  idempotency_key text not null,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint generated_documents_idempotency_uq unique (tenant_id, idempotency_key)
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  generated_document_id uuid not null references public.generated_documents(id) on delete restrict,
  version int not null check (version > 0),
  snapshot_payload jsonb not null,
  render_status text not null default 'pending' check (
    render_status in ('pending', 'rendering', 'rendered', 'failed')
  ),
  storage_bucket text not null default 'clinical-private' check (storage_bucket = 'clinical-private'),
  storage_path text not null,
  content_hash text not null,
  rectification_reason text,
  print_config jsonb not null default '{"paper":"A4","copies":1}'::jsonb,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint document_versions_doc_version_uq unique (tenant_id, generated_document_id, version),
  constraint document_versions_hash_uq unique (tenant_id, content_hash)
);

alter table public.generated_documents
  add constraint generated_documents_vigente_fk
  foreign key (vigente_version_id) references public.document_versions(id) on delete restrict;

create table public.document_signatures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  document_version_id uuid not null references public.document_versions(id) on delete restrict,
  signer_user_id uuid not null references public.user_profiles(id) on delete restrict,
  method text not null check (method in ('mfa_session', 'password_reauth', 'certificate_future')),
  aal text not null check (aal in ('aal1', 'aal2')),
  ip_address inet,
  user_agent text,
  signed_hash text not null,
  signed_at timestamptz not null default now()
);

create table public.document_deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  document_version_id uuid not null references public.document_versions(id) on delete restrict,
  recipient_type text not null check (recipient_type in ('worker', 'company', 'internal')),
  recipient_reference uuid,
  status text not null default 'pending' check (status in ('pending', 'available', 'delivered', 'revoked')),
  release_matrix_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.document_access_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  document_version_id uuid not null references public.document_versions(id) on delete restrict,
  actor_user_id uuid references public.user_profiles(id) on delete restrict,
  access_type text not null check (access_type in ('preview', 'download', 'print', 'signed_url')),
  request_id text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.reject_document_version_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'document versions are immutable' using errcode = '42501';
end;
$$;

create trigger document_versions_immutable
before update or delete on public.document_versions
for each row execute function public.reject_document_version_mutation();

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
  if not public.has_tenant_permission(target_tenant_id, 'documents.manage') then
    raise exception 'permission denied' using errcode = '42501';
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

  perform public.log_audit(
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
begin
  if not public.has_tenant_permission(target_tenant_id, 'documents.sign') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if aal_value <> 'aal2' then
    raise exception 'document signing requires aal2' using errcode = '42501';
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

  perform public.log_audit(
    target_tenant_id,
    'document.signed',
    'document_versions',
    target_document_version_id,
    audit_request_id,
    jsonb_build_object('method', method_value)
  );

  return signature_id;
end;
$$;

alter table public.document_templates enable row level security;
alter table public.document_template_versions enable row level security;
alter table public.generated_documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_signatures enable row level security;
alter table public.document_deliveries enable row level security;
alter table public.document_access_logs enable row level security;

create policy document_templates_read on public.document_templates
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'documents.read'));
create policy document_templates_manage on public.document_templates
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'documents.manage'))
  with check (public.has_tenant_permission(tenant_id, 'documents.manage'));
create policy document_template_versions_read on public.document_template_versions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'documents.read'));
create policy document_template_versions_manage on public.document_template_versions
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'documents.manage'))
  with check (public.has_tenant_permission(tenant_id, 'documents.manage'));
create policy generated_documents_read on public.generated_documents
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'documents.read'));
create policy generated_documents_manage on public.generated_documents
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'documents.manage'))
  with check (public.has_tenant_permission(tenant_id, 'documents.manage') and created_by = auth.uid());
create policy document_versions_read on public.document_versions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'documents.read'));
create policy document_versions_insert on public.document_versions
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'documents.manage') and created_by = auth.uid());
create policy document_signatures_read on public.document_signatures
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'documents.read'));
create policy document_signatures_insert on public.document_signatures
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'documents.sign') and signer_user_id = auth.uid());
create policy document_deliveries_read on public.document_deliveries
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'documents.read'));
create policy document_deliveries_manage on public.document_deliveries
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'documents.deliver'))
  with check (public.has_tenant_permission(tenant_id, 'documents.deliver') and created_by = auth.uid());
create policy document_access_logs_read on public.document_access_logs
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'audit.read'));
create policy document_access_logs_insert on public.document_access_logs
  for insert to authenticated
  with check (public.has_tenant_permission(tenant_id, 'documents.read'));

grant execute on function public.create_generated_document_version(uuid, uuid, uuid, text, text, jsonb, text, text, text, text) to authenticated;
grant execute on function public.sign_document_version(uuid, uuid, text, text, inet, text, text, text) to authenticated;

commit;
