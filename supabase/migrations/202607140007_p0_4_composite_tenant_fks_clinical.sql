-- P0.4 lote clínico: UNIQUE (tenant_id, id) nos pais + FKs compostas nos filhos.
-- Mantém FKs simples existentes; a composta impede cruzamento de tenant.
-- Idempotente via checagem de pg_constraint.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'clinic_units_tenant_id_uq') then
    alter table public.clinic_units
      add constraint clinic_units_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'workers_tenant_id_uq') then
    alter table public.workers
      add constraint workers_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'encounters_tenant_id_uq') then
    alter table public.encounters
      add constraint encounters_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'triage_form_versions_tenant_id_uq') then
    alter table public.triage_form_versions
      add constraint triage_form_versions_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'triage_records_tenant_id_uq') then
    alter table public.triage_records
      add constraint triage_records_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'clinical_professional_credentials_tenant_id_uq'
  ) then
    alter table public.clinical_professional_credentials
      add constraint clinical_professional_credentials_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'medical_consultations_tenant_id_uq') then
    alter table public.medical_consultations
      add constraint medical_consultations_tenant_id_uq unique (tenant_id, id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'document_template_versions_tenant_id_uq'
  ) then
    alter table public.document_template_versions
      add constraint document_template_versions_tenant_id_uq unique (tenant_id, id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'encounters_worker_tenant_fk') then
    alter table public.encounters
      add constraint encounters_worker_tenant_fk
      foreign key (tenant_id, worker_id)
      references public.workers (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'encounters_clinic_unit_tenant_fk') then
    alter table public.encounters
      add constraint encounters_clinic_unit_tenant_fk
      foreign key (tenant_id, clinic_unit_id)
      references public.clinic_units (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'triage_records_encounter_tenant_fk') then
    alter table public.triage_records
      add constraint triage_records_encounter_tenant_fk
      foreign key (tenant_id, encounter_id)
      references public.encounters (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'triage_records_form_version_tenant_fk') then
    alter table public.triage_records
      add constraint triage_records_form_version_tenant_fk
      foreign key (tenant_id, form_version_id)
      references public.triage_form_versions (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'triage_record_versions_record_tenant_fk'
  ) then
    alter table public.triage_record_versions
      add constraint triage_record_versions_record_tenant_fk
      foreign key (tenant_id, triage_record_id)
      references public.triage_records (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'medical_consultations_encounter_tenant_fk'
  ) then
    alter table public.medical_consultations
      add constraint medical_consultations_encounter_tenant_fk
      foreign key (tenant_id, encounter_id)
      references public.encounters (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'medical_consultations_physician_tenant_fk'
  ) then
    alter table public.medical_consultations
      add constraint medical_consultations_physician_tenant_fk
      foreign key (tenant_id, physician_credential_id)
      references public.clinical_professional_credentials (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'medical_consultation_versions_consultation_tenant_fk'
  ) then
    alter table public.medical_consultation_versions
      add constraint medical_consultation_versions_consultation_tenant_fk
      foreign key (tenant_id, consultation_id)
      references public.medical_consultations (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'medical_conclusions_encounter_tenant_fk'
  ) then
    alter table public.medical_conclusions
      add constraint medical_conclusions_encounter_tenant_fk
      foreign key (tenant_id, encounter_id)
      references public.encounters (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'medical_conclusions_consultation_tenant_fk'
  ) then
    alter table public.medical_conclusions
      add constraint medical_conclusions_consultation_tenant_fk
      foreign key (tenant_id, consultation_id)
      references public.medical_consultations (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'medical_conclusions_physician_tenant_fk'
  ) then
    alter table public.medical_conclusions
      add constraint medical_conclusions_physician_tenant_fk
      foreign key (tenant_id, physician_credential_id)
      references public.clinical_professional_credentials (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'generated_documents_encounter_tenant_fk'
  ) then
    alter table public.generated_documents
      add constraint generated_documents_encounter_tenant_fk
      foreign key (tenant_id, encounter_id)
      references public.encounters (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'generated_documents_worker_tenant_fk'
  ) then
    alter table public.generated_documents
      add constraint generated_documents_worker_tenant_fk
      foreign key (tenant_id, worker_id)
      references public.workers (tenant_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'generated_documents_template_version_tenant_fk'
  ) then
    alter table public.generated_documents
      add constraint generated_documents_template_version_tenant_fk
      foreign key (tenant_id, template_version_id)
      references public.document_template_versions (tenant_id, id)
      on delete restrict;
  end if;
end $$;
