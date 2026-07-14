-- P0: revoga EXECUTE indiscriminado de SECURITY DEFINER e aplica allowlist
-- explícita para o papel authenticated. Funções internas/triggers ficam
-- sem grant a authenticated (apenas dono / service_role conforme necessário).

begin;

do $$
declare
  routine record;
  allowed_names text[] := array[
    -- helpers de autorização / RLS
    'is_aal2',
    'is_active_tenant_member',
    'has_tenant_permission',
    'has_unit_permission',
    'has_company_permission',
    'has_professional_permission',
    'has_encounter_permission',
    'has_document_permission',
    'has_tenant_or_any_unit_permission',
    'is_company_portal_member',
    'get_my_authorization_context',
    -- plataforma
    'create_clinic_unit',
    'set_membership_status',
    'assign_membership_role',
    'revoke_membership_role',
    'log_audit',
    'log_sensitive_read',
    'log_document_access',
    -- ocupacional / protocolo
    'create_occupational_company',
    'create_occupational_worker',
    'create_exam_catalog_item',
    'publish_pcmso_version',
    'create_occupational_structure',
    'create_exam_protocol_package',
    'create_exam_protocol_override',
    -- agenda / encaminhamento / check-in / chamadas
    'create_referral_with_protocol',
    'upsert_schedule_resource',
    'create_scheduled_appointment',
    'check_in_appointment',
    'create_call_event',
    -- clínica
    'save_triage_record',
    'save_medical_consultation',
    'create_medical_conclusion',
    'create_clinical_alert',
    'acknowledge_clinical_alert',
    'create_consultation_addendum',
    'pause_encounter_flow',
    'resolve_encounter_flow_pause',
    -- exames
    'start_visual_acuity_exam',
    'save_visual_acuity_result',
    'start_audiometry_exam',
    'save_audiometry_result',
    'start_spirometry_exam',
    'save_spirometry_maneuver',
    'save_diagnostic_exam_result',
    'record_laboratory_sample_event',
    'save_laboratory_result',
    -- documentos / financeiro / portal
    'create_generated_document_version',
    'finalize_document_version_render',
    'sign_document_version',
    'create_encounter_price_snapshot',
    'create_billing_from_snapshot',
    'issue_invoice',
    'record_invoice_payment',
    'upsert_company_portal_user',
    'upsert_company_document_release_rule',
    'get_company_portal_overview',
    -- integrações / SST
    'enqueue_integration_job',
    'create_esocial_event',
    'register_connector_spool_file',
    'requeue_integration_dead_letter',
    'create_sst_incident',
    'create_sst_epi_issue',
    'create_sst_cipa_membership'
  ];
begin
  -- 1) Revoga EXECUTE de todas as funções public (auth/anon/public)
  for routine in
    select n.nspname as schema_name,
           p.proname as function_name,
           pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
  loop
    execute format(
      'revoke all on function %I.%I(%s) from public, anon, authenticated',
      routine.schema_name,
      routine.function_name,
      routine.arguments
    );
  end loop;

  -- 2) Allowlist explícita
  for routine in
    select n.nspname as schema_name,
           p.proname as function_name,
           pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname = any (allowed_names)
  loop
    execute format(
      'grant execute on function %I.%I(%s) to authenticated',
      routine.schema_name,
      routine.function_name,
      routine.arguments
    );
  end loop;

  -- 3) service_role mantém provisionamento
  if to_regprocedure('public.provision_tenant_for_user(uuid, text, text)') is not null then
    execute 'grant execute on function public.provision_tenant_for_user(uuid, text, text) to service_role';
  end if;
end;
$$;

comment on schema public is
  'P0 allowlist: authenticated só executa RPCs listadas em 202607140028; mutações de negócio via SECURITY DEFINER auditadas.';

commit;
