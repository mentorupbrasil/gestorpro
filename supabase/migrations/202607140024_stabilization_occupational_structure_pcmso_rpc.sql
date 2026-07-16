-- Estabilização: estrutura ocupacional + publicação PCMSO via RPC (fim DML direto).

-- 1) PCMSO: permitir expirar aprovado sem reabrir conteúdo; manter approved_at no histórico.
alter table public.pcmso_versions
  drop constraint if exists pcmso_versions_approval_ck;

alter table public.pcmso_versions
  add constraint pcmso_versions_approval_ck check (
    (status = 'draft' and approved_at is null)
    or (status in ('approved', 'expired') and approved_at is not null)
  );

create or replace function public.reject_approved_pcmso_version_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and old.status = 'approved' then
    raise exception 'approved PCMSO versions are immutable' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and old.status = 'approved' then
    if new.status = 'expired'
      and new.approved_at is not distinct from old.approved_at
      and new.content_hash is not distinct from old.content_hash
      and new.pcmso_program_id is not distinct from old.pcmso_program_id
      and new.company_id is not distinct from old.company_id
      and new.tenant_id is not distinct from old.tenant_id
      and new.version_number is not distinct from old.version_number
      and new.valid_from is not distinct from old.valid_from
      and new.valid_until is not distinct from old.valid_until
    then
      return new;
    end if;

    raise exception 'approved PCMSO versions are immutable' using errcode = '42501';
  end if;

  return new;
end;
$$;

-- 2) Revogar DML direto nas tabelas convertidas para RPC.
drop policy if exists company_establishments_insert on public.company_establishments;
drop policy if exists company_establishments_update on public.company_establishments;
drop policy if exists sectors_write on public.sectors;
drop policy if exists job_positions_write on public.job_positions;
drop policy if exists exposure_groups_write on public.exposure_groups;
drop policy if exists occupational_risks_write on public.occupational_risks;
drop policy if exists risk_assignments_insert on public.risk_assignments;
drop policy if exists risk_assignments_update on public.risk_assignments;
drop policy if exists employment_contracts_insert on public.employment_contracts;
drop policy if exists employment_contracts_update on public.employment_contracts;
drop policy if exists employment_contract_history_insert on public.employment_contract_history;
drop policy if exists pcmso_programs_write on public.pcmso_programs;
drop policy if exists pcmso_versions_write on public.pcmso_versions;

revoke insert, update, delete on public.company_establishments from authenticated;
revoke insert, update, delete on public.sectors from authenticated;
revoke insert, update, delete on public.job_positions from authenticated;
revoke insert, update, delete on public.exposure_groups from authenticated;
revoke insert, update, delete on public.occupational_risks from authenticated;
revoke insert, update, delete on public.risk_assignments from authenticated;
revoke insert, update, delete on public.employment_contracts from authenticated;
revoke insert, update, delete on public.employment_contract_history from authenticated;
revoke insert, update, delete on public.pcmso_programs from authenticated;
revoke insert, update, delete on public.pcmso_versions from authenticated;

grant select on public.company_establishments to authenticated;
grant select on public.sectors to authenticated;
grant select on public.job_positions to authenticated;
grant select on public.exposure_groups to authenticated;
grant select on public.occupational_risks to authenticated;
grant select on public.risk_assignments to authenticated;
grant select on public.employment_contracts to authenticated;
grant select on public.employment_contract_history to authenticated;
grant select on public.pcmso_programs to authenticated;
grant select on public.pcmso_versions to authenticated;

