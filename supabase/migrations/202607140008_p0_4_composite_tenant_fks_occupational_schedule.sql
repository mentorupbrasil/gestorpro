-- P0.4 onda 2: empresa/contrato + encaminhamento/agenda.
-- Idempotente via pg_constraint.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'companies_tenant_id_uq') then
    alter table public.companies
      add constraint companies_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'company_establishments_tenant_id_uq') then
    alter table public.company_establishments
      add constraint company_establishments_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'sectors_tenant_id_uq') then
    alter table public.sectors
      add constraint sectors_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'job_positions_tenant_id_uq') then
    alter table public.job_positions
      add constraint job_positions_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'exposure_groups_tenant_id_uq') then
    alter table public.exposure_groups
      add constraint exposure_groups_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'employment_contracts_tenant_id_uq') then
    alter table public.employment_contracts
      add constraint employment_contracts_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'referrals_tenant_id_uq') then
    alter table public.referrals
      add constraint referrals_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'schedule_resources_tenant_id_uq') then
    alter table public.schedule_resources
      add constraint schedule_resources_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'exam_catalog_tenant_id_uq') then
    alter table public.exam_catalog
      add constraint exam_catalog_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'appointments_tenant_id_uq') then
    alter table public.appointments
      add constraint appointments_tenant_id_uq unique (tenant_id, id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'company_establishments_company_tenant_fk') then
    alter table public.company_establishments
      add constraint company_establishments_company_tenant_fk
      foreign key (tenant_id, company_id)
      references public.companies (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'company_contacts_company_tenant_fk') then
    alter table public.company_contacts
      add constraint company_contacts_company_tenant_fk
      foreign key (tenant_id, company_id)
      references public.companies (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'sectors_company_tenant_fk') then
    alter table public.sectors
      add constraint sectors_company_tenant_fk
      foreign key (tenant_id, company_id)
      references public.companies (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'sectors_establishment_tenant_fk') then
    alter table public.sectors
      add constraint sectors_establishment_tenant_fk
      foreign key (tenant_id, establishment_id)
      references public.company_establishments (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'employment_contracts_company_tenant_fk') then
    alter table public.employment_contracts
      add constraint employment_contracts_company_tenant_fk
      foreign key (tenant_id, company_id)
      references public.companies (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'employment_contracts_worker_tenant_fk') then
    alter table public.employment_contracts
      add constraint employment_contracts_worker_tenant_fk
      foreign key (tenant_id, worker_id)
      references public.workers (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'employment_contracts_sector_tenant_fk') then
    alter table public.employment_contracts
      add constraint employment_contracts_sector_tenant_fk
      foreign key (tenant_id, sector_id)
      references public.sectors (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'employment_contracts_job_position_tenant_fk') then
    alter table public.employment_contracts
      add constraint employment_contracts_job_position_tenant_fk
      foreign key (tenant_id, job_position_id)
      references public.job_positions (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'employment_contracts_exposure_group_tenant_fk') then
    alter table public.employment_contracts
      add constraint employment_contracts_exposure_group_tenant_fk
      foreign key (tenant_id, exposure_group_id)
      references public.exposure_groups (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'referrals_company_tenant_fk') then
    alter table public.referrals
      add constraint referrals_company_tenant_fk
      foreign key (tenant_id, company_id)
      references public.companies (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'referrals_worker_tenant_fk') then
    alter table public.referrals
      add constraint referrals_worker_tenant_fk
      foreign key (tenant_id, worker_id)
      references public.workers (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'referrals_contract_tenant_fk') then
    alter table public.referrals
      add constraint referrals_contract_tenant_fk
      foreign key (tenant_id, employment_contract_id)
      references public.employment_contracts (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'referral_items_referral_tenant_fk') then
    alter table public.referral_items
      add constraint referral_items_referral_tenant_fk
      foreign key (tenant_id, referral_id)
      references public.referrals (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'referral_items_exam_catalog_tenant_fk') then
    alter table public.referral_items
      add constraint referral_items_exam_catalog_tenant_fk
      foreign key (tenant_id, exam_catalog_id)
      references public.exam_catalog (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'schedule_resources_clinic_unit_tenant_fk') then
    alter table public.schedule_resources
      add constraint schedule_resources_clinic_unit_tenant_fk
      foreign key (tenant_id, clinic_unit_id)
      references public.clinic_units (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'appointments_clinic_unit_tenant_fk') then
    alter table public.appointments
      add constraint appointments_clinic_unit_tenant_fk
      foreign key (tenant_id, clinic_unit_id)
      references public.clinic_units (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'appointments_referral_tenant_fk') then
    alter table public.appointments
      add constraint appointments_referral_tenant_fk
      foreign key (tenant_id, referral_id)
      references public.referrals (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'appointments_resource_tenant_fk') then
    alter table public.appointments
      add constraint appointments_resource_tenant_fk
      foreign key (tenant_id, resource_id)
      references public.schedule_resources (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'encounters_appointment_tenant_fk') then
    alter table public.encounters
      add constraint encounters_appointment_tenant_fk
      foreign key (tenant_id, appointment_id)
      references public.appointments (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'encounters_referral_tenant_fk') then
    alter table public.encounters
      add constraint encounters_referral_tenant_fk
      foreign key (tenant_id, referral_id)
      references public.referrals (tenant_id, id)
      on delete restrict;
  end if;
end $$;
