-- P0 auth: SELECT RLS unit-aware para exames/filas/painel.
-- Mutações continuam via RPC security definer (DML direto já revogado).
-- Idempotente: drop + create das policies de leitura.

create or replace function public.has_tenant_or_any_unit_permission(
  target_tenant_id uuid,
  permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.has_tenant_permission(target_tenant_id, permission_code)
    or exists (
      select 1
      from public.clinic_units unit_scope
      where unit_scope.tenant_id = target_tenant_id
        and public.has_unit_permission(unit_scope.id, permission_code)
    );
$$;

revoke all on function public.has_tenant_or_any_unit_permission(uuid, text) from public;
grant execute on function public.has_tenant_or_any_unit_permission(uuid, text) to authenticated;

-- exam_orders
drop policy if exists exam_orders_select on public.exam_orders;
create policy exam_orders_select on public.exam_orders
  for select to authenticated
  using (
    public.has_encounter_permission(encounter_id, 'exams.read')
    or public.has_encounter_permission(encounter_id, 'encounters.read')
  );

-- visual acuity
drop policy if exists visual_acuity_results_read on public.visual_acuity_results;
create policy visual_acuity_results_read on public.visual_acuity_results
  for select to authenticated
  using (
    exists (
      select 1
      from public.exam_orders exam_order
      where exam_order.id = visual_acuity_results.exam_order_id
        and public.has_encounter_permission(exam_order.encounter_id, 'exams.read')
    )
  );

drop policy if exists visual_acuity_versions_read on public.visual_acuity_result_versions;
create policy visual_acuity_versions_read on public.visual_acuity_result_versions
  for select to authenticated
  using (
    exists (
      select 1
      from public.visual_acuity_results result
      join public.exam_orders exam_order on exam_order.id = result.exam_order_id
      where result.id = visual_acuity_result_versions.visual_acuity_result_id
        and public.has_encounter_permission(exam_order.encounter_id, 'exams.read')
    )
  );

-- audiometry
drop policy if exists audiometry_calibrations_read on public.audiometry_calibrations;
create policy audiometry_calibrations_read on public.audiometry_calibrations
  for select to authenticated
  using (public.has_tenant_or_any_unit_permission(tenant_id, 'exams.read'));

drop policy if exists audiometry_results_read on public.audiometry_results;
create policy audiometry_results_read on public.audiometry_results
  for select to authenticated
  using (
    exists (
      select 1
      from public.exam_orders exam_order
      where exam_order.id = audiometry_results.exam_order_id
        and public.has_encounter_permission(exam_order.encounter_id, 'exams.read')
    )
  );

drop policy if exists audiometry_versions_read on public.audiometry_result_versions;
create policy audiometry_versions_read on public.audiometry_result_versions
  for select to authenticated
  using (
    exists (
      select 1
      from public.audiometry_results result
      join public.exam_orders exam_order on exam_order.id = result.exam_order_id
      where result.id = audiometry_result_versions.audiometry_result_id
        and public.has_encounter_permission(exam_order.encounter_id, 'exams.read')
    )
  );

-- spirometry
drop policy if exists spirometry_predicted_sets_read on public.spirometry_predicted_value_sets;
create policy spirometry_predicted_sets_read on public.spirometry_predicted_value_sets
  for select to authenticated
  using (public.has_tenant_or_any_unit_permission(tenant_id, 'exams.read'));

drop policy if exists spirometry_calibrations_read on public.spirometry_calibrations;
create policy spirometry_calibrations_read on public.spirometry_calibrations
  for select to authenticated
  using (public.has_tenant_or_any_unit_permission(tenant_id, 'exams.read'));

drop policy if exists spirometry_results_read on public.spirometry_results;
create policy spirometry_results_read on public.spirometry_results
  for select to authenticated
  using (
    exists (
      select 1
      from public.exam_orders exam_order
      where exam_order.id = spirometry_results.exam_order_id
        and public.has_encounter_permission(exam_order.encounter_id, 'exams.read')
    )
  );

drop policy if exists spirometry_maneuvers_read on public.spirometry_maneuvers;
create policy spirometry_maneuvers_read on public.spirometry_maneuvers
  for select to authenticated
  using (
    exists (
      select 1
      from public.spirometry_results result
      join public.exam_orders exam_order on exam_order.id = result.exam_order_id
      where result.id = spirometry_maneuvers.spirometry_result_id
        and public.has_encounter_permission(exam_order.encounter_id, 'exams.read')
    )
  );

drop policy if exists spirometry_versions_read on public.spirometry_result_versions;
create policy spirometry_versions_read on public.spirometry_result_versions
  for select to authenticated
  using (
    exists (
      select 1
      from public.spirometry_results result
      join public.exam_orders exam_order on exam_order.id = result.exam_order_id
      where result.id = spirometry_result_versions.spirometry_result_id
        and public.has_encounter_permission(exam_order.encounter_id, 'exams.read')
    )
  );

-- diagnostic
drop policy if exists diagnostic_exam_results_read on public.diagnostic_exam_results;
create policy diagnostic_exam_results_read on public.diagnostic_exam_results
  for select to authenticated
  using (
    exists (
      select 1
      from public.exam_orders exam_order
      where exam_order.id = diagnostic_exam_results.exam_order_id
        and public.has_encounter_permission(exam_order.encounter_id, 'exams.read')
    )
  );

drop policy if exists diagnostic_exam_versions_read on public.diagnostic_exam_result_versions;
create policy diagnostic_exam_versions_read on public.diagnostic_exam_result_versions
  for select to authenticated
  using (
    exists (
      select 1
      from public.diagnostic_exam_results result
      join public.exam_orders exam_order on exam_order.id = result.exam_order_id
      where result.id = diagnostic_exam_result_versions.diagnostic_exam_result_id
        and public.has_encounter_permission(exam_order.encounter_id, 'exams.read')
    )
  );

-- laboratory
drop policy if exists laboratory_orders_read on public.laboratory_orders;
create policy laboratory_orders_read on public.laboratory_orders
  for select to authenticated
  using (public.has_encounter_permission(encounter_id, 'exams.read'));

drop policy if exists laboratory_items_read on public.laboratory_order_items;
create policy laboratory_items_read on public.laboratory_order_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.laboratory_orders laboratory_order
      where laboratory_order.id = laboratory_order_items.laboratory_order_id
        and public.has_encounter_permission(laboratory_order.encounter_id, 'exams.read')
    )
  );

