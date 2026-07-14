// Generated offline from supabase/migrations. Replace with official typegen when authorized.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      appointment_events: {
        Row: {
          appointment_id: string
          created_at: string
          created_by: string
          event_type: string
          id: string | null
          payload: Json
          tenant_id: string
        }
        Insert: {
          appointment_id: string
          created_at: string
          created_by: string
          event_type: string
          id?: string
          payload: Json
          tenant_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          created_by?: string
          event_type?: string
          id?: string
          payload?: Json
          tenant_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          clinic_unit_id: string
          created_at: string
          ends_at: string
          id: string | null
          preparation_instructions: string | null
          referral_id: string | null
          resource_id: string
          starts_at: string
          status: string
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          clinic_unit_id: string
          created_at: string
          ends_at: string
          id?: string
          preparation_instructions?: string
          referral_id?: string
          resource_id: string
          starts_at: string
          status: string
          tenant_id: string
          updated_at: string
          version: number
        }
        Update: {
          clinic_unit_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          preparation_instructions?: string
          referral_id?: string
          resource_id?: string
          starts_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      audiometry_calibrations: {
        Row: {
          calibrated_at: string
          certificate_reference: string | null
          created_at: string
          equipment_name: string
          equipment_serial: string
          id: string | null
          status: string
          tenant_id: string
          valid_until: string
        }
        Insert: {
          calibrated_at: string
          certificate_reference?: string
          created_at: string
          equipment_name: string
          equipment_serial: string
          id?: string
          status: string
          tenant_id: string
          valid_until: string
        }
        Update: {
          calibrated_at?: string
          certificate_reference?: string
          created_at?: string
          equipment_name?: string
          equipment_serial?: string
          id?: string
          status?: string
          tenant_id?: string
          valid_until?: string
        }
        Relationships: []
      }
      audiometry_result_versions: {
        Row: {
          audiometry_result_id: string
          booth: Json
          comparison: Json
          complaints: Json
          correction_reason: string
          created_at: string
          created_by: string
          equipment: Json
          id: string | null
          masking: Json
          normalized_payload: Json
          occupational_data: Json
          original_import_payload: Json | null
          otoscopy: Json
          professional_conclusion: string
          report: string | null
          rest_reported: Json
          tenant_id: string
          thresholds: Json
          version: number
        }
        Insert: {
          audiometry_result_id: string
          booth: Json
          comparison: Json
          complaints: Json
          correction_reason: string
          created_at: string
          created_by: string
          equipment: Json
          id?: string
          masking: Json
          normalized_payload: Json
          occupational_data: Json
          original_import_payload?: Json
          otoscopy: Json
          professional_conclusion: string
          report?: string
          rest_reported: Json
          tenant_id: string
          thresholds: Json
          version: number
        }
        Update: {
          audiometry_result_id?: string
          booth?: Json
          comparison?: Json
          complaints?: Json
          correction_reason?: string
          created_at?: string
          created_by?: string
          equipment?: Json
          id?: string
          masking?: Json
          normalized_payload?: Json
          occupational_data?: Json
          original_import_payload?: Json
          otoscopy?: Json
          professional_conclusion?: string
          report?: string
          rest_reported?: Json
          tenant_id?: string
          thresholds?: Json
          version?: number
        }
        Relationships: []
      }
      audiometry_results: {
        Row: {
          calibration_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          current_version: number
          encounter_id: string
          exam_order_id: string
          id: string | null
          started_at: string
          started_by: string
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          calibration_id?: string
          completed_at?: string
          completed_by?: string
          created_at: string
          current_version: number
          encounter_id: string
          exam_order_id: string
          id?: string
          started_at: string
          started_by: string
          status?: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          calibration_id?: string
          completed_at?: string
          completed_by?: string
          created_at?: string
          current_version?: number
          encounter_id?: string
          exam_order_id?: string
          id?: string
          started_at?: string
          started_by?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string | null
          metadata_redacted: Json
          request_id: string
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string
          created_at: string
          entity_id?: string
          entity_type: string
          id?: string
          metadata_redacted: Json
          request_id: string
          tenant_id?: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata_redacted?: Json
          request_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      billing_adjustments: {
        Row: {
          adjustment_type: string
          amount_cents: number
          billing_item_id: string
          created_at: string
          created_by: string
          id: string | null
          justification: string
          tenant_id: string
        }
        Insert: {
          adjustment_type: string
          amount_cents: number
          billing_item_id: string
          created_at: string
          created_by: string
          id?: string
          justification: string
          tenant_id: string
        }
        Update: {
          adjustment_type?: string
          amount_cents?: number
          billing_item_id?: string
          created_at?: string
          created_by?: string
          id?: string
          justification?: string
          tenant_id?: string
        }
        Relationships: []
      }
      billing_denials: {
        Row: {
          created_at: string
          created_by: string
          id: string | null
          invoice_item_id: string
          reason: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at: string
          created_by: string
          id?: string
          invoice_item_id: string
          reason: string
          status: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invoice_item_id?: string
          reason?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      billing_items: {
        Row: {
          amount_cents: number
          billable: boolean
          company_id: string
          created_at: string
          description: string
          encounter_id: string | null
          id: string | null
          non_billable_reason: string | null
          price_snapshot: Json
          quote_item_id: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          amount_cents: number
          billable: boolean
          company_id: string
          created_at: string
          description: string
          encounter_id?: string
          id?: string
          non_billable_reason?: string
          price_snapshot: Json
          quote_item_id?: string
          status?: string
          tenant_id: string
        }
        Update: {
          amount_cents?: number
          billable?: boolean
          company_id?: string
          created_at?: string
          description?: string
          encounter_id?: string
          id?: string
          non_billable_reason?: string
          price_snapshot?: Json
          quote_item_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      call_deliveries: {
        Row: {
          acknowledged_at: string | null
          call_event_id: string
          created_at: string
          delivered_at: string | null
          display_panel_session_id: string | null
          id: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          acknowledged_at?: string
          call_event_id: string
          created_at: string
          delivered_at?: string
          display_panel_session_id?: string
          id?: string
          status: string
          tenant_id: string
        }
        Update: {
          acknowledged_at?: string
          call_event_id?: string
          created_at?: string
          delivered_at?: string
          display_panel_session_id?: string
          id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      call_events: {
        Row: {
          action: string
          clinic_unit_id: string
          created_at: string
          created_by: string
          display_panel_id: string | null
          encounter_id: string
          id: string | null
          payload_public: Json
          queue_ticket_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          action: string
          clinic_unit_id: string
          created_at: string
          created_by: string
          display_panel_id?: string
          encounter_id: string
          id?: string
          payload_public: Json
          queue_ticket_id: string
          status: string
          tenant_id: string
        }
        Update: {
          action?: string
          clinic_unit_id?: string
          created_at?: string
          created_by?: string
          display_panel_id?: string
          encounter_id?: string
          id?: string
          payload_public?: Json
          queue_ticket_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      clinic_units: {
        Row: {
          code: string
          created_at: string
          id: string | null
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at: string
          id?: string
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinical_alert_acknowledgements: {
        Row: {
          acknowledged_by: string
          alert_id: string
          created_at: string
          id: string | null
          note: string | null
          tenant_id: string
        }
        Insert: {
          acknowledged_by: string
          alert_id: string
          created_at: string
          id?: string
          note?: string
          tenant_id: string
        }
        Update: {
          acknowledged_by?: string
          alert_id?: string
          created_at?: string
          id?: string
          note?: string
          tenant_id?: string
        }
        Relationships: []
      }
      clinical_alerts: {
        Row: {
          created_at: string
          created_by: string
          encounter_id: string
          id: string | null
          message: string
          severity: string
          source_type: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at: string
          created_by: string
          encounter_id: string
          id?: string
          message: string
          severity: string
          source_type: string
          status: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          encounter_id?: string
          id?: string
          message?: string
          severity?: string
          source_type?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      clinical_professional_credentials: {
        Row: {
          clinic_unit_id: string | null
          council_code: string | null
          council_region: string | null
          created_at: string
          id: string | null
          professional_role: string
          registration_number: string | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_unit_id?: string
          council_code?: string
          council_region?: string
          created_at: string
          id?: string
          professional_role: string
          registration_number?: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Update: {
          clinic_unit_id?: string
          council_code?: string
          council_region?: string
          created_at?: string
          id?: string
          professional_role?: string
          registration_number?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commercial_contracts: {
        Row: {
          billing_rules: Json
          code: string
          company_id: string
          created_at: string
          ends_on: string | null
          id: string | null
          name: string
          starts_on: string
          status: string
          tenant_id: string
        }
        Insert: {
          billing_rules: Json
          code: string
          company_id: string
          created_at: string
          ends_on?: string
          id?: string
          name: string
          starts_on: string
          status: string
          tenant_id: string
        }
        Update: {
          billing_rules?: Json
          code?: string
          company_id?: string
          created_at?: string
          ends_on?: string
          id?: string
          name?: string
          starts_on?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      commercial_price_items: {
        Row: {
          billable_code: string
          created_at: string
          currency: string
          description: string
          id: string | null
          price_table_id: string
          technical_repeat_billable: boolean
          tenant_id: string
          unit_price_cents: number
        }
        Insert: {
          billable_code: string
          created_at: string
          currency: string
          description: string
          id?: string
          price_table_id: string
          technical_repeat_billable: boolean
          tenant_id: string
          unit_price_cents: number
        }
        Update: {
          billable_code?: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          price_table_id?: string
          technical_repeat_billable?: boolean
          tenant_id?: string
          unit_price_cents?: number
        }
        Relationships: []
      }
      commercial_price_tables: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contract_id: string
          created_at: string
          effective_from: string
          effective_until: string | null
          id: string | null
          status: string
          tenant_id: string
          version: number
        }
        Insert: {
          approved_at?: string
          approved_by?: string
          contract_id: string
          created_at: string
          effective_from: string
          effective_until?: string
          id?: string
          status: string
          tenant_id: string
          version: number
        }
        Update: {
          approved_at?: string
          approved_by?: string
          contract_id?: string
          created_at?: string
          effective_from?: string
          effective_until?: string
          id?: string
          status?: string
          tenant_id?: string
          version?: number
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string | null
          legal_name: string
          status: string
          tax_id_normalized: string
          tenant_id: string
          trade_name: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at: string
          id?: string
          legal_name: string
          status: string
          tax_id_normalized: string
          tenant_id: string
          trade_name?: string
          updated_at: string
          version: number
        }
        Update: {
          created_at?: string
          id?: string
          legal_name?: string
          status?: string
          tax_id_normalized?: string
          tenant_id?: string
          trade_name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      company_contacts: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string | null
          name: string
          phone: string | null
          role_name: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at: string
          email?: string
          id?: string
          name: string
          phone?: string
          role_name?: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          role_name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_document_release_rules: {
        Row: {
          company_id: string
          created_at: string
          document_type: string
          id: string | null
          redaction_profile: string
          release_to_company: boolean
          tenant_id: string
        }
        Insert: {
          company_id: string
          created_at: string
          document_type: string
          id?: string
          redaction_profile: string
          release_to_company: boolean
          tenant_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          document_type?: string
          id?: string
          redaction_profile?: string
          release_to_company?: boolean
          tenant_id?: string
        }
        Relationships: []
      }
      company_establishments: {
        Row: {
          code: string
          company_id: string
          created_at: string
          id: string | null
          name: string
          status: string
          tax_id_normalized: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at: string
          id?: string
          name: string
          status: string
          tax_id_normalized?: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          tax_id_normalized?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_portal_users: {
        Row: {
          company_id: string
          created_at: string
          id: string | null
          scopes: Json
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at: string
          id?: string
          scopes: Json
          status: string
          tenant_id: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          scopes?: Json
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      diagnostic_exam_result_versions: {
        Row: {
          correction_reason: string
          created_at: string
          created_by: string
          diagnostic_exam_result_id: string
          equipment: Json
          execution: Json
          external_result_validation: Json
          id: string | null
          image_or_pdf_refs: Json
          preparation: Json
          professional_conclusion: string | null
          raw_file_refs: Json
          report: string | null
          tenant_id: string
          version: number
        }
        Insert: {
          correction_reason: string
          created_at: string
          created_by: string
          diagnostic_exam_result_id: string
          equipment: Json
          execution: Json
          external_result_validation: Json
          id?: string
          image_or_pdf_refs: Json
          preparation: Json
          professional_conclusion?: string
          raw_file_refs: Json
          report?: string
          tenant_id: string
          version: number
        }
        Update: {
          correction_reason?: string
          created_at?: string
          created_by?: string
          diagnostic_exam_result_id?: string
          equipment?: Json
          execution?: Json
          external_result_validation?: Json
          id?: string
          image_or_pdf_refs?: Json
          preparation?: Json
          professional_conclusion?: string
          raw_file_refs?: Json
          report?: string
          tenant_id?: string
          version?: number
        }
        Relationships: []
      }
      diagnostic_exam_results: {
        Row: {
          created_at: string
          created_by: string
          current_version: number
          encounter_id: string
          exam_order_id: string
          executed_at: string | null
          executor_user_id: string | null
          id: string | null
          modality: string
          prepared_at: string | null
          reported_at: string | null
          requested_at: string
          reviewer_user_id: string | null
          status: string | null
          tenant_id: string
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          created_at: string
          created_by: string
          current_version: number
          encounter_id: string
          exam_order_id: string
          executed_at?: string
          executor_user_id?: string
          id?: string
          modality: string
          prepared_at?: string
          reported_at?: string
          requested_at: string
          reviewer_user_id?: string
          status?: string
          tenant_id: string
          updated_at: string
          validated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_version?: number
          encounter_id?: string
          exam_order_id?: string
          executed_at?: string
          executor_user_id?: string
          id?: string
          modality?: string
          prepared_at?: string
          reported_at?: string
          requested_at?: string
          reviewer_user_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          validated_at?: string
        }
        Relationships: []
      }
      display_panel_sessions: {
        Row: {
          created_at: string
          device_label: string
          display_panel_id: string
          id: string | null
          last_heartbeat_at: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at: string
          device_label: string
          display_panel_id: string
          id?: string
          last_heartbeat_at: string
          status: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          device_label?: string
          display_panel_id?: string
          id?: string
          last_heartbeat_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      display_panels: {
        Row: {
          channel_name: string
          clinic_unit_id: string
          code: string
          created_at: string
          id: string | null
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel_name: string
          clinic_unit_id: string
          code: string
          created_at: string
          id?: string
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          channel_name?: string
          clinic_unit_id?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_access_logs: {
        Row: {
          access_type: string
          actor_user_id: string | null
          created_at: string
          document_version_id: string
          expires_at: string | null
          id: string | null
          request_id: string
          tenant_id: string
        }
        Insert: {
          access_type: string
          actor_user_id?: string
          created_at: string
          document_version_id: string
          expires_at?: string
          id?: string
          request_id: string
          tenant_id: string
        }
        Update: {
          access_type?: string
          actor_user_id?: string
          created_at?: string
          document_version_id?: string
          expires_at?: string
          id?: string
          request_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      document_deliveries: {
        Row: {
          created_at: string
          created_by: string
          document_version_id: string
          id: string | null
          recipient_reference: string | null
          recipient_type: string
          release_matrix_snapshot: Json
          status: string
          tenant_id: string
        }
        Insert: {
          created_at: string
          created_by: string
          document_version_id: string
          id?: string
          recipient_reference?: string
          recipient_type: string
          release_matrix_snapshot: Json
          status: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          document_version_id?: string
          id?: string
          recipient_reference?: string
          recipient_type?: string
          release_matrix_snapshot?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      document_signatures: {
        Row: {
          aal: string
          document_version_id: string
          id: string | null
          ip_address: string | null
          method: string
          signed_at: string
          signed_hash: string
          signer_user_id: string
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          aal: string
          document_version_id: string
          id?: string
          ip_address?: string
          method: string
          signed_at: string
          signed_hash: string
          signer_user_id: string
          tenant_id: string
          user_agent?: string
        }
        Update: {
          aal?: string
          document_version_id?: string
          id?: string
          ip_address?: string
          method?: string
          signed_at?: string
          signed_hash?: string
          signer_user_id?: string
          tenant_id?: string
          user_agent?: string
        }
        Relationships: []
      }
      document_template_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string | null
          layout_payload: Json
          preview_fixture: Json
          status: string
          template_id: string
          tenant_id: string
          variable_schema: Json
          version: number
        }
        Insert: {
          approved_at?: string
          approved_by?: string
          created_at: string
          id?: string
          layout_payload: Json
          preview_fixture: Json
          status: string
          template_id: string
          tenant_id: string
          variable_schema: Json
          version: number
        }
        Update: {
          approved_at?: string
          approved_by?: string
          created_at?: string
          id?: string
          layout_payload?: Json
          preview_fixture?: Json
          status?: string
          template_id?: string
          tenant_id?: string
          variable_schema?: Json
          version?: number
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          code: string
          created_at: string
          document_type: string
          id: string | null
          name: string
          status: string
          tenant_id: string
        }
        Insert: {
          code: string
          created_at: string
          document_type: string
          id?: string
          name: string
          status: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          document_type?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          content_hash: string
          created_at: string
          created_by: string
          generated_document_id: string
          id: string | null
          print_config: Json
          rectification_reason: string | null
          render_status: string | null
          snapshot_payload: Json
          storage_bucket: string
          storage_path: string
          tenant_id: string
          version: number
        }
        Insert: {
          content_hash: string
          created_at: string
          created_by: string
          generated_document_id: string
          id?: string
          print_config: Json
          rectification_reason?: string
          render_status?: string
          snapshot_payload: Json
          storage_bucket: string
          storage_path: string
          tenant_id: string
          version: number
        }
        Update: {
          content_hash?: string
          created_at?: string
          created_by?: string
          generated_document_id?: string
          id?: string
          print_config?: Json
          rectification_reason?: string
          render_status?: string
          snapshot_payload?: Json
          storage_bucket?: string
          storage_path?: string
          tenant_id?: string
          version?: number
        }
        Relationships: []
      }
      employment_contract_history: {
        Row: {
          created_at: string
          employment_contract_id: string
          event_type: string
          id: string | null
          payload: Json
          tenant_id: string
        }
        Insert: {
          created_at: string
          employment_contract_id: string
          event_type: string
          id?: string
          payload: Json
          tenant_id: string
        }
        Update: {
          created_at?: string
          employment_contract_id?: string
          event_type?: string
          id?: string
          payload?: Json
          tenant_id?: string
        }
        Relationships: []
      }
      employment_contracts: {
        Row: {
          company_id: string
          created_at: string
          ends_on: string | null
          exposure_group_id: string | null
          id: string | null
          job_position_id: string | null
          sector_id: string | null
          starts_on: string
          status: string
          tenant_id: string
          updated_at: string
          version: number
          worker_id: string
        }
        Insert: {
          company_id: string
          created_at: string
          ends_on?: string
          exposure_group_id?: string
          id?: string
          job_position_id?: string
          sector_id?: string
          starts_on: string
          status: string
          tenant_id: string
          updated_at: string
          version: number
          worker_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          ends_on?: string
          exposure_group_id?: string
          id?: string
          job_position_id?: string
          sector_id?: string
          starts_on?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          version?: number
          worker_id?: string
        }
        Relationships: []
      }
      encounter_events: {
        Row: {
          created_at: string
          created_by: string
          encounter_id: string
          event_type: string
          id: string | null
          payload: Json
          tenant_id: string
        }
        Insert: {
          created_at: string
          created_by: string
          encounter_id: string
          event_type: string
          id?: string
          payload: Json
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          encounter_id?: string
          event_type?: string
          id?: string
          payload?: Json
          tenant_id?: string
        }
        Relationships: []
      }
      encounter_flow_pauses: {
        Row: {
          created_at: string
          created_by: string
          encounter_id: string
          id: string | null
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          resolved_note: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          created_at: string
          created_by: string
          encounter_id: string
          id?: string
          reason: string
          resolved_at?: string
          resolved_by?: string
          resolved_note?: string
          status: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          encounter_id?: string
          id?: string
          reason?: string
          resolved_at?: string
          resolved_by?: string
          resolved_note?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      encounter_price_snapshots: {
        Row: {
          content_hash: string
          contract_id: string
          created_at: string
          created_by: string
          encounter_id: string
          id: string | null
          price_table_id: string
          snapshot_payload: Json
          tenant_id: string
        }
        Insert: {
          content_hash: string
          contract_id: string
          created_at: string
          created_by: string
          encounter_id: string
          id?: string
          price_table_id: string
          snapshot_payload: Json
          tenant_id: string
        }
        Update: {
          content_hash?: string
          contract_id?: string
          created_at?: string
          created_by?: string
          encounter_id?: string
          id?: string
          price_table_id?: string
          snapshot_payload?: Json
          tenant_id?: string
        }
        Relationships: []
      }
      encounter_snapshots: {
        Row: {
          content_hash: string
          created_at: string
          encounter_id: string
          id: string | null
          payload: Json
          schema_version: number
          tenant_id: string
        }
        Insert: {
          content_hash: string
          created_at: string
          encounter_id: string
          id?: string
          payload: Json
          schema_version: number
          tenant_id: string
        }
        Update: {
          content_hash?: string
          created_at?: string
          encounter_id?: string
          id?: string
          payload?: Json
          schema_version?: number
          tenant_id?: string
        }
        Relationships: []
      }
      encounter_steps: {
        Row: {
          created_at: string
          depends_on_step_id: string | null
          encounter_id: string
          id: string | null
          sequence: number
          status: string
          step_type: string
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at: string
          depends_on_step_id?: string
          encounter_id: string
          id?: string
          sequence: number
          status: string
          step_type: string
          tenant_id: string
          updated_at: string
          version: number
        }
        Update: {
          created_at?: string
          depends_on_step_id?: string
          encounter_id?: string
          id?: string
          sequence?: number
          status?: string
          step_type?: string
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      encounters: {
        Row: {
          appointment_id: string | null
          checked_in_at: string
          clinic_unit_id: string
          created_at: string
          id: string | null
          referral_id: string | null
          status: string
          tenant_id: string
          updated_at: string
          version: number
          worker_id: string
        }
        Insert: {
          appointment_id?: string
          checked_in_at: string
          clinic_unit_id: string
          created_at: string
          id?: string
          referral_id?: string
          status: string
          tenant_id: string
          updated_at: string
          version: number
          worker_id: string
        }
        Update: {
          appointment_id?: string
          checked_in_at?: string
          clinic_unit_id?: string
          created_at?: string
          id?: string
          referral_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          version?: number
          worker_id?: string
        }
        Relationships: []
      }
      equipment_calibrations: {
        Row: {
          calibrated_at: string
          certificate_reference: string | null
          created_at: string
          created_by: string
          equipment_id: string
          id: string | null
          payload_redacted: Json
          status: string
          tenant_id: string
          valid_until: string
        }
        Insert: {
          calibrated_at: string
          certificate_reference?: string
          created_at: string
          created_by: string
          equipment_id: string
          id?: string
          payload_redacted: Json
          status: string
          tenant_id: string
          valid_until: string
        }
        Update: {
          calibrated_at?: string
          certificate_reference?: string
          created_at?: string
          created_by?: string
          equipment_id?: string
          id?: string
          payload_redacted?: Json
          status?: string
          tenant_id?: string
          valid_until?: string
        }
        Relationships: []
      }
      equipment_maintenance_events: {
        Row: {
          created_at: string
          created_by: string
          equipment_id: string
          event_type: string
          id: string | null
          note_redacted: string | null
          tenant_id: string
        }
        Insert: {
          created_at: string
          created_by: string
          equipment_id: string
          event_type: string
          id?: string
          note_redacted?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          equipment_id?: string
          event_type?: string
          id?: string
          note_redacted?: string
          tenant_id?: string
        }
        Relationships: []
      }
      equipment_registry: {
        Row: {
          capabilities: Json
          clinic_unit_id: string | null
          created_at: string
          equipment_type: string
          id: string | null
          manufacturer: string | null
          model: string | null
          serial_number: string
          status: string | null
          tenant_id: string
        }
        Insert: {
          capabilities: Json
          clinic_unit_id?: string
          created_at: string
          equipment_type: string
          id?: string
          manufacturer?: string
          model?: string
          serial_number: string
          status?: string
          tenant_id: string
        }
        Update: {
          capabilities?: Json
          clinic_unit_id?: string
          created_at?: string
          equipment_type?: string
          id?: string
          manufacturer?: string
          model?: string
          serial_number?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      esocial_batch_events: {
        Row: {
          batch_id: string
          created_at: string
          event_id: string
          id: string | null
          tenant_id: string
        }
        Insert: {
          batch_id: string
          created_at: string
          event_id: string
          id?: string
          tenant_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          event_id?: string
          id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      esocial_batches: {
        Row: {
          created_at: string
          created_by: string
          environment: string
          id: string | null
          idempotency_key: string
          layout_version_id: string
          protocol_number: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          created_at: string
          created_by: string
          environment: string
          id?: string
          idempotency_key: string
          layout_version_id: string
          protocol_number?: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          environment?: string
          id?: string
          idempotency_key?: string
          layout_version_id?: string
          protocol_number?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      esocial_event_validations: {
        Row: {
          code: string
          created_at: string
          event_id: string
          field_path: string | null
          id: string | null
          message: string
          severity: string
          tenant_id: string
        }
        Insert: {
          code: string
          created_at: string
          event_id: string
          field_path?: string
          id?: string
          message: string
          severity: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          event_id?: string
          field_path?: string
          id?: string
          message?: string
          severity?: string
          tenant_id?: string
        }
        Relationships: []
      }
      esocial_events: {
        Row: {
          business_key: string
          created_at: string
          created_by: string
          environment: string
          event_type: string
          id: string | null
          idempotency_key: string
          layout_version_id: string
          operation_type: string | null
          payload: Json
          payload_hash: string
          payload_version: number
          previous_event_id: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          business_key: string
          created_at: string
          created_by: string
          environment: string
          event_type: string
          id?: string
          idempotency_key: string
          layout_version_id: string
          operation_type?: string
          payload: Json
          payload_hash: string
          payload_version: number
          previous_event_id?: string
          status?: string
          tenant_id: string
        }
        Update: {
          business_key?: string
          created_at?: string
          created_by?: string
          environment?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          layout_version_id?: string
          operation_type?: string
          payload?: Json
          payload_hash?: string
          payload_version?: number
          previous_event_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      esocial_layout_versions: {
        Row: {
          consulted_at: string
          created_at: string
          id: string | null
          manual_reference: string
          revision_date: string
          source_url: string
          status: string
          technical_note: string
          tenant_id: string
          version: string
          xsd_production_date: string
        }
        Insert: {
          consulted_at: string
          created_at: string
          id?: string
          manual_reference: string
          revision_date: string
          source_url: string
          status: string
          technical_note: string
          tenant_id: string
          version: string
          xsd_production_date: string
        }
        Update: {
          consulted_at?: string
          created_at?: string
          id?: string
          manual_reference?: string
          revision_date?: string
          source_url?: string
          status?: string
          technical_note?: string
          tenant_id?: string
          version?: string
          xsd_production_date?: string
        }
        Relationships: []
      }
      esocial_receipts: {
        Row: {
          created_at: string
          event_id: string
          id: string | null
          payload_redacted: Json
          receipt_number: string
          received_at: string
          submission_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at: string
          event_id: string
          id?: string
          payload_redacted: Json
          receipt_number: string
          received_at: string
          submission_id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          payload_redacted?: Json
          receipt_number?: string
          received_at?: string
          submission_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      esocial_rejections: {
        Row: {
          code: string
          created_at: string
          event_id: string
          id: string | null
          message: string
          payload_redacted: Json
          status: string
          submission_id: string | null
          tenant_id: string
        }
        Insert: {
          code: string
          created_at: string
          event_id: string
          id?: string
          message: string
          payload_redacted: Json
          status: string
          submission_id?: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          event_id?: string
          id?: string
          message?: string
          payload_redacted?: Json
          status?: string
          submission_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      esocial_submissions: {
        Row: {
          batch_id: string
          created_at: string
          id: string | null
          integration_job_id: string | null
          received_at: string | null
          request_payload_hash: string
          response_payload_redacted: Json
          sent_at: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          batch_id: string
          created_at: string
          id?: string
          integration_job_id?: string
          received_at?: string
          request_payload_hash: string
          response_payload_redacted: Json
          sent_at?: string
          status?: string
          tenant_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          integration_job_id?: string
          received_at?: string
          request_payload_hash?: string
          response_payload_redacted?: Json
          sent_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      exam_catalog: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string | null
          name: string
          result_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active: boolean
          code: string
          created_at: string
          id?: string
          name: string
          result_type: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          result_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_orders: {
        Row: {
          created_at: string
          encounter_id: string
          exam_catalog_id: string
          id: string | null
          protocol_snapshot: Json
          status: string
          tenant_id: string
        }
        Insert: {
          created_at: string
          encounter_id: string
          exam_catalog_id: string
          id?: string
          protocol_snapshot: Json
          status: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          encounter_id?: string
          exam_catalog_id?: string
          id?: string
          protocol_snapshot?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      exam_protocol_items: {
        Row: {
          conditions: Json
          created_at: string
          exam_catalog_id: string
          exam_protocol_id: string
          id: string | null
          required: boolean
          tenant_id: string
        }
        Insert: {
          conditions: Json
          created_at: string
          exam_catalog_id: string
          exam_protocol_id: string
          id?: string
          required: boolean
          tenant_id: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          exam_catalog_id?: string
          exam_protocol_id?: string
          id?: string
          required?: boolean
          tenant_id?: string
        }
        Relationships: []
      }
      exam_protocol_overrides: {
        Row: {
          action: string
          created_at: string
          created_by: string
          employment_contract_id: string | null
          exam_catalog_id: string
          exam_protocol_id: string | null
          id: string | null
          justification: string
          request_id: string
          tenant_id: string
          worker_id: string | null
        }
        Insert: {
          action: string
          created_at: string
          created_by: string
          employment_contract_id?: string
          exam_catalog_id: string
          exam_protocol_id?: string
          id?: string
          justification: string
          request_id: string
          tenant_id: string
          worker_id?: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string
          employment_contract_id?: string
          exam_catalog_id?: string
          exam_protocol_id?: string
          id?: string
          justification?: string
          request_id?: string
          tenant_id?: string
          worker_id?: string
        }
        Relationships: []
      }
      exam_protocol_rules: {
        Row: {
          conditions: Json
          conflict_policy: string
          created_at: string
          exam_protocol_id: string
          id: string | null
          name: string
          priority: number
          tenant_id: string
        }
        Insert: {
          conditions: Json
          conflict_policy: string
          created_at: string
          exam_protocol_id: string
          id?: string
          name: string
          priority: number
          tenant_id: string
        }
        Update: {
          conditions?: Json
          conflict_policy?: string
          created_at?: string
          exam_protocol_id?: string
          id?: string
          name?: string
          priority?: number
          tenant_id?: string
        }
        Relationships: []
      }
      exam_protocols: {
        Row: {
          created_at: string
          id: string | null
          occupational_exam_type: string
          pcmso_version_id: string
          rule_version: number
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at: string
          id?: string
          occupational_exam_type: string
          pcmso_version_id: string
          rule_version: number
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          occupational_exam_type?: string
          pcmso_version_id?: string
          rule_version?: number
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      exposure_groups: {
        Row: {
          code: string
          company_id: string
          created_at: string
          description: string | null
          id: string | null
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at: string
          description?: string
          id?: string
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      external_laboratories: {
        Row: {
          created_at: string
          id: string | null
          name: string
          status: string
          tax_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at: string
          id?: string
          name: string
          status: string
          tax_id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          tax_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          created_at: string
          created_by: string
          current_version: number
          document_type: string
          encounter_id: string | null
          id: string | null
          idempotency_key: string
          status: string | null
          template_version_id: string
          tenant_id: string
          vigente_version_id: string | null
          worker_id: string | null
        }
        Insert: {
          created_at: string
          created_by: string
          current_version: number
          document_type: string
          encounter_id?: string
          id?: string
          idempotency_key: string
          status?: string
          template_version_id: string
          tenant_id: string
          vigente_version_id?: string
          worker_id?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_version?: number
          document_type?: string
          encounter_id?: string
          id?: string
          idempotency_key?: string
          status?: string
          template_version_id?: string
          tenant_id?: string
          vigente_version_id?: string
          worker_id?: string
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          id: string | null
          key: string
          request_hash: string
          response_reference: Json | null
          scope: string
          tenant_id: string
        }
        Insert: {
          created_at: string
          expires_at: string
          id?: string
          key: string
          request_hash: string
          response_reference?: Json
          scope: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          key?: string
          request_hash?: string
          response_reference?: Json
          scope?: string
          tenant_id?: string
        }
        Relationships: []
      }
      integration_connections: {
        Row: {
          config_redacted: Json
          connection_type: string | null
          created_at: string
          credential_reference: string | null
          display_name: string
          id: string | null
          provider: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          config_redacted: Json
          connection_type?: string
          created_at: string
          credential_reference?: string
          display_name: string
          id?: string
          provider: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          config_redacted?: Json
          connection_type?: string
          created_at?: string
          credential_reference?: string
          display_name?: string
          id?: string
          provider?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_dead_letters: {
        Row: {
          created_at: string
          delivery_id: string | null
          id: string | null
          job_id: string | null
          payload_redacted: Json
          reason_redacted: string
          reprocessed_at: string | null
          reprocessed_by: string | null
          tenant_id: string
        }
        Insert: {
          created_at: string
          delivery_id?: string
          id?: string
          job_id?: string
          payload_redacted: Json
          reason_redacted: string
          reprocessed_at?: string
          reprocessed_by?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          delivery_id?: string
          id?: string
          job_id?: string
          payload_redacted?: Json
          reason_redacted?: string
          reprocessed_at?: string
          reprocessed_by?: string
          tenant_id?: string
        }
        Relationships: []
      }
      integration_deliveries: {
        Row: {
          attempts: number
          created_at: string
          destination: string
          id: string | null
          job_id: string
          next_attempt_at: string | null
          response_redacted: string | null
          response_status: number | null
          signature_header: string | null
          status: string | null
          tenant_id: string
          webhook_id: string | null
        }
        Insert: {
          attempts: number
          created_at: string
          destination: string
          id?: string
          job_id: string
          next_attempt_at?: string
          response_redacted?: string
          response_status?: number
          signature_header?: string
          status?: string
          tenant_id: string
          webhook_id?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          destination?: string
          id?: string
          job_id?: string
          next_attempt_at?: string
          response_redacted?: string
          response_status?: number
          signature_header?: string
          status?: string
          tenant_id?: string
          webhook_id?: string
        }
        Relationships: []
      }
      integration_jobs: {
        Row: {
          attempts: number
          connection_id: string | null
          created_at: string
          created_by: string | null
          id: string | null
          idempotency_key: string
          job_type: string
          last_error_redacted: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          next_attempt_at: string
          payload_redacted: Json
          status: string | null
          tenant_id: string
        }
        Insert: {
          attempts: number
          connection_id?: string
          created_at: string
          created_by?: string
          id?: string
          idempotency_key: string
          job_type: string
          last_error_redacted?: string
          locked_at?: string
          locked_by?: string
          max_attempts: number
          next_attempt_at: string
          payload_redacted: Json
          status?: string
          tenant_id: string
        }
        Update: {
          attempts?: number
          connection_id?: string
          created_at?: string
          created_by?: string
          id?: string
          idempotency_key?: string
          job_type?: string
          last_error_redacted?: string
          locked_at?: string
          locked_by?: string
          max_attempts?: number
          next_attempt_at?: string
          payload_redacted?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          connection_id: string | null
          created_at: string
          id: string | null
          job_id: string | null
          level: string
          message: string
          metadata_redacted: Json
          tenant_id: string
        }
        Insert: {
          connection_id?: string
          created_at: string
          id?: string
          job_id?: string
          level: string
          message: string
          metadata_redacted: Json
          tenant_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: string
          job_id?: string
          level?: string
          message?: string
          metadata_redacted?: Json
          tenant_id?: string
        }
        Relationships: []
      }
      integration_webhooks: {
        Row: {
          connection_id: string
          created_at: string
          event_type: string
          id: string | null
          signing_secret_reference: string
          status: string
          target_url: string
          tenant_id: string
        }
        Insert: {
          connection_id: string
          created_at: string
          event_type: string
          id?: string
          signing_secret_reference: string
          status: string
          target_url: string
          tenant_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          event_type?: string
          id?: string
          signing_secret_reference?: string
          status?: string
          target_url?: string
          tenant_id?: string
        }
        Relationships: []
      }
      internal_notifications: {
        Row: {
          body_redacted: string
          created_at: string
          id: string | null
          notification_type: string
          status: string
          target_user_id: string | null
          tenant_id: string
          title: string
        }
        Insert: {
          body_redacted: string
          created_at: string
          id?: string
          notification_type: string
          status: string
          target_user_id?: string
          tenant_id: string
          title: string
        }
        Update: {
          body_redacted?: string
          created_at?: string
          id?: string
          notification_type?: string
          status?: string
          target_user_id?: string
          tenant_id?: string
          title?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount_cents: number
          billing_item_id: string
          created_at: string
          description: string
          id: string | null
          invoice_id: string
          tenant_id: string
        }
        Insert: {
          amount_cents: number
          billing_item_id: string
          created_at: string
          description: string
          id?: string
          invoice_id: string
          tenant_id: string
        }
        Update: {
          amount_cents?: number
          billing_item_id?: string
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          due_on: string | null
          id: string | null
          issued_at: string | null
          status: string | null
          tenant_id: string
          total_cents: number
        }
        Insert: {
          company_id: string
          created_at: string
          created_by: string
          due_on?: string
          id?: string
          issued_at?: string
          status?: string
          tenant_id: string
          total_cents: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          due_on?: string
          id?: string
          issued_at?: string
          status?: string
          tenant_id?: string
          total_cents?: number
        }
        Relationships: []
      }
      job_positions: {
        Row: {
          code: string
          company_id: string
          created_at: string
          id: string | null
          name: string
          sector_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at: string
          id?: string
          name: string
          sector_id?: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          sector_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      laboratory_critical_confirmations: {
        Row: {
          confirmation_note: string
          confirmed_by: string
          created_at: string
          id: string | null
          laboratory_result_id: string
          tenant_id: string
        }
        Insert: {
          confirmation_note: string
          confirmed_by: string
          created_at: string
          id?: string
          laboratory_result_id: string
          tenant_id: string
        }
        Update: {
          confirmation_note?: string
          confirmed_by?: string
          created_at?: string
          id?: string
          laboratory_result_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      laboratory_order_items: {
        Row: {
          analyte_code: string
          analyte_name: string
          created_at: string
          exam_order_id: string | null
          id: string | null
          laboratory_order_id: string
          reference_range_config: Json
          status: string | null
          tenant_id: string
        }
        Insert: {
          analyte_code: string
          analyte_name: string
          created_at: string
          exam_order_id?: string
          id?: string
          laboratory_order_id: string
          reference_range_config: Json
          status?: string
          tenant_id: string
        }
        Update: {
          analyte_code?: string
          analyte_name?: string
          created_at?: string
          exam_order_id?: string
          id?: string
          laboratory_order_id?: string
          reference_range_config?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      laboratory_orders: {
        Row: {
          barcode_value: string | null
          created_at: string
          created_by: string
          encounter_id: string
          external_laboratory_id: string | null
          id: string | null
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          barcode_value?: string
          created_at: string
          created_by: string
          encounter_id: string
          external_laboratory_id?: string
          id?: string
          status?: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          barcode_value?: string
          created_at?: string
          created_by?: string
          encounter_id?: string
          external_laboratory_id?: string
          id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      laboratory_results: {
        Row: {
          created_at: string
          created_by: string
          critical_confirmed_at: string | null
          critical_flag: boolean
          id: string | null
          laboratory_order_item_id: string
          reference_range_snapshot: Json
          released_at: string | null
          released_by: string | null
          result_payload: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tenant_id: string
          version: number
        }
        Insert: {
          created_at: string
          created_by: string
          critical_confirmed_at?: string
          critical_flag: boolean
          id?: string
          laboratory_order_item_id: string
          reference_range_snapshot: Json
          released_at?: string
          released_by?: string
          result_payload: Json
          reviewed_at?: string
          reviewed_by?: string
          status?: string
          tenant_id: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string
          critical_confirmed_at?: string
          critical_flag?: boolean
          id?: string
          laboratory_order_item_id?: string
          reference_range_snapshot?: Json
          released_at?: string
          released_by?: string
          result_payload?: Json
          reviewed_at?: string
          reviewed_by?: string
          status?: string
          tenant_id?: string
          version?: number
        }
        Relationships: []
      }
      laboratory_sample_events: {
        Row: {
          created_at: string
          created_by: string
          event_type: string | null
          id: string | null
          payload: Json
          sample_id: string
          tenant_id: string
        }
        Insert: {
          created_at: string
          created_by: string
          event_type?: string
          id?: string
          payload: Json
          sample_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_type?: string
          id?: string
          payload?: Json
          sample_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      laboratory_samples: {
        Row: {
          collected_at: string | null
          created_at: string
          id: string | null
          laboratory_order_id: string
          received_at: string | null
          sample_code: string
          sample_type: string
          status: string | null
          tenant_id: string
        }
        Insert: {
          collected_at?: string
          created_at: string
          id?: string
          laboratory_order_id: string
          received_at?: string
          sample_code: string
          sample_type: string
          status?: string
          tenant_id: string
        }
        Update: {
          collected_at?: string
          created_at?: string
          id?: string
          laboratory_order_id?: string
          received_at?: string
          sample_code?: string
          sample_type?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      local_connector_events: {
        Row: {
          connector_id: string
          created_at: string
          equipment_id: string | null
          event_type: string
          id: string | null
          idempotency_key: string
          payload_redacted: Json
          status: string | null
          tenant_id: string
        }
        Insert: {
          connector_id: string
          created_at: string
          equipment_id?: string
          event_type: string
          id?: string
          idempotency_key: string
          payload_redacted: Json
          status?: string
          tenant_id: string
        }
        Update: {
          connector_id?: string
          created_at?: string
          equipment_id?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          payload_redacted?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      local_connector_tokens: {
        Row: {
          connector_id: string
          created_at: string
          expires_at: string
          id: string | null
          status: string
          tenant_id: string
          token_hash: string
        }
        Insert: {
          connector_id: string
          created_at: string
          expires_at: string
          id?: string
          status: string
          tenant_id: string
          token_hash: string
        }
        Update: {
          connector_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          tenant_id?: string
          token_hash?: string
        }
        Relationships: []
      }
      local_connector_update_policies: {
        Row: {
          connector_id: string | null
          created_at: string
          id: string | null
          min_version: string
          signature_reference: string
          status: string
          target_version: string
          tenant_id: string
        }
        Insert: {
          connector_id?: string
          created_at: string
          id?: string
          min_version: string
          signature_reference: string
          status: string
          target_version: string
          tenant_id: string
        }
        Update: {
          connector_id?: string
          created_at?: string
          id?: string
          min_version?: string
          signature_reference?: string
          status?: string
          target_version?: string
          tenant_id?: string
        }
        Relationships: []
      }
      local_connectors: {
        Row: {
          clinic_unit_id: string | null
          connector_name: string
          created_at: string
          device_public_key: string
          id: string | null
          last_seen_at: string | null
          scope: Json
          status: string | null
          tenant_id: string
        }
        Insert: {
          clinic_unit_id?: string
          connector_name: string
          created_at: string
          device_public_key: string
          id?: string
          last_seen_at?: string
          scope: Json
          status?: string
          tenant_id: string
        }
        Update: {
          clinic_unit_id?: string
          connector_name?: string
          created_at?: string
          device_public_key?: string
          id?: string
          last_seen_at?: string
          scope?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      medical_conclusion_rules: {
        Row: {
          block_when_flow_paused: boolean
          block_when_no_closed_consultation: boolean
          block_when_no_closed_triage: boolean
          block_when_pending_required_exams: boolean
          code: string
          created_at: string
          id: string | null
          name: string
          status: string
          tenant_id: string
        }
        Insert: {
          block_when_flow_paused: boolean
          block_when_no_closed_consultation: boolean
          block_when_no_closed_triage: boolean
          block_when_pending_required_exams: boolean
          code: string
          created_at: string
          id?: string
          name: string
          status: string
          tenant_id: string
        }
        Update: {
          block_when_flow_paused?: boolean
          block_when_no_closed_consultation?: boolean
          block_when_no_closed_triage?: boolean
          block_when_pending_required_exams?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      medical_conclusions: {
        Row: {
          conclusion_code: string | null
          consultation_id: string
          created_at: string
          created_by: string
          encounter_id: string
          id: string | null
          notes: string | null
          physician_credential_id: string
          restrictions: Json
          signature_status: string | null
          signed_at: string | null
          tenant_id: string
        }
        Insert: {
          conclusion_code?: string
          consultation_id: string
          created_at: string
          created_by: string
          encounter_id: string
          id?: string
          notes?: string
          physician_credential_id: string
          restrictions: Json
          signature_status?: string
          signed_at?: string
          tenant_id: string
        }
        Update: {
          conclusion_code?: string
          consultation_id?: string
          created_at?: string
          created_by?: string
          encounter_id?: string
          id?: string
          notes?: string
          physician_credential_id?: string
          restrictions?: Json
          signature_status?: string
          signed_at?: string
          tenant_id?: string
        }
        Relationships: []
      }
      medical_consultation_addenda: {
        Row: {
          consultation_id: string
          created_at: string
          created_by: string
          id: string | null
          note: string
          reason: string
          tenant_id: string
        }
        Insert: {
          consultation_id: string
          created_at: string
          created_by: string
          id?: string
          note: string
          reason: string
          tenant_id: string
        }
        Update: {
          consultation_id?: string
          created_at?: string
          created_by?: string
          id?: string
          note?: string
          reason?: string
          tenant_id?: string
        }
        Relationships: []
      }
      medical_consultation_versions: {
        Row: {
          assessment: string | null
          consultation_id: string
          created_at: string
          created_by: string
          id: string | null
          objective: Json
          plan: string | null
          reason: string
          subjective: Json
          tenant_id: string
          version: number
        }
        Insert: {
          assessment?: string
          consultation_id: string
          created_at: string
          created_by: string
          id?: string
          objective: Json
          plan?: string
          reason: string
          subjective: Json
          tenant_id: string
          version: number
        }
        Update: {
          assessment?: string
          consultation_id?: string
          created_at?: string
          created_by?: string
          id?: string
          objective?: Json
          plan?: string
          reason?: string
          subjective?: Json
          tenant_id?: string
          version?: number
        }
        Relationships: []
      }
      medical_consultations: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          current_version: number
          encounter_id: string
          id: string | null
          physician_credential_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          closed_at?: string
          closed_by?: string
          created_at: string
          current_version: number
          encounter_id: string
          id?: string
          physician_credential_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          closed_at?: string
          closed_by?: string
          created_at?: string
          current_version?: number
          encounter_id?: string
          id?: string
          physician_credential_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      membership_roles: {
        Row: {
          clinic_unit_id: string | null
          id: string | null
          membership_id: string
          role_id: string
        }
        Insert: {
          clinic_unit_id?: string
          id?: string
          membership_id: string
          role_id: string
        }
        Update: {
          clinic_unit_id?: string
          id?: string
          membership_id?: string
          role_id?: string
        }
        Relationships: []
      }
      message_consents: {
        Row: {
          channel: string
          created_at: string
          granted_at: string | null
          id: string | null
          legal_basis: string
          revoked_at: string | null
          status: string
          subject_reference: string
          subject_type: string
          tenant_id: string
        }
        Insert: {
          channel: string
          created_at: string
          granted_at?: string
          id?: string
          legal_basis: string
          revoked_at?: string
          status: string
          subject_reference: string
          subject_type: string
          tenant_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          granted_at?: string
          id?: string
          legal_basis?: string
          revoked_at?: string
          status?: string
          subject_reference?: string
          subject_type?: string
          tenant_id?: string
        }
        Relationships: []
      }
      message_deliveries: {
        Row: {
          created_at: string
          id: string | null
          message_id: string
          occurred_at: string
          provider_message_id: string | null
          response_redacted: Json
          status: string
          tenant_id: string
        }
        Insert: {
          created_at: string
          id?: string
          message_id: string
          occurred_at: string
          provider_message_id?: string
          response_redacted: Json
          status: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          occurred_at?: string
          provider_message_id?: string
          response_redacted?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      message_opt_outs: {
        Row: {
          channel: string
          created_at: string
          destination_hash: string
          id: string | null
          reason: string | null
          tenant_id: string
        }
        Insert: {
          channel: string
          created_at: string
          destination_hash: string
          id?: string
          reason?: string
          tenant_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          destination_hash?: string
          id?: string
          reason?: string
          tenant_id?: string
        }
        Relationships: []
      }
      message_queue: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          created_by: string | null
          destination_hash: string
          id: string | null
          idempotency_key: string
          integration_connection_id: string | null
          next_attempt_at: string
          payload_redacted: Json
          recipient_reference: string | null
          recipient_type: string
          status: string | null
          template_version_id: string | null
          tenant_id: string
        }
        Insert: {
          attempts: number
          channel: string
          created_at: string
          created_by?: string
          destination_hash: string
          id?: string
          idempotency_key: string
          integration_connection_id?: string
          next_attempt_at: string
          payload_redacted: Json
          recipient_reference?: string
          recipient_type: string
          status?: string
          template_version_id?: string
          tenant_id: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          created_by?: string
          destination_hash?: string
          id?: string
          idempotency_key?: string
          integration_connection_id?: string
          next_attempt_at?: string
          payload_redacted?: Json
          recipient_reference?: string
          recipient_type?: string
          status?: string
          template_version_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      message_template_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body_template: string
          contains_sensitive_content: boolean
          created_at: string
          id: string | null
          status: string
          subject_template: string | null
          template_id: string
          tenant_id: string
          variables_schema: Json
          version: number
        }
        Insert: {
          approved_at?: string
          approved_by?: string
          body_template: string
          contains_sensitive_content: boolean
          created_at: string
          id?: string
          status: string
          subject_template?: string
          template_id: string
          tenant_id: string
          variables_schema: Json
          version: number
        }
        Update: {
          approved_at?: string
          approved_by?: string
          body_template?: string
          contains_sensitive_content?: boolean
          created_at?: string
          id?: string
          status?: string
          subject_template?: string
          template_id?: string
          tenant_id?: string
          variables_schema?: Json
          version?: number
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          channel: string
          code: string
          created_at: string
          id: string | null
          name: string
          status: string
          tenant_id: string
        }
        Insert: {
          channel: string
          code: string
          created_at: string
          id?: string
          name: string
          status: string
          tenant_id: string
        }
        Update: {
          channel?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      occupational_risks: {
        Row: {
          code: string
          created_at: string
          id: string | null
          name: string
          risk_type: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at: string
          id?: string
          name: string
          risk_type: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          risk_type?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      outbox_events: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          attempts: number
          created_at: string
          event_type: string
          id: string | null
          next_attempt_at: string | null
          payload_redacted: Json
          status: string
          tenant_id: string
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          attempts: number
          created_at: string
          event_type: string
          id?: string
          next_attempt_at?: string
          payload_redacted: Json
          status: string
          tenant_id: string
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          next_attempt_at?: string
          payload_redacted?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string
          id: string | null
          invoice_id: string
          method: string
          paid_at: string
          reference: string | null
          tenant_id: string
        }
        Insert: {
          amount_cents: number
          created_at: string
          created_by: string
          id?: string
          invoice_id: string
          method: string
          paid_at: string
          reference?: string
          tenant_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string
          id?: string
          invoice_id?: string
          method?: string
          paid_at?: string
          reference?: string
          tenant_id?: string
        }
        Relationships: []
      }
      pcmso_programs: {
        Row: {
          code: string
          company_id: string
          created_at: string
          id: string | null
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at: string
          id?: string
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pcmso_versions: {
        Row: {
          approved_at: string | null
          company_id: string
          content_hash: string | null
          created_at: string
          id: string | null
          pcmso_program_id: string
          status: string
          tenant_id: string
          updated_at: string
          valid_from: string
          valid_until: string | null
          version_number: number
        }
        Insert: {
          approved_at?: string
          company_id: string
          content_hash?: string
          created_at: string
          id?: string
          pcmso_program_id: string
          status: string
          tenant_id: string
          updated_at: string
          valid_from: string
          valid_until?: string
          version_number: number
        }
        Update: {
          approved_at?: string
          company_id?: string
          content_hash?: string
          created_at?: string
          id?: string
          pcmso_program_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
          version_number?: number
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          description: string
          id: string | null
        }
        Insert: {
          code: string
          description: string
          id?: string
        }
        Update: {
          code?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      price_list_items: {
        Row: {
          created_at: string
          exam_catalog_id: string
          id: string | null
          price_cents: number
          price_list_id: string
          tenant_id: string
        }
        Insert: {
          created_at: string
          exam_catalog_id: string
          id?: string
          price_cents: number
          price_list_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          exam_catalog_id?: string
          id?: string
          price_cents?: number
          price_list_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      price_lists: {
        Row: {
          code: string
          company_id: string | null
          created_at: string
          id: string | null
          name: string
          status: string
          tenant_id: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          company_id?: string
          created_at: string
          id?: string
          name: string
          status: string
          tenant_id: string
          updated_at: string
          valid_from: string
          valid_until?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      queue_definitions: {
        Row: {
          clinic_unit_id: string
          code: string
          created_at: string
          id: string | null
          name: string
          status: string
          step_type: string
          tenant_id: string
        }
        Insert: {
          clinic_unit_id: string
          code: string
          created_at: string
          id?: string
          name: string
          status: string
          step_type: string
          tenant_id: string
        }
        Update: {
          clinic_unit_id?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          step_type?: string
          tenant_id?: string
        }
        Relationships: []
      }
      queue_tickets: {
        Row: {
          created_at: string
          encounter_id: string
          encounter_step_id: string
          id: string | null
          position_key: string
          priority: number
          queue_definition_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at: string
          encounter_id: string
          encounter_step_id: string
          id?: string
          position_key: string
          priority: number
          queue_definition_id: string
          status: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          encounter_id?: string
          encounter_step_id?: string
          id?: string
          position_key?: string
          priority?: number
          queue_definition_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          description: string
          id: string | null
          price_snapshot: Json
          quantity: number
          quote_id: string
          tenant_id: string
          total_cents: number
          unit_price_cents: number
        }
        Insert: {
          created_at: string
          description: string
          id?: string
          price_snapshot: Json
          quantity: number
          quote_id: string
          tenant_id: string
          total_cents: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          price_snapshot?: Json
          quantity?: number
          quote_id?: string
          tenant_id?: string
          total_cents?: number
          unit_price_cents?: number
        }
        Relationships: []
      }
      quotes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          contract_id: string | null
          converted_at: string | null
          created_at: string
          created_by: string
          id: string | null
          status: string | null
          tenant_id: string
          total_cents: number
        }
        Insert: {
          approved_at?: string
          approved_by?: string
          company_id: string
          contract_id?: string
          converted_at?: string
          created_at: string
          created_by: string
          id?: string
          status?: string
          tenant_id: string
          total_cents: number
        }
        Update: {
          approved_at?: string
          approved_by?: string
          company_id?: string
          contract_id?: string
          converted_at?: string
          created_at?: string
          created_by?: string
          id?: string
          status?: string
          tenant_id?: string
          total_cents?: number
        }
        Relationships: []
      }
      referral_import_batches: {
        Row: {
          created_at: string
          created_by: string
          file_name: string
          id: string | null
          idempotency_key: string
          invalid_count: number
          row_count: number
          status: string
          tenant_id: string
          valid_count: number
        }
        Insert: {
          created_at: string
          created_by: string
          file_name: string
          id?: string
          idempotency_key: string
          invalid_count: number
          row_count: number
          status: string
          tenant_id: string
          valid_count: number
        }
        Update: {
          created_at?: string
          created_by?: string
          file_name?: string
          id?: string
          idempotency_key?: string
          invalid_count?: number
          row_count?: number
          status?: string
          tenant_id?: string
          valid_count?: number
        }
        Relationships: []
      }
      referral_import_lines: {
        Row: {
          batch_id: string
          created_at: string
          errors: Json
          id: string | null
          normalized_payload: Json
          raw_payload: Json
          referral_id: string | null
          row_number: number
          status: string
          tenant_id: string
        }
        Insert: {
          batch_id: string
          created_at: string
          errors: Json
          id?: string
          normalized_payload: Json
          raw_payload: Json
          referral_id?: string
          row_number: number
          status: string
          tenant_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          errors?: Json
          id?: string
          normalized_payload?: Json
          raw_payload?: Json
          referral_id?: string
          row_number?: number
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      referral_items: {
        Row: {
          created_at: string
          exam_catalog_id: string | null
          id: string | null
          referral_id: string
          source: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at: string
          exam_catalog_id?: string
          id?: string
          referral_id: string
          source: string
          status: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          exam_catalog_id?: string
          id?: string
          referral_id?: string
          source?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          company_id: string
          created_at: string
          divergence_report: Json
          employment_contract_id: string | null
          exam_preview: Json
          id: string | null
          idempotency_key: string | null
          occupational_exam_type: string
          status: string
          tenant_id: string
          updated_at: string
          valid_until: string | null
          worker_id: string
        }
        Insert: {
          company_id: string
          created_at: string
          divergence_report: Json
          employment_contract_id?: string
          exam_preview: Json
          id?: string
          idempotency_key?: string
          occupational_exam_type: string
          status: string
          tenant_id: string
          updated_at: string
          valid_until?: string
          worker_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          divergence_report?: Json
          employment_contract_id?: string
          exam_preview?: Json
          id?: string
          idempotency_key?: string
          occupational_exam_type?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          valid_until?: string
          worker_id?: string
        }
        Relationships: []
      }
      risk_assignments: {
        Row: {
          company_id: string
          created_at: string
          ends_on: string | null
          exposure_group_id: string | null
          id: string | null
          job_position_id: string | null
          notes: string | null
          occupational_risk_id: string
          source: string
          starts_on: string
          tenant_id: string
          version: number
        }
        Insert: {
          company_id: string
          created_at: string
          ends_on?: string
          exposure_group_id?: string
          id?: string
          job_position_id?: string
          notes?: string
          occupational_risk_id: string
          source: string
          starts_on: string
          tenant_id: string
          version: number
        }
        Update: {
          company_id?: string
          created_at?: string
          ends_on?: string
          exposure_group_id?: string
          id?: string
          job_position_id?: string
          notes?: string
          occupational_risk_id?: string
          source?: string
          starts_on?: string
          tenant_id?: string
          version?: number
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          code: string
          created_at: string
          id: string | null
          is_system: boolean
          name: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at: string
          id?: string
          is_system: boolean
          name: string
          tenant_id?: string
          updated_at: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_resources: {
        Row: {
          clinic_unit_id: string
          code: string
          created_at: string
          id: string | null
          name: string
          resource_type: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          clinic_unit_id: string
          code: string
          created_at: string
          id?: string
          name: string
          resource_type: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          clinic_unit_id?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          resource_type?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          code: string
          company_id: string
          created_at: string
          establishment_id: string | null
          id: string | null
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at: string
          establishment_id?: string
          id?: string
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          establishment_id?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      spirometry_calibrations: {
        Row: {
          created_at: string
          equipment_name: string
          equipment_serial: string
          id: string | null
          status: string
          tenant_id: string
          valid_until: string
          verification_payload: Json
          verified_at: string
        }
        Insert: {
          created_at: string
          equipment_name: string
          equipment_serial: string
          id?: string
          status: string
          tenant_id: string
          valid_until: string
          verification_payload: Json
          verified_at: string
        }
        Update: {
          created_at?: string
          equipment_name?: string
          equipment_serial?: string
          id?: string
          status?: string
          tenant_id?: string
          valid_until?: string
          verification_payload?: Json
          verified_at?: string
        }
        Relationships: []
      }
      spirometry_maneuvers: {
        Row: {
          accepted: boolean
          attempt_number: number
          created_at: string
          created_by: string
          curve_attachment_refs: Json
          id: string | null
          measured_values: Json
          percentages: Json
          predicted_values: Json
          quality_grade: string
          spirometry_result_id: string
          technical_notes: string | null
          tenant_id: string
        }
        Insert: {
          accepted: boolean
          attempt_number: number
          created_at: string
          created_by: string
          curve_attachment_refs: Json
          id?: string
          measured_values: Json
          percentages: Json
          predicted_values: Json
          quality_grade: string
          spirometry_result_id: string
          technical_notes?: string
          tenant_id: string
        }
        Update: {
          accepted?: boolean
          attempt_number?: number
          created_at?: string
          created_by?: string
          curve_attachment_refs?: Json
          id?: string
          measured_values?: Json
          percentages?: Json
          predicted_values?: Json
          quality_grade?: string
          spirometry_result_id?: string
          technical_notes?: string
          tenant_id?: string
        }
        Relationships: []
      }
      spirometry_predicted_value_sets: {
        Row: {
          code: string
          created_at: string
          formula_metadata: Json
          id: string | null
          name: string
          status: string
          tenant_id: string
        }
        Insert: {
          code: string
          created_at: string
          formula_metadata: Json
          id?: string
          name: string
          status: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          formula_metadata?: Json
          id?: string
          name?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      spirometry_result_versions: {
        Row: {
          accepted_maneuver_snapshot: Json | null
          bronchodilator: Json
          correction_reason: string
          created_at: string
          created_by: string
          id: string | null
          inconclusive_reason: string | null
          professional_conclusion: string | null
          required_inputs: Json
          spirometry_result_id: string
          tenant_id: string
          version: number
        }
        Insert: {
          accepted_maneuver_snapshot?: Json
          bronchodilator: Json
          correction_reason: string
          created_at: string
          created_by: string
          id?: string
          inconclusive_reason?: string
          professional_conclusion?: string
          required_inputs: Json
          spirometry_result_id: string
          tenant_id: string
          version: number
        }
        Update: {
          accepted_maneuver_snapshot?: Json
          bronchodilator?: Json
          correction_reason?: string
          created_at?: string
          created_by?: string
          id?: string
          inconclusive_reason?: string
          professional_conclusion?: string
          required_inputs?: Json
          spirometry_result_id?: string
          tenant_id?: string
          version?: number
        }
        Relationships: []
      }
      spirometry_results: {
        Row: {
          calibration_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          current_version: number
          encounter_id: string
          exam_order_id: string
          id: string | null
          predicted_value_set_id: string | null
          started_at: string
          started_by: string
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          calibration_id?: string
          completed_at?: string
          completed_by?: string
          created_at: string
          current_version: number
          encounter_id: string
          exam_order_id: string
          id?: string
          predicted_value_set_id?: string
          started_at: string
          started_by: string
          status?: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          calibration_id?: string
          completed_at?: string
          completed_by?: string
          created_at?: string
          current_version?: number
          encounter_id?: string
          exam_order_id?: string
          id?: string
          predicted_value_set_id?: string
          started_at?: string
          started_by?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_memberships: {
        Row: {
          created_at: string
          id: string | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at: string
          id?: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
          valid_from: string
          valid_until?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          id: string | null
          legal_name: string
          status: string
          timezone: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          created_at: string
          id?: string
          legal_name: string
          status: string
          timezone: string
          trade_name?: string
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          legal_name?: string
          status?: string
          timezone?: string
          trade_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      triage_form_templates: {
        Row: {
          code: string
          created_at: string
          id: string | null
          name: string
          status: string
          tenant_id: string
        }
        Insert: {
          code: string
          created_at: string
          id?: string
          name: string
          status: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      triage_form_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string | null
          schema_json: Json
          status: string
          template_id: string
          tenant_id: string
          version: number
        }
        Insert: {
          approved_at?: string
          approved_by?: string
          created_at: string
          id?: string
          schema_json: Json
          status: string
          template_id: string
          tenant_id: string
          version: number
        }
        Update: {
          approved_at?: string
          approved_by?: string
          created_at?: string
          id?: string
          schema_json?: Json
          status?: string
          template_id?: string
          tenant_id?: string
          version?: number
        }
        Relationships: []
      }
      triage_record_versions: {
        Row: {
          created_at: string
          created_by: string
          id: string | null
          payload: Json
          reason: string
          tenant_id: string
          triage_record_id: string
          version: number
        }
        Insert: {
          created_at: string
          created_by: string
          id?: string
          payload: Json
          reason: string
          tenant_id: string
          triage_record_id: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          payload?: Json
          reason?: string
          tenant_id?: string
          triage_record_id?: string
          version?: number
        }
        Relationships: []
      }
      triage_records: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string
          current_version: number
          encounter_id: string
          form_version_id: string
          id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          closed_at?: string
          closed_by?: string
          created_at: string
          created_by: string
          current_version: number
          encounter_id: string
          form_version_id: string
          id?: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          closed_at?: string
          closed_by?: string
          created_at?: string
          created_by?: string
          current_version?: number
          encounter_id?: string
          form_version_id?: string
          id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at: string
          display_name: string
          id?: string
          status: string
          updated_at: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      visual_acuity_result_versions: {
        Row: {
          binocular: Json
          chart_type: string
          correction_reason: string
          created_at: string
          created_by: string
          equipment_name: string
          id: string | null
          left_eye: Json
          observations: string | null
          professional_conclusion: string | null
          right_eye: Json
          tenant_id: string
          test_conditions: Json
          version: number
          visual_acuity_result_id: string
        }
        Insert: {
          binocular: Json
          chart_type: string
          correction_reason: string
          created_at: string
          created_by: string
          equipment_name: string
          id?: string
          left_eye: Json
          observations?: string
          professional_conclusion?: string
          right_eye: Json
          tenant_id: string
          test_conditions: Json
          version: number
          visual_acuity_result_id: string
        }
        Update: {
          binocular?: Json
          chart_type?: string
          correction_reason?: string
          created_at?: string
          created_by?: string
          equipment_name?: string
          id?: string
          left_eye?: Json
          observations?: string
          professional_conclusion?: string
          right_eye?: Json
          tenant_id?: string
          test_conditions?: Json
          version?: number
          visual_acuity_result_id?: string
        }
        Relationships: []
      }
      visual_acuity_results: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          current_version: number
          encounter_id: string
          exam_order_id: string
          id: string | null
          started_at: string
          started_by: string
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string
          completed_by?: string
          created_at: string
          current_version: number
          encounter_id: string
          exam_order_id: string
          id?: string
          started_at: string
          started_by: string
          status?: string
          tenant_id: string
          updated_at: string
        }
        Update: {
          completed_at?: string
          completed_by?: string
          created_at?: string
          current_version?: number
          encounter_id?: string
          exam_order_id?: string
          id?: string
          started_at?: string
          started_by?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          clinic_unit_id: string
          created_at: string
          desired_from: string | null
          id: string | null
          priority: number
          referral_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          clinic_unit_id: string
          created_at: string
          desired_from?: string
          id?: string
          priority: number
          referral_id: string
          status: string
          tenant_id: string
        }
        Update: {
          clinic_unit_id?: string
          created_at?: string
          desired_from?: string
          id?: string
          priority?: number
          referral_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      worker_identifiers: {
        Row: {
          created_at: string
          id: string | null
          identifier_hash: string
          identifier_type: string
          tenant_id: string
          worker_id: string
        }
        Insert: {
          created_at: string
          id?: string
          identifier_hash: string
          identifier_type: string
          tenant_id: string
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier_hash?: string
          identifier_type?: string
          tenant_id?: string
          worker_id?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          cpf_ciphertext: string | null
          cpf_lookup_hash: string | null
          created_at: string
          full_name: string
          id: string | null
          status: string
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          cpf_ciphertext?: string
          cpf_lookup_hash?: string
          created_at: string
          full_name: string
          id?: string
          status: string
          tenant_id: string
          updated_at: string
          version: number
        }
        Update: {
          cpf_ciphertext?: string
          cpf_lookup_hash?: string
          created_at?: string
          full_name?: string
          id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      acknowledge_clinical_alert: {
        Args: {
          audit_request_id: string
          note_value: string
          target_alert_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      append_audit_log: {
        Args: {
          audit_action: string
          audit_entity_id: string
          audit_entity_type: string
          audit_metadata_redacted: Json
          audit_request_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      assign_membership_role: {
        Args: {
          audit_request_id: string
          target_clinic_unit_id: string
          target_membership_id: string
          target_role_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      check_in_appointment: {
        Args: {
          audit_request_id: string
          idempotency_key_value: string
          target_appointment_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      close_medical_consultation: {
        Args: {
          assessment_value: string
          audit_request_id: string
          change_reason: string
          objective_value: Json
          physician_credential_id_value: string
          plan_value: string
          subjective_value: Json
          target_encounter_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      create_billing_from_snapshot: {
        Args: {
          audit_request_id: string
          target_snapshot_id: string
          target_tenant_id: string
        }
        Returns: Json
      }
      create_call_event: {
        Args: {
          audit_request_id: string
          call_action: string
          target_display_panel_id: string
          target_queue_ticket_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      create_clinic_unit: {
        Args: {
          audit_request_id: string
          target_tenant_id: string
          unit_code: string
          unit_name: string
        }
        Returns: string
      }
      create_clinical_alert: {
        Args: {
          audit_request_id: string
          message_value: string
          severity_value: string
          source_type_value: string
          target_encounter_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      create_consultation_addendum: {
        Args: {
          audit_request_id: string
          note_value: string
          reason_value: string
          target_consultation_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      create_encounter_price_snapshot: {
        Args: {
          audit_request_id: string
          content_hash_value: string
          snapshot_payload_value: Json
          target_contract_id: string
          target_encounter_id: string
          target_price_table_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      create_esocial_event: {
        Args: {
          audit_request_id: string
          business_key_value: string
          environment_value: string
          event_type_value: string
          idempotency_key_value: string
          layout_version_id_value: string
          operation_type_value: string
          payload_hash_value: string
          payload_value: Json
          previous_event_id_value: string
          target_tenant_id: string
        }
        Returns: string
      }
      create_exam_catalog_item: {
        Args: {
          audit_request_id: string
          code_value: string
          name_value: string
          result_type_value: string
          target_tenant_id: string
        }
        Returns: string
      }
      create_exam_protocol_override: {
        Args: {
          audit_request_id: string
          override_action: string
          override_justification: string
          target_employment_contract_id: string
          target_exam_catalog_id: string
          target_exam_protocol_id: string
          target_tenant_id: string
          target_worker_id: string
        }
        Returns: string
      }
      create_exam_protocol_package: {
        Args: {
          activate_protocol: boolean
          audit_request_id: string
          items_value: Json
          occupational_exam_type_value: string
          target_pcmso_version_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      create_generated_document_version: {
        Args: {
          audit_request_id: string
          content_hash_value: string
          document_type_value: string
          idempotency_key_value: string
          rectification_reason_value: string
          snapshot_payload_value: Json
          storage_path_value: string
          target_encounter_id: string
          target_template_version_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      create_medical_conclusion: {
        Args: {
          audit_request_id: string
          conclusion_code_value: string
          consultation_id_value: string
          notes_value: string
          physician_credential_id_value: string
          restrictions_value: Json
          target_encounter_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      create_occupational_company: {
        Args: {
          audit_request_id: string
          company_legal_name: string
          company_tax_id: string
          company_trade_name: string
          target_tenant_id: string
        }
        Returns: string
      }
      create_occupational_structure: {
        Args: {
          audit_request_id: string
          company_id_value: string
          establishment_code: string
          establishment_name: string
          exposure_group_code: string
          exposure_group_name: string
          job_code: string
          job_name: string
          risk_code: string
          risk_name: string
          risk_type_value: string
          sector_code: string
          sector_name: string
          starts_on_value: string
          target_tenant_id: string
          worker_id_value: string
        }
        Returns: string
      }
      create_occupational_worker: {
        Args: {
          audit_request_id: string
          target_tenant_id: string
          worker_cpf: string
          worker_full_name: string
        }
        Returns: string
      }
      create_referral_with_protocol: {
        Args: {
          audit_request_id: string
          exam_items_value: Json
          exam_preview_value: Json
          occupational_exam_type_value: string
          target_company_id: string
          target_tenant_id: string
          target_worker_id: string
          valid_until_value: string
        }
        Returns: string
      }
      create_scheduled_appointment: {
        Args: {
          audit_request_id: string
          ends_at_value: string
          preparation_text: string
          starts_at_value: string
          target_clinic_unit_id: string
          target_referral_id: string
          target_resource_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      create_sst_cipa_membership: {
        Args: {
          audit_request_id: string
          mandate_ends_on_value: string
          mandate_starts_on_value: string
          role_label_value: string
          target_company_id: string
          target_tenant_id: string
          target_worker_id: string
        }
        Returns: string
      }
      create_sst_epi_issue: {
        Args: {
          audit_request_id: string
          due_return_on_value: string
          epi_code_value: string
          epi_name_value: string
          issued_at_value: string
          note_redacted_value: string
          target_company_id: string
          target_tenant_id: string
          target_worker_id: string
        }
        Returns: string
      }
      create_sst_incident: {
        Args: {
          audit_request_id: string
          description_redacted_value: string
          incident_type_value: string
          occurred_at_value: string
          severity_value: string
          target_company_id: string
          target_tenant_id: string
          target_worker_id: string
        }
        Returns: string
      }
      enqueue_integration_job: {
        Args: {
          audit_request_id: string
          idempotency_key_value: string
          job_type_value: string
          payload_redacted_value: Json
          target_connection_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      enqueue_message: {
        Args: {
          audit_request_id: string
          channel_value: string
          connection_id_value: string
          destination_hash_value: string
          idempotency_key_value: string
          payload_redacted_value: Json
          recipient_reference_value: string
          recipient_type_value: string
          target_tenant_id: string
          template_version_id_value: string
        }
        Returns: string
      }
      enrich_triage_payload: {
        Args: {
          payload_value: Json
        }
        Returns: Json
      }
      get_company_portal_overview: {
        Args: {
          target_company_id: string
          target_tenant_id: string
        }
        Returns: Json
      }
      get_my_authorization_context: {
        Args: {
          target_tenant_id: string
        }
        Returns: Json
      }
      has_company_permission: {
        Args: {
          permission_code: string
          target_company_id: string
        }
        Returns: boolean
      }
      has_document_permission: {
        Args: {
          permission_code: string
          target_document_id: string
        }
        Returns: boolean
      }
      has_encounter_permission: {
        Args: {
          permission_code: string
          target_encounter_id: string
        }
        Returns: boolean
      }
      has_professional_permission: {
        Args: {
          permission_code: string
          target_professional_id: string
        }
        Returns: boolean
      }
      has_tenant_or_any_unit_permission: {
        Args: {
          permission_code: string
          target_tenant_id: string
        }
        Returns: boolean
      }
      has_tenant_permission: {
        Args: {
          permission_code: string
          target_tenant_id: string
        }
        Returns: boolean
      }
      has_unit_permission: {
        Args: {
          permission_code: string
          target_unit_id: string
        }
        Returns: boolean
      }
      is_aal2: {
        Args: {
          [_: string]: never
        }
        Returns: boolean
      }
      is_active_tenant_member: {
        Args: {
          target_tenant_id: string
        }
        Returns: boolean
      }
      is_company_portal_member: {
        Args: {
          target_company_id: string
        }
        Returns: boolean
      }
      issue_invoice: {
        Args: {
          audit_request_id: string
          billing_item_ids: string[]
          due_on_value: string
          target_company_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      log_audit: {
        Args: {
          audit_action: string
          audit_entity_id: string
          audit_entity_type: string
          audit_metadata_redacted: Json
          audit_request_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      log_document_access: {
        Args: {
          access_type_value: string
          audit_request_id: string
          expires_at_value: string
          target_document_version_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      log_sensitive_read: {
        Args: {
          access_result: string
          audit_action: string
          audit_entity_id: string
          audit_entity_type: string
          audit_request_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      mark_integration_attempt: {
        Args: {
          audit_request_id: string
          error_redacted: string
          succeeded: boolean
          target_job_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      pause_encounter_flow: {
        Args: {
          audit_request_id: string
          reason_value: string
          target_encounter_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      provision_tenant_for_user: {
        Args: {
          target_user_id: string
          tenant_legal_name: string
          tenant_trade_name: string
        }
        Returns: string
      }
      publish_pcmso_version: {
        Args: {
          audit_request_id: string
          company_id_value: string
          program_code: string
          program_name: string
          target_tenant_id: string
          valid_from_value: string
          valid_until_value: string
          version_number_value: number
        }
        Returns: string
      }
      record_connector_event: {
        Args: {
          audit_request_id: string
          event_type_value: string
          idempotency_key_value: string
          payload_redacted_value: Json
          target_connector_id: string
          target_equipment_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      record_esocial_rejection: {
        Args: {
          audit_request_id: string
          code_value: string
          message_value: string
          payload_redacted_value: Json
          target_event_id: string
          target_submission_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      record_invoice_payment: {
        Args: {
          amount_cents_value: number
          audit_request_id: string
          method_value: string
          paid_at_value: string
          reference_value: string
          target_invoice_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      record_laboratory_sample_event: {
        Args: {
          audit_request_id: string
          event_type_value: string
          payload_value: Json
          target_sample_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      register_connector_spool_file: {
        Args: {
          audit_request_id: string
          content_hash_value: string
          file_name_value: string
          monitored_folder_value: string
          payload_redacted_value: Json
          target_connector_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      reject_approved_pcmso_version_mutation: {
        Args: {
          [_: string]: never
        }
        Returns: Json
      }
      reject_audit_mutation: {
        Args: {
          [_: string]: never
        }
        Returns: Json
      }
      reject_document_version_mutation: {
        Args: {
          [_: string]: never
        }
        Returns: Json
      }
      reject_encounter_price_snapshot_mutation: {
        Args: {
          [_: string]: never
        }
        Returns: Json
      }
      reject_snapshot_mutation: {
        Args: {
          [_: string]: never
        }
        Returns: Json
      }
      requeue_integration_dead_letter: {
        Args: {
          audit_request_id: string
          target_dead_letter_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      resolve_encounter_flow_pause: {
        Args: {
          audit_request_id: string
          resolved_note_value: string
          target_pause_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      revoke_membership_role: {
        Args: {
          audit_request_id: string
          target_membership_role_id: string
          target_tenant_id: string
        }
        Returns: undefined
      }
      save_audiometry_result: {
        Args: {
          audit_request_id: string
          booth_value: Json
          calibration_id_value: string
          comparison_value: Json
          complaints_value: Json
          complete_result: boolean
          correction_reason_value: string
          equipment_value: Json
          inconclusive_result: boolean
          masking_value: Json
          normalized_payload_value: Json
          occupational_data_value: Json
          original_import_payload_value: Json
          otoscopy_value: Json
          professional_conclusion_value: string
          report_value: string
          rest_reported_value: Json
          target_result_id: string
          target_tenant_id: string
          thresholds_value: Json
        }
        Returns: string
      }
      save_diagnostic_exam_result: {
        Args: {
          audit_request_id: string
          correction_reason_value: string
          equipment_value: Json
          execution_value: Json
          external_result_validation_value: Json
          image_or_pdf_refs_value: Json
          modality_value: string
          preparation_value: Json
          professional_conclusion_value: string
          raw_file_refs_value: Json
          report_value: string
          status_value: string
          target_exam_order_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      save_laboratory_result: {
        Args: {
          audit_request_id: string
          correction_reason: string
          critical_flag_value: boolean
          reference_range_snapshot_value: Json
          result_payload_value: Json
          status_value: string
          target_order_item_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      save_medical_consultation: {
        Args: {
          assessment_value: string
          audit_request_id: string
          change_reason: string
          close_record: boolean
          objective_value: Json
          physician_credential_id_value: string
          plan_value: string
          subjective_value: Json
          target_encounter_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      save_spirometry_maneuver: {
        Args: {
          accept_maneuver: boolean
          attempt_number_value: number
          audit_request_id: string
          bronchodilator_value: Json
          calibration_id_value: string
          complete_result: boolean
          correction_reason_value: string
          curve_attachment_refs_value: Json
          inconclusive_reason_value: string
          inconclusive_result: boolean
          measured_values_value: Json
          percentages_value: Json
          predicted_value_set_id_value: string
          predicted_values_value: Json
          professional_conclusion_value: string
          quality_grade_value: string
          required_inputs_value: Json
          target_result_id: string
          target_tenant_id: string
          technical_notes_value: string
        }
        Returns: string
      }
      save_triage_record: {
        Args: {
          audit_request_id: string
          change_reason: string
          close_record: boolean
          payload_value: Json
          target_encounter_id: string
          target_form_version_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      save_visual_acuity_result: {
        Args: {
          audit_request_id: string
          binocular_value: Json
          chart_type_value: string
          complete_result: boolean
          correction_reason_value: string
          equipment_name_value: string
          left_eye_value: Json
          observations_value: string
          professional_conclusion_value: string
          right_eye_value: Json
          target_result_id: string
          target_tenant_id: string
          test_conditions_value: Json
        }
        Returns: string
      }
      set_membership_status: {
        Args: {
          audit_request_id: string
          new_status: string
          target_membership_id: string
          target_tenant_id: string
        }
        Returns: undefined
      }
      sign_document_version: {
        Args: {
          aal_value: string
          audit_request_id: string
          ip_value: string
          method_value: string
          signed_hash_value: string
          target_document_version_id: string
          target_tenant_id: string
          user_agent_value: string
        }
        Returns: string
      }
      start_audiometry_exam: {
        Args: {
          audit_request_id: string
          target_exam_order_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      start_spirometry_exam: {
        Args: {
          audit_request_id: string
          target_exam_order_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      start_visual_acuity_exam: {
        Args: {
          audit_request_id: string
          target_exam_order_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      upsert_company_document_release_rule: {
        Args: {
          audit_request_id: string
          document_type_value: string
          redaction_profile_value: string
          release_to_company_value: boolean
          target_company_id: string
          target_tenant_id: string
        }
        Returns: string
      }
      upsert_company_portal_user: {
        Args: {
          audit_request_id: string
          scopes_value: Json
          status_value: string
          target_company_id: string
          target_tenant_id: string
          target_user_id: string
        }
        Returns: string
      }
      upsert_schedule_resource: {
        Args: {
          audit_request_id: string
          code_value: string
          name_value: string
          resource_type_value: string
          target_clinic_unit_id: string
          target_tenant_id: string
        }
        Returns: string
      }
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
