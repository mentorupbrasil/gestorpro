begin;

insert into public.permissions (code, description)
values
  ('messages.read', 'Visualizar mensagens e notificações'),
  ('messages.manage', 'Gerenciar templates e envios de mensagens')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in ('messages.read', 'messages.manage')
on conflict do nothing;

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  channel text not null check (channel in ('email', 'whatsapp_official', 'sms', 'internal', 'webhook')),
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  created_at timestamptz not null default now(),
  constraint message_templates_code_uq unique (tenant_id, code)
);

create table public.message_template_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  template_id uuid not null references public.message_templates(id) on delete restrict,
  version int not null check (version > 0),
  subject_template text,
  body_template text not null,
  variables_schema jsonb not null default '{}'::jsonb,
  contains_sensitive_content boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'approved', 'retired')),
  approved_by uuid references public.user_profiles(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint message_template_versions_uq unique (tenant_id, template_id, version)
);

create table public.message_consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  subject_type text not null check (subject_type in ('worker', 'company_contact', 'user')),
  subject_reference uuid not null,
  channel text not null check (channel in ('email', 'whatsapp_official', 'sms', 'internal', 'webhook')),
  legal_basis text not null,
  status text not null default 'granted' check (status in ('granted', 'revoked', 'not_required')),
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint message_consents_subject_channel_uq unique (
    tenant_id,
    subject_type,
    subject_reference,
    channel
  )
);

create table public.message_opt_outs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  channel text not null check (channel in ('email', 'whatsapp_official', 'sms')),
  destination_hash text not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint message_opt_outs_destination_uq unique (tenant_id, channel, destination_hash)
);

create table public.message_queue (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  template_version_id uuid references public.message_template_versions(id) on delete restrict,
  integration_connection_id uuid references public.integration_connections(id) on delete restrict,
  channel text not null check (channel in ('email', 'whatsapp_official', 'sms', 'internal', 'webhook')),
  recipient_type text not null,
  recipient_reference uuid,
  destination_hash text not null,
  idempotency_key text not null,
  payload_redacted jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (
    status in ('queued', 'processing', 'sent', 'delivered', 'failed', 'retrying', 'cancelled')
  ),
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_by uuid references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint message_queue_idempotency_uq unique (tenant_id, channel, idempotency_key)
);

create table public.message_deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  message_id uuid not null references public.message_queue(id) on delete restrict,
  provider_message_id text,
  status text not null check (status in ('accepted', 'sent', 'delivered', 'failed', 'bounced', 'opted_out')),
  response_redacted jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function public.enqueue_message(
  target_tenant_id uuid,
  template_version_id_value uuid,
  connection_id_value uuid,
  channel_value text,
  recipient_type_value text,
  recipient_reference_value uuid,
  destination_hash_value text,
  idempotency_key_value text,
  payload_redacted_value jsonb,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  message_id uuid;
begin
  if not public.has_tenant_permission(target_tenant_id, 'messages.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if channel_value in ('email', 'whatsapp_official', 'sms') and exists (
    select 1 from public.message_opt_outs opt
    where opt.tenant_id = target_tenant_id
      and opt.channel = channel_value
      and opt.destination_hash = destination_hash_value
  ) then
    raise exception 'recipient opted out' using errcode = '42501';
  end if;

  insert into public.message_queue (
    tenant_id,
    template_version_id,
    integration_connection_id,
    channel,
    recipient_type,
    recipient_reference,
    destination_hash,
    idempotency_key,
    payload_redacted,
    created_by
  )
  values (
    target_tenant_id,
    template_version_id_value,
    connection_id_value,
    channel_value,
    recipient_type_value,
    recipient_reference_value,
    destination_hash_value,
    idempotency_key_value,
    coalesce(payload_redacted_value, '{}'::jsonb),
    auth.uid()
  )
  on conflict (tenant_id, channel, idempotency_key) do update
    set payload_redacted = excluded.payload_redacted
  returning id into message_id;

  perform public.log_audit(
    target_tenant_id,
    'message.enqueued',
    'message_queue',
    message_id,
    audit_request_id,
    jsonb_build_object('channel', channel_value)
  );

  return message_id;
end;
$$;

alter table public.message_templates enable row level security;
alter table public.message_template_versions enable row level security;
alter table public.message_consents enable row level security;
alter table public.message_opt_outs enable row level security;
alter table public.message_queue enable row level security;
alter table public.message_deliveries enable row level security;

create policy message_templates_read on public.message_templates
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'messages.read'));
create policy message_templates_manage on public.message_templates
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'messages.manage'))
  with check (public.has_tenant_permission(tenant_id, 'messages.manage'));
create policy message_template_versions_read on public.message_template_versions
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'messages.read'));
create policy message_template_versions_manage on public.message_template_versions
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'messages.manage'))
  with check (public.has_tenant_permission(tenant_id, 'messages.manage'));
create policy message_consents_read on public.message_consents
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'messages.read'));
create policy message_consents_manage on public.message_consents
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'messages.manage'))
  with check (public.has_tenant_permission(tenant_id, 'messages.manage'));
create policy message_opt_outs_read on public.message_opt_outs
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'messages.read'));
create policy message_opt_outs_manage on public.message_opt_outs
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'messages.manage'))
  with check (public.has_tenant_permission(tenant_id, 'messages.manage'));
create policy message_queue_read on public.message_queue
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'messages.read'));
create policy message_queue_manage on public.message_queue
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'messages.manage'))
  with check (public.has_tenant_permission(tenant_id, 'messages.manage'));
create policy message_deliveries_read on public.message_deliveries
  for select to authenticated using (public.has_tenant_permission(tenant_id, 'messages.read'));
create policy message_deliveries_manage on public.message_deliveries
  for all to authenticated
  using (public.has_tenant_permission(tenant_id, 'messages.manage'))
  with check (public.has_tenant_permission(tenant_id, 'messages.manage'));

grant execute on function public.enqueue_message(uuid, uuid, uuid, text, text, uuid, text, text, jsonb, text) to authenticated;

commit;