drop policy if exists laboratory_samples_read on public.laboratory_samples;
create policy laboratory_samples_read on public.laboratory_samples
  for select to authenticated
  using (
    exists (
      select 1
      from public.laboratory_orders laboratory_order
      where laboratory_order.id = laboratory_samples.laboratory_order_id
        and public.has_encounter_permission(laboratory_order.encounter_id, 'exams.read')
    )
  );

drop policy if exists laboratory_sample_events_read on public.laboratory_sample_events;
create policy laboratory_sample_events_read on public.laboratory_sample_events
  for select to authenticated
  using (
    exists (
      select 1
      from public.laboratory_samples sample
      join public.laboratory_orders laboratory_order on laboratory_order.id = sample.laboratory_order_id
      where sample.id = laboratory_sample_events.sample_id
        and public.has_encounter_permission(laboratory_order.encounter_id, 'exams.read')
    )
  );

drop policy if exists laboratory_results_read on public.laboratory_results;
create policy laboratory_results_read on public.laboratory_results
  for select to authenticated
  using (
    exists (
      select 1
      from public.laboratory_order_items item
      join public.laboratory_orders laboratory_order on laboratory_order.id = item.laboratory_order_id
      where item.id = laboratory_results.laboratory_order_item_id
        and public.has_encounter_permission(laboratory_order.encounter_id, 'exams.read')
    )
  );

drop policy if exists laboratory_confirmations_read on public.laboratory_critical_confirmations;
create policy laboratory_confirmations_read on public.laboratory_critical_confirmations
  for select to authenticated
  using (
    exists (
      select 1
      from public.laboratory_results result
      join public.laboratory_order_items item on item.id = result.laboratory_order_item_id
      join public.laboratory_orders laboratory_order on laboratory_order.id = item.laboratory_order_id
      where result.id = laboratory_critical_confirmations.laboratory_result_id
        and public.has_encounter_permission(laboratory_order.encounter_id, 'exams.read')
    )
  );

drop policy if exists external_labs_read on public.external_laboratories;
create policy external_labs_read on public.external_laboratories
  for select to authenticated
  using (public.has_tenant_or_any_unit_permission(tenant_id, 'exams.read'));

-- queues / display
drop policy if exists queue_definitions_select on public.queue_definitions;
create policy queue_definitions_select on public.queue_definitions
  for select to authenticated
  using (public.has_unit_permission(clinic_unit_id, 'queues.read'));

drop policy if exists queue_tickets_select on public.queue_tickets;
create policy queue_tickets_select on public.queue_tickets
  for select to authenticated
  using (
    public.has_encounter_permission(encounter_id, 'queues.read')
    or public.has_encounter_permission(encounter_id, 'display.read')
  );

