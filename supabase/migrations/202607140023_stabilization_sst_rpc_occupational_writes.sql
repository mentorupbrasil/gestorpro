-- Estabilização: SST RPC-only + FKs compostas; RPCs agenda/exame (fim DML direto crítico).

-- 1) SST: garantir sem escrita direta (idempotente se 022 já revogou).
drop policy if exists sst_incidents_manage on public.sst_incidents;
drop policy if exists sst_epi_manage on public.sst_epi_issues;
drop policy if exists sst_cipa_manage on public.sst_cipa_memberships;

revoke insert, update, delete on public.sst_incidents from authenticated;
revoke insert, update, delete on public.sst_epi_issues from authenticated;
revoke insert, update, delete on public.sst_cipa_memberships from authenticated;
grant select on public.sst_incidents to authenticated;
grant select on public.sst_epi_issues to authenticated;
grant select on public.sst_cipa_memberships to authenticated;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'companies_tenant_id_uq') then
    alter table public.companies add constraint companies_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'workers_tenant_id_uq') then
    alter table public.workers add constraint workers_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'sst_incidents_company_tenant_fk') then
    alter table public.sst_incidents
      add constraint sst_incidents_company_tenant_fk
      foreign key (tenant_id, company_id) references public.companies (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sst_incidents_worker_tenant_fk') then
    alter table public.sst_incidents
      add constraint sst_incidents_worker_tenant_fk
      foreign key (tenant_id, worker_id) references public.workers (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sst_epi_company_tenant_fk') then
    alter table public.sst_epi_issues
      add constraint sst_epi_company_tenant_fk
      foreign key (tenant_id, company_id) references public.companies (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sst_epi_worker_tenant_fk') then
    alter table public.sst_epi_issues
      add constraint sst_epi_worker_tenant_fk
      foreign key (tenant_id, worker_id) references public.workers (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sst_cipa_company_tenant_fk') then
    alter table public.sst_cipa_memberships
      add constraint sst_cipa_company_tenant_fk
      foreign key (tenant_id, company_id) references public.companies (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sst_cipa_worker_tenant_fk') then
    alter table public.sst_cipa_memberships
      add constraint sst_cipa_worker_tenant_fk
      foreign key (tenant_id, worker_id) references public.workers (tenant_id, id) on delete restrict;
  end if;
end;
$$;

-- 2) Catálogo de exames via RPC
create or replace function public.create_exam_catalog_item(
  target_tenant_id uuid,
  code_value text,
  name_value text,
  result_type_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  catalog_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'protocols.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  insert into public.exam_catalog (tenant_id, code, name, result_type)
  values (
    target_tenant_id,
    upper(trim(code_value)),
    trim(name_value),
    result_type_value
  )
  returning id into catalog_id;

  perform public.append_audit_log(
    target_tenant_id,
    'exam_catalog.created',
    'exam_catalog',
    catalog_id,
    audit_request_id,
    jsonb_build_object('code', upper(trim(code_value)))
  );

  return catalog_id;
end;
$$;

-- 3) Recurso de agenda via RPC (unidade)
create or replace function public.upsert_schedule_resource(
  target_tenant_id uuid,
  target_clinic_unit_id uuid,
  code_value text,
  name_value text,
  resource_type_value text,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  resource_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_unit_permission(target_clinic_unit_id, 'schedule.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.clinic_units unit_scope
    where unit_scope.id = target_clinic_unit_id
      and unit_scope.tenant_id = target_tenant_id
  ) then
    raise exception 'clinic unit not found' using errcode = 'P0002';
  end if;

  if resource_type_value not in ('room', 'professional', 'equipment', 'procedure') then
    raise exception 'invalid resource type' using errcode = '22023';
  end if;

  insert into public.schedule_resources (
    tenant_id, clinic_unit_id, code, name, resource_type, status
  )
  values (
    target_tenant_id,
    target_clinic_unit_id,
    upper(trim(code_value)),
    trim(name_value),
    resource_type_value,
    'active'
  )
  on conflict (tenant_id, clinic_unit_id, code) do update
    set name = excluded.name,
        resource_type = excluded.resource_type,
        status = 'active',
        updated_at = now()
  returning id into resource_id;

  perform public.append_audit_log(
    target_tenant_id,
    'schedule.resource.upserted',
    'schedule_resources',
    resource_id,
    audit_request_id,
    jsonb_build_object('clinicUnitId', target_clinic_unit_id, 'code', upper(trim(code_value)))
  );

  return resource_id;
end;
$$;

revoke all on function public.create_exam_catalog_item(uuid, text, text, text, text) from public;
revoke all on function public.upsert_schedule_resource(uuid, uuid, text, text, text, text) from public;
grant execute on function public.create_exam_catalog_item(uuid, text, text, text, text) to authenticated;
grant execute on function public.upsert_schedule_resource(uuid, uuid, text, text, text, text) to authenticated;
