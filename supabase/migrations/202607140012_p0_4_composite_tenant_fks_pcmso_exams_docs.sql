-- P0.4 onda 4: PCMSO/protocolos/riscos + exames 7a–d + documentos + painel de chamadas.
-- Idempotente via pg_constraint. Mantém FKs simples; a composta impede tenant cruzado.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'occupational_risks_tenant_id_uq') then
    alter table public.occupational_risks
      add constraint occupational_risks_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pcmso_programs_tenant_id_uq') then
    alter table public.pcmso_programs
      add constraint pcmso_programs_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pcmso_versions_tenant_id_uq') then
    alter table public.pcmso_versions
      add constraint pcmso_versions_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'exam_protocols_tenant_id_uq') then
    alter table public.exam_protocols
      add constraint exam_protocols_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'visual_acuity_results_tenant_id_uq') then
    alter table public.visual_acuity_results
      add constraint visual_acuity_results_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'audiometry_calibrations_tenant_id_uq') then
    alter table public.audiometry_calibrations
      add constraint audiometry_calibrations_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'audiometry_results_tenant_id_uq') then
    alter table public.audiometry_results
      add constraint audiometry_results_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spirometry_predicted_value_sets_tenant_id_uq') then
    alter table public.spirometry_predicted_value_sets
      add constraint spirometry_predicted_value_sets_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spirometry_calibrations_tenant_id_uq') then
    alter table public.spirometry_calibrations
      add constraint spirometry_calibrations_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spirometry_results_tenant_id_uq') then
    alter table public.spirometry_results
      add constraint spirometry_results_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spirometry_maneuvers_tenant_id_uq') then
    alter table public.spirometry_maneuvers
      add constraint spirometry_maneuvers_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'diagnostic_exam_results_tenant_id_uq') then
    alter table public.diagnostic_exam_results
      add constraint diagnostic_exam_results_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'document_templates_tenant_id_uq') then
    alter table public.document_templates
      add constraint document_templates_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'generated_documents_tenant_id_uq') then
    alter table public.generated_documents
      add constraint generated_documents_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'document_versions_tenant_id_uq') then
    alter table public.document_versions
      add constraint document_versions_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'queue_tickets_tenant_id_uq') then
    alter table public.queue_tickets
      add constraint queue_tickets_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'display_panels_tenant_id_uq') then
    alter table public.display_panels
      add constraint display_panels_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'display_panel_sessions_tenant_id_uq') then
    alter table public.display_panel_sessions
      add constraint display_panel_sessions_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'call_events_tenant_id_uq') then
    alter table public.call_events
      add constraint call_events_tenant_id_uq unique (tenant_id, id);
  end if;
end $$;