drop policy if exists display_panels_select on public.display_panels;
drop policy if exists display_panels_read on public.display_panels;
create policy display_panels_select on public.display_panels
  for select to authenticated
  using (public.has_unit_permission(clinic_unit_id, 'display.read'));

drop policy if exists display_panel_sessions_select on public.display_panel_sessions;
drop policy if exists display_panel_sessions_read on public.display_panel_sessions;
create policy display_panel_sessions_select on public.display_panel_sessions
  for select to authenticated
  using (
    exists (
      select 1
      from public.display_panels panel
      where panel.id = display_panel_sessions.display_panel_id
        and public.has_unit_permission(panel.clinic_unit_id, 'display.read')
    )
  );

drop policy if exists call_events_select on public.call_events;
drop policy if exists call_events_read on public.call_events;
create policy call_events_select on public.call_events
  for select to authenticated
  using (public.has_unit_permission(clinic_unit_id, 'display.read'));

-- encounters / clinical (stations already unit-aware na app)
drop policy if exists encounters_select on public.encounters;
create policy encounters_select on public.encounters
  for select to authenticated
  using (
    public.has_unit_permission(clinic_unit_id, 'encounters.read')
    or public.has_unit_permission(clinic_unit_id, 'clinical.read')
    or public.has_unit_permission(clinic_unit_id, 'exams.read')
  );

drop policy if exists encounter_steps_select on public.encounter_steps;
create policy encounter_steps_select on public.encounter_steps
  for select to authenticated
  using (public.has_encounter_permission(encounter_id, 'encounters.read')
    or public.has_encounter_permission(encounter_id, 'clinical.read'));

drop policy if exists encounter_events_select on public.encounter_events;
create policy encounter_events_select on public.encounter_events
  for select to authenticated
  using (public.has_encounter_permission(encounter_id, 'encounters.read')
    or public.has_encounter_permission(encounter_id, 'clinical.read'));

drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments
  for select to authenticated
  using (public.has_unit_permission(clinic_unit_id, 'encounters.read')
    or public.has_unit_permission(clinic_unit_id, 'schedule.read'));

drop policy if exists triage_records_read on public.triage_records;
create policy triage_records_read on public.triage_records
  for select to authenticated
  using (public.has_encounter_permission(encounter_id, 'clinical.read')
    or public.has_encounter_permission(encounter_id, 'triage.manage'));

drop policy if exists triage_record_versions_read on public.triage_record_versions;
create policy triage_record_versions_read on public.triage_record_versions
  for select to authenticated
  using (
    exists (
      select 1
      from public.triage_records record
      where record.id = triage_record_versions.triage_record_id
        and (
          public.has_encounter_permission(record.encounter_id, 'clinical.read')
          or public.has_encounter_permission(record.encounter_id, 'triage.manage')
        )
    )
  );

drop policy if exists triage_versions_read on public.triage_form_versions;
create policy triage_versions_read on public.triage_form_versions
  for select to authenticated
  using (public.has_tenant_or_any_unit_permission(tenant_id, 'clinical.read'));

drop policy if exists medical_consultations_read on public.medical_consultations;
create policy medical_consultations_read on public.medical_consultations
  for select to authenticated
  using (public.has_encounter_permission(encounter_id, 'clinical.read')
    or public.has_encounter_permission(encounter_id, 'consultations.manage'));

drop policy if exists medical_consultation_versions_read on public.medical_consultation_versions;
create policy medical_consultation_versions_read on public.medical_consultation_versions
  for select to authenticated
  using (
    exists (
      select 1
      from public.medical_consultations consultation
      where consultation.id = medical_consultation_versions.consultation_id
        and (
          public.has_encounter_permission(consultation.encounter_id, 'clinical.read')
          or public.has_encounter_permission(consultation.encounter_id, 'consultations.manage')
        )
    )
  );

drop policy if exists medical_conclusions_read on public.medical_conclusions;
create policy medical_conclusions_read on public.medical_conclusions
  for select to authenticated
  using (public.has_encounter_permission(encounter_id, 'clinical.read')
    or public.has_encounter_permission(encounter_id, 'conclusions.manage'));

drop policy if exists clinical_professional_credentials_read on public.clinical_professional_credentials;
drop policy if exists clinical_credentials_read on public.clinical_professional_credentials;
create policy clinical_credentials_read on public.clinical_professional_credentials
  for select to authenticated
  using (public.has_tenant_or_any_unit_permission(tenant_id, 'clinical.read'));

drop policy if exists triage_templates_read on public.triage_form_templates;
create policy triage_templates_read on public.triage_form_templates
  for select to authenticated
  using (public.has_tenant_or_any_unit_permission(tenant_id, 'clinical.read'));