-- 3) Publicar / aprovar versão PCMSO com hash determinístico e expiração de sobreposição.
create or replace function public.publish_pcmso_version(
  target_tenant_id uuid,
  company_id_value uuid,
  program_code text,
  program_name text,
  version_number_value int,
  valid_from_value date,
  valid_until_value date,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  normalized_code text := upper(trim(program_code));
  program_id uuid;
  version_id uuid;
  content_hash_value text;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'protocols.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if version_number_value is null or version_number_value <= 0 then
    raise exception 'invalid version number' using errcode = '22023';
  end if;

  if valid_from_value is null then
    raise exception 'valid_from required' using errcode = '22023';
  end if;

  if valid_until_value is not null and valid_until_value <= valid_from_value then
    raise exception 'invalid pcmso period' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.companies company
    where company.id = company_id_value
      and company.tenant_id = target_tenant_id
  ) then
    raise exception 'company not found' using errcode = 'P0002';
  end if;

  insert into public.pcmso_programs (
    tenant_id,
    company_id,
    code,
    name,
    status
  )
  values (
    target_tenant_id,
    company_id_value,
    normalized_code,
    trim(program_name),
    'active'
  )
  on conflict (tenant_id, company_id, code) do update
    set name = excluded.name,
        status = 'active',
        updated_at = now()
  returning id into program_id;

  content_hash_value := encode(
    digest(
      target_tenant_id::text
        || ':' || company_id_value::text
        || ':' || program_id::text
        || ':' || version_number_value::text
        || ':' || valid_from_value::text
        || ':' || coalesce(valid_until_value::text, ''),
      'sha256'
    ),
    'hex'
  );

  update public.pcmso_versions
  set status = 'expired',
      updated_at = now()
  where tenant_id = target_tenant_id
    and pcmso_program_id = program_id
    and status = 'approved'
    and valid_from < coalesce(valid_until_value, 'infinity'::date)
    and coalesce(valid_until, 'infinity'::date) > valid_from_value;

  insert into public.pcmso_versions (
    tenant_id,
    company_id,
    pcmso_program_id,
    version_number,
    valid_from,
    valid_until,
    status,
    approved_at,
    content_hash
  )
  values (
    target_tenant_id,
    company_id_value,
    program_id,
    version_number_value,
    valid_from_value,
    valid_until_value,
    'approved',
    now(),
    content_hash_value
  )
  returning id into version_id;

  perform public.append_audit_log(
    target_tenant_id,
    'pcmso_version.published',
    'pcmso_version',
    version_id,
    audit_request_id,
    jsonb_build_object(
      'companyId', company_id_value,
      'contentHash', content_hash_value,
      'programId', program_id,
      'versionNumber', version_number_value
    )
  );

  return version_id;
end;
$$;

revoke all on function public.publish_pcmso_version(uuid, uuid, text, text, int, date, date, text) from public;
grant execute on function public.publish_pcmso_version(uuid, uuid, text, text, int, date, date, text) to authenticated;