do $$
begin
  -- Occupational leftovers / PCMSO / protocols
  if not exists (select 1 from pg_constraint where conname = 'job_positions_company_tenant_fk') then
    alter table public.job_positions
      add constraint job_positions_company_tenant_fk
      foreign key (tenant_id, company_id) references public.companies (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'job_positions_sector_tenant_fk') then
    alter table public.job_positions
      add constraint job_positions_sector_tenant_fk
      foreign key (tenant_id, sector_id) references public.sectors (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'exposure_groups_company_tenant_fk') then
    alter table public.exposure_groups
      add constraint exposure_groups_company_tenant_fk
      foreign key (tenant_id, company_id) references public.companies (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'risk_assignments_company_tenant_fk') then
    alter table public.risk_assignments
      add constraint risk_assignments_company_tenant_fk
      foreign key (tenant_id, company_id) references public.companies (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'risk_assignments_exposure_group_tenant_fk') then
    alter table public.risk_assignments
      add constraint risk_assignments_exposure_group_tenant_fk
      foreign key (tenant_id, exposure_group_id) references public.exposure_groups (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'risk_assignments_job_position_tenant_fk') then
    alter table public.risk_assignments
      add constraint risk_assignments_job_position_tenant_fk
      foreign key (tenant_id, job_position_id) references public.job_positions (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'risk_assignments_risk_tenant_fk') then
    alter table public.risk_assignments
      add constraint risk_assignments_risk_tenant_fk
      foreign key (tenant_id, occupational_risk_id) references public.occupational_risks (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'worker_identifiers_worker_tenant_fk') then
    alter table public.worker_identifiers
      add constraint worker_identifiers_worker_tenant_fk
      foreign key (tenant_id, worker_id) references public.workers (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'employment_contract_history_contract_tenant_fk') then
    alter table public.employment_contract_history
      add constraint employment_contract_history_contract_tenant_fk
      foreign key (tenant_id, employment_contract_id) references public.employment_contracts (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pcmso_programs_company_tenant_fk') then
    alter table public.pcmso_programs
      add constraint pcmso_programs_company_tenant_fk
      foreign key (tenant_id, company_id) references public.companies (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pcmso_versions_company_tenant_fk') then
    alter table public.pcmso_versions
      add constraint pcmso_versions_company_tenant_fk
      foreign key (tenant_id, company_id) references public.companies (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pcmso_versions_program_tenant_fk') then
    alter table public.pcmso_versions
      add constraint pcmso_versions_program_tenant_fk
      foreign key (tenant_id, pcmso_program_id) references public.pcmso_programs (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'exam_protocols_pcmso_version_tenant_fk') then
    alter table public.exam_protocols
      add constraint exam_protocols_pcmso_version_tenant_fk
      foreign key (tenant_id, pcmso_version_id) references public.pcmso_versions (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'exam_protocol_rules_protocol_tenant_fk') then
    alter table public.exam_protocol_rules
      add constraint exam_protocol_rules_protocol_tenant_fk
      foreign key (tenant_id, exam_protocol_id) references public.exam_protocols (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'exam_protocol_items_protocol_tenant_fk') then
    alter table public.exam_protocol_items
      add constraint exam_protocol_items_protocol_tenant_fk
      foreign key (tenant_id, exam_protocol_id) references public.exam_protocols (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'exam_protocol_items_catalog_tenant_fk') then
    alter table public.exam_protocol_items
      add constraint exam_protocol_items_catalog_tenant_fk
      foreign key (tenant_id, exam_catalog_id) references public.exam_catalog (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'exam_protocol_overrides_contract_tenant_fk') then
    alter table public.exam_protocol_overrides
      add constraint exam_protocol_overrides_contract_tenant_fk
      foreign key (tenant_id, employment_contract_id) references public.employment_contracts (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'exam_protocol_overrides_worker_tenant_fk') then
    alter table public.exam_protocol_overrides
      add constraint exam_protocol_overrides_worker_tenant_fk
      foreign key (tenant_id, worker_id) references public.workers (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'exam_protocol_overrides_protocol_tenant_fk') then
    alter table public.exam_protocol_overrides
      add constraint exam_protocol_overrides_protocol_tenant_fk
      foreign key (tenant_id, exam_protocol_id) references public.exam_protocols (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'exam_protocol_overrides_catalog_tenant_fk') then
    alter table public.exam_protocol_overrides
      add constraint exam_protocol_overrides_catalog_tenant_fk
      foreign key (tenant_id, exam_catalog_id) references public.exam_catalog (tenant_id, id) on delete restrict;
  end if;

  -- Exam results 7a–d
  if not exists (select 1 from pg_constraint where conname = 'visual_acuity_results_encounter_tenant_fk') then
    alter table public.visual_acuity_results
      add constraint visual_acuity_results_encounter_tenant_fk
      foreign key (tenant_id, encounter_id) references public.encounters (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'visual_acuity_results_exam_order_tenant_fk') then
    alter table public.visual_acuity_results
      add constraint visual_acuity_results_exam_order_tenant_fk
      foreign key (tenant_id, exam_order_id) references public.exam_orders (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'visual_acuity_result_versions_result_tenant_fk') then
    alter table public.visual_acuity_result_versions
      add constraint visual_acuity_result_versions_result_tenant_fk
      foreign key (tenant_id, visual_acuity_result_id) references public.visual_acuity_results (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'audiometry_results_encounter_tenant_fk') then
    alter table public.audiometry_results
      add constraint audiometry_results_encounter_tenant_fk
      foreign key (tenant_id, encounter_id) references public.encounters (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'audiometry_results_exam_order_tenant_fk') then
    alter table public.audiometry_results
      add constraint audiometry_results_exam_order_tenant_fk
      foreign key (tenant_id, exam_order_id) references public.exam_orders (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'audiometry_results_calibration_tenant_fk') then
    alter table public.audiometry_results
      add constraint audiometry_results_calibration_tenant_fk
      foreign key (tenant_id, calibration_id) references public.audiometry_calibrations (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'audiometry_result_versions_result_tenant_fk') then
    alter table public.audiometry_result_versions
      add constraint audiometry_result_versions_result_tenant_fk
      foreign key (tenant_id, audiometry_result_id) references public.audiometry_results (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spirometry_results_encounter_tenant_fk') then
    alter table public.spirometry_results
      add constraint spirometry_results_encounter_tenant_fk
      foreign key (tenant_id, encounter_id) references public.encounters (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spirometry_results_exam_order_tenant_fk') then
    alter table public.spirometry_results
      add constraint spirometry_results_exam_order_tenant_fk
      foreign key (tenant_id, exam_order_id) references public.exam_orders (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spirometry_results_predicted_set_tenant_fk') then
    alter table public.spirometry_results
      add constraint spirometry_results_predicted_set_tenant_fk
      foreign key (tenant_id, predicted_value_set_id) references public.spirometry_predicted_value_sets (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spirometry_results_calibration_tenant_fk') then
    alter table public.spirometry_results
      add constraint spirometry_results_calibration_tenant_fk
      foreign key (tenant_id, calibration_id) references public.spirometry_calibrations (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spirometry_maneuvers_result_tenant_fk') then
    alter table public.spirometry_maneuvers
      add constraint spirometry_maneuvers_result_tenant_fk
      foreign key (tenant_id, spirometry_result_id) references public.spirometry_results (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spirometry_results_accepted_maneuver_tenant_fk') then
    alter table public.spirometry_results
      add constraint spirometry_results_accepted_maneuver_tenant_fk
      foreign key (tenant_id, accepted_maneuver_id) references public.spirometry_maneuvers (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spirometry_result_versions_result_tenant_fk') then
    alter table public.spirometry_result_versions
      add constraint spirometry_result_versions_result_tenant_fk
      foreign key (tenant_id, spirometry_result_id) references public.spirometry_results (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'diagnostic_exam_results_encounter_tenant_fk') then
    alter table public.diagnostic_exam_results
      add constraint diagnostic_exam_results_encounter_tenant_fk
      foreign key (tenant_id, encounter_id) references public.encounters (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'diagnostic_exam_results_exam_order_tenant_fk') then
    alter table public.diagnostic_exam_results
      add constraint diagnostic_exam_results_exam_order_tenant_fk
      foreign key (tenant_id, exam_order_id) references public.exam_orders (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'diagnostic_exam_result_versions_result_tenant_fk') then
    alter table public.diagnostic_exam_result_versions
      add constraint diagnostic_exam_result_versions_result_tenant_fk
      foreign key (tenant_id, diagnostic_exam_result_id) references public.diagnostic_exam_results (tenant_id, id) on delete restrict;
  end if;

  -- Documents
  if not exists (select 1 from pg_constraint where conname = 'document_template_versions_template_tenant_fk') then
    alter table public.document_template_versions
      add constraint document_template_versions_template_tenant_fk
      foreign key (tenant_id, template_id) references public.document_templates (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'document_versions_generated_document_tenant_fk') then
    alter table public.document_versions
      add constraint document_versions_generated_document_tenant_fk
      foreign key (tenant_id, generated_document_id) references public.generated_documents (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'generated_documents_vigente_version_tenant_fk') then
    alter table public.generated_documents
      add constraint generated_documents_vigente_version_tenant_fk
      foreign key (tenant_id, vigente_version_id) references public.document_versions (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'document_signatures_version_tenant_fk') then
    alter table public.document_signatures
      add constraint document_signatures_version_tenant_fk
      foreign key (tenant_id, document_version_id) references public.document_versions (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'document_deliveries_version_tenant_fk') then
    alter table public.document_deliveries
      add constraint document_deliveries_version_tenant_fk
      foreign key (tenant_id, document_version_id) references public.document_versions (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'document_access_logs_version_tenant_fk') then
    alter table public.document_access_logs
      add constraint document_access_logs_version_tenant_fk
      foreign key (tenant_id, document_version_id) references public.document_versions (tenant_id, id) on delete restrict;
  end if;

  -- Call panel
  if not exists (select 1 from pg_constraint where conname = 'display_panels_clinic_unit_tenant_fk') then
    alter table public.display_panels
      add constraint display_panels_clinic_unit_tenant_fk
      foreign key (tenant_id, clinic_unit_id) references public.clinic_units (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'display_panel_sessions_panel_tenant_fk') then
    alter table public.display_panel_sessions
      add constraint display_panel_sessions_panel_tenant_fk
      foreign key (tenant_id, display_panel_id) references public.display_panels (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'call_events_clinic_unit_tenant_fk') then
    alter table public.call_events
      add constraint call_events_clinic_unit_tenant_fk
      foreign key (tenant_id, clinic_unit_id) references public.clinic_units (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'call_events_queue_ticket_tenant_fk') then
    alter table public.call_events
      add constraint call_events_queue_ticket_tenant_fk
      foreign key (tenant_id, queue_ticket_id) references public.queue_tickets (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'call_events_encounter_tenant_fk') then
    alter table public.call_events
      add constraint call_events_encounter_tenant_fk
      foreign key (tenant_id, encounter_id) references public.encounters (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'call_events_display_panel_tenant_fk') then
    alter table public.call_events
      add constraint call_events_display_panel_tenant_fk
      foreign key (tenant_id, display_panel_id) references public.display_panels (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'call_deliveries_call_event_tenant_fk') then
    alter table public.call_deliveries
      add constraint call_deliveries_call_event_tenant_fk
      foreign key (tenant_id, call_event_id) references public.call_events (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'call_deliveries_session_tenant_fk') then
    alter table public.call_deliveries
      add constraint call_deliveries_session_tenant_fk
      foreign key (tenant_id, display_panel_session_id) references public.display_panel_sessions (tenant_id, id) on delete restrict;
  end if;
end $$;