-- 4) Estrutura ocupacional + vínculo em uma transação.
create or replace function public.create_occupational_structure(
  target_tenant_id uuid,
  company_id_value uuid,
  worker_id_value uuid,
  establishment_code text,
  establishment_name text,
  sector_code text,
  sector_name text,
  job_code text,
  job_name text,
  exposure_group_code text,
  exposure_group_name text,
  risk_code text,
  risk_name text,
  risk_type_value text,
  starts_on_value date,
  audit_request_id text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  establishment_id uuid;
  sector_id uuid;
  job_id uuid;
  exposure_group_id uuid;
  risk_id uuid;
  employment_id uuid;
begin
  if not public.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if not public.has_tenant_permission(target_tenant_id, 'occupational.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if risk_type_value not in ('physical', 'chemical', 'biological', 'ergonomic', 'accident') then
    raise exception 'invalid risk type' using errcode = '22023';
  end if;

  if starts_on_value is null then
    raise exception 'starts_on required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.companies company
    where company.id = company_id_value
      and company.tenant_id = target_tenant_id
  ) then
    raise exception 'company not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.workers worker
    where worker.id = worker_id_value
      and worker.tenant_id = target_tenant_id
  ) then
    raise exception 'worker not found' using errcode = 'P0002';
  end if;

  insert into public.company_establishments (
    tenant_id, company_id, code, name, status
  )
  values (
    target_tenant_id,
    company_id_value,
    upper(trim(establishment_code)),
    trim(establishment_name),
    'active'
  )
  on conflict (tenant_id, company_id, code) do update
    set name = excluded.name,
        status = 'active',
        updated_at = now()
  returning id into establishment_id;

  insert into public.sectors (
    tenant_id, company_id, establishment_id, code, name, status
  )
  values (
    target_tenant_id,
    company_id_value,
    establishment_id,
    upper(trim(sector_code)),
    trim(sector_name),
    'active'
  )
  on conflict (tenant_id, company_id, code) do update
    set establishment_id = excluded.establishment_id,
        name = excluded.name,
        status = 'active',
        updated_at = now()
  returning id into sector_id;

  insert into public.job_positions (
    tenant_id, company_id, sector_id, code, name, status
  )
  values (
    target_tenant_id,
    company_id_value,
    sector_id,
    upper(trim(job_code)),
    trim(job_name),
    'active'
  )
  on conflict (tenant_id, company_id, code) do update
    set sector_id = excluded.sector_id,
        name = excluded.name,
        status = 'active',
        updated_at = now()
  returning id into job_id;

  insert into public.exposure_groups (
    tenant_id, company_id, code, name, status
  )
  values (
    target_tenant_id,
    company_id_value,
    upper(trim(exposure_group_code)),
    trim(exposure_group_name),
    'active'
  )
  on conflict (tenant_id, company_id, code) do update
    set name = excluded.name,
        status = 'active',
        updated_at = now()
  returning id into exposure_group_id;

  insert into public.occupational_risks (
    tenant_id, code, name, risk_type, status
  )
  values (
    target_tenant_id,
    upper(trim(risk_code)),
    trim(risk_name),
    risk_type_value,
    'active'
  )
  on conflict (tenant_id, code) do update
    set name = excluded.name,
        risk_type = excluded.risk_type,
        status = 'active',
        updated_at = now()
  returning id into risk_id;

  if not exists (
    select 1
    from public.risk_assignments assignment
    where assignment.tenant_id = target_tenant_id
      and assignment.company_id = company_id_value
      and assignment.exposure_group_id = exposure_group_id
      and assignment.job_position_id = job_id
      and assignment.occupational_risk_id = risk_id
      and assignment.starts_on = starts_on_value
      and assignment.ends_on is null
  ) then
    insert into public.risk_assignments (
      tenant_id,
      company_id,
      exposure_group_id,
      job_position_id,
      occupational_risk_id,
      source,
      starts_on,
      version
    )
    values (
      target_tenant_id,
      company_id_value,
      exposure_group_id,
      job_id,
      risk_id,
      'manual',
      starts_on_value,
      1
    );
  end if;

  insert into public.employment_contracts (
    tenant_id,
    company_id,
    worker_id,
    sector_id,
    job_position_id,
    exposure_group_id,
    starts_on,
    status,
    version
  )
  values (
    target_tenant_id,
    company_id_value,
    worker_id_value,
    sector_id,
    job_id,
    exposure_group_id,
    starts_on_value,
    'active',
    1
  )
  returning id into employment_id;

  insert into public.employment_contract_history (
    tenant_id,
    employment_contract_id,
    event_type,
    payload
  )
  values (
    target_tenant_id,
    employment_id,
    'created',
    jsonb_build_object(
      'exposureGroupId', exposure_group_id,
      'jobPositionId', job_id,
      'sectorId', sector_id
    )
  );

  perform public.append_audit_log(
    target_tenant_id,
    'occupational_structure.created',
    'employment_contract',
    employment_id,
    audit_request_id,
    jsonb_build_object(
      'companyId', company_id_value,
      'workerId', worker_id_value
    )
  );

  return employment_id;
end;
$$;

revoke all on function public.create_occupational_structure(
  uuid, uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, date, text
) from public;
grant execute on function public.create_occupational_structure(
  uuid, uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, date, text
) to authenticated;
