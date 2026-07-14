export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      appointment_events: {
        Row: {
          appointment_id: string;
          created_at: string;
          created_by: string;
          event_type: string;
          id: string;
          payload: Json;
          tenant_id: string;
        };
        Insert: {
          appointment_id: string;
          created_at?: string;
          created_by: string;
          event_type: string;
          id?: string;
          payload?: Json;
          tenant_id: string;
        };
        Update: {
          appointment_id?: string;
          created_at?: string;
          created_by?: string;
          event_type?: string;
          id?: string;
          payload?: Json;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_events_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          clinic_unit_id: string;
          created_at: string;
          ends_at: string;
          id: string;
          preparation_instructions: string | null;
          referral_id: string | null;
          resource_id: string;
          starts_at: string;
          status: string;
          tenant_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          clinic_unit_id: string;
          created_at?: string;
          ends_at: string;
          id?: string;
          preparation_instructions?: string | null;
          referral_id?: string | null;
          resource_id: string;
          starts_at: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          clinic_unit_id?: string;
          created_at?: string;
          ends_at?: string;
          id?: string;
          preparation_instructions?: string | null;
          referral_id?: string | null;
          resource_id?: string;
          starts_at?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_unit_id_fkey";
            columns: ["clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_clinic_unit_tenant_fk";
            columns: ["tenant_id", "clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "appointments_referral_id_fkey";
            columns: ["referral_id"];
            isOneToOne: false;
            referencedRelation: "referrals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_referral_tenant_fk";
            columns: ["tenant_id", "referral_id"];
            isOneToOne: false;
            referencedRelation: "referrals";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "appointments_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "schedule_resources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_resource_tenant_fk";
            columns: ["tenant_id", "resource_id"];
            isOneToOne: false;
            referencedRelation: "schedule_resources";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      audiometry_calibrations: {
        Row: {
          calibrated_at: string;
          certificate_reference: string | null;
          created_at: string;
          equipment_name: string;
          equipment_serial: string;
          id: string;
          status: string;
          tenant_id: string;
          valid_until: string;
        };
        Insert: {
          calibrated_at: string;
          certificate_reference?: string | null;
          created_at?: string;
          equipment_name: string;
          equipment_serial: string;
          id?: string;
          status?: string;
          tenant_id: string;
          valid_until: string;
        };
        Update: {
          calibrated_at?: string;
          certificate_reference?: string | null;
          created_at?: string;
          equipment_name?: string;
          equipment_serial?: string;
          id?: string;
          status?: string;
          tenant_id?: string;
          valid_until?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audiometry_calibrations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      audiometry_result_versions: {
        Row: {
          audiometry_result_id: string;
          booth: Json;
          comparison: Json;
          complaints: Json;
          correction_reason: string;
          created_at: string;
          created_by: string;
          equipment: Json;
          id: string;
          masking: Json;
          normalized_payload: Json;
          occupational_data: Json;
          original_import_payload: Json | null;
          otoscopy: Json;
          professional_conclusion: string;
          report: string | null;
          rest_reported: Json;
          tenant_id: string;
          thresholds: Json;
          version: number;
        };
        Insert: {
          audiometry_result_id: string;
          booth: Json;
          comparison?: Json;
          complaints?: Json;
          correction_reason: string;
          created_at?: string;
          created_by: string;
          equipment: Json;
          id?: string;
          masking?: Json;
          normalized_payload?: Json;
          occupational_data: Json;
          original_import_payload?: Json | null;
          otoscopy?: Json;
          professional_conclusion: string;
          report?: string | null;
          rest_reported: Json;
          tenant_id: string;
          thresholds: Json;
          version: number;
        };
        Update: {
          audiometry_result_id?: string;
          booth?: Json;
          comparison?: Json;
          complaints?: Json;
          correction_reason?: string;
          created_at?: string;
          created_by?: string;
          equipment?: Json;
          id?: string;
          masking?: Json;
          normalized_payload?: Json;
          occupational_data?: Json;
          original_import_payload?: Json | null;
          otoscopy?: Json;
          professional_conclusion?: string;
          report?: string | null;
          rest_reported?: Json;
          tenant_id?: string;
          thresholds?: Json;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "audiometry_result_versions_audiometry_result_id_fkey";
            columns: ["audiometry_result_id"];
            isOneToOne: false;
            referencedRelation: "audiometry_results";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audiometry_result_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audiometry_result_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      audiometry_results: {
        Row: {
          calibration_id: string | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          current_version: number;
          encounter_id: string;
          exam_order_id: string;
          id: string;
          started_at: string;
          started_by: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          calibration_id?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          current_version?: number;
          encounter_id: string;
          exam_order_id: string;
          id?: string;
          started_at?: string;
          started_by: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          calibration_id?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          current_version?: number;
          encounter_id?: string;
          exam_order_id?: string;
          id?: string;
          started_at?: string;
          started_by?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audiometry_results_calibration_id_fkey";
            columns: ["calibration_id"];
            isOneToOne: false;
            referencedRelation: "audiometry_calibrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audiometry_results_completed_by_fkey";
            columns: ["completed_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audiometry_results_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audiometry_results_exam_order_id_fkey";
            columns: ["exam_order_id"];
            isOneToOne: false;
            referencedRelation: "exam_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audiometry_results_started_by_fkey";
            columns: ["started_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audiometry_results_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata_redacted: Json;
          request_id: string;
          tenant_id: string | null;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata_redacted?: Json;
          request_id: string;
          tenant_id?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata_redacted?: Json;
          request_id?: string;
          tenant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_adjustments: {
        Row: {
          adjustment_type: string;
          amount_cents: number;
          billing_item_id: string;
          created_at: string;
          created_by: string;
          id: string;
          justification: string;
          tenant_id: string;
        };
        Insert: {
          adjustment_type: string;
          amount_cents: number;
          billing_item_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          justification: string;
          tenant_id: string;
        };
        Update: {
          adjustment_type?: string;
          amount_cents?: number;
          billing_item_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          justification?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_adjustments_billing_item_id_fkey";
            columns: ["billing_item_id"];
            isOneToOne: false;
            referencedRelation: "billing_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_adjustments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_adjustments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_denials: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          invoice_item_id: string;
          reason: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          invoice_item_id: string;
          reason: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          invoice_item_id?: string;
          reason?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_denials_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_denials_invoice_item_id_fkey";
            columns: ["invoice_item_id"];
            isOneToOne: false;
            referencedRelation: "invoice_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_denials_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_items: {
        Row: {
          amount_cents: number;
          billable: boolean;
          company_id: string;
          created_at: string;
          description: string;
          encounter_id: string | null;
          id: string;
          non_billable_reason: string | null;
          price_snapshot: Json;
          quote_item_id: string | null;
          status: string;
          tenant_id: string;
        };
        Insert: {
          amount_cents: number;
          billable?: boolean;
          company_id: string;
          created_at?: string;
          description: string;
          encounter_id?: string | null;
          id?: string;
          non_billable_reason?: string | null;
          price_snapshot?: Json;
          quote_item_id?: string | null;
          status?: string;
          tenant_id: string;
        };
        Update: {
          amount_cents?: number;
          billable?: boolean;
          company_id?: string;
          created_at?: string;
          description?: string;
          encounter_id?: string | null;
          id?: string;
          non_billable_reason?: string | null;
          price_snapshot?: Json;
          quote_item_id?: string | null;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_items_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_items_company_tenant_fk";
            columns: ["tenant_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "billing_items_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_items_encounter_tenant_fk";
            columns: ["tenant_id", "encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "billing_items_quote_item_id_fkey";
            columns: ["quote_item_id"];
            isOneToOne: false;
            referencedRelation: "quote_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_items_quote_item_tenant_fk";
            columns: ["tenant_id", "quote_item_id"];
            isOneToOne: false;
            referencedRelation: "quote_items";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "billing_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      call_deliveries: {
        Row: {
          acknowledged_at: string | null;
          call_event_id: string;
          created_at: string;
          delivered_at: string | null;
          display_panel_session_id: string | null;
          id: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          call_event_id: string;
          created_at?: string;
          delivered_at?: string | null;
          display_panel_session_id?: string | null;
          id?: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          call_event_id?: string;
          created_at?: string;
          delivered_at?: string | null;
          display_panel_session_id?: string | null;
          id?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_deliveries_call_event_id_fkey";
            columns: ["call_event_id"];
            isOneToOne: false;
            referencedRelation: "call_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_deliveries_display_panel_session_id_fkey";
            columns: ["display_panel_session_id"];
            isOneToOne: false;
            referencedRelation: "display_panel_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_deliveries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      call_events: {
        Row: {
          action: string;
          clinic_unit_id: string;
          created_at: string;
          created_by: string;
          display_panel_id: string | null;
          encounter_id: string;
          id: string;
          payload_public: Json;
          queue_ticket_id: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          action: string;
          clinic_unit_id: string;
          created_at?: string;
          created_by: string;
          display_panel_id?: string | null;
          encounter_id: string;
          id?: string;
          payload_public?: Json;
          queue_ticket_id: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          action?: string;
          clinic_unit_id?: string;
          created_at?: string;
          created_by?: string;
          display_panel_id?: string | null;
          encounter_id?: string;
          id?: string;
          payload_public?: Json;
          queue_ticket_id?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_events_clinic_unit_id_fkey";
            columns: ["clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_events_display_panel_id_fkey";
            columns: ["display_panel_id"];
            isOneToOne: false;
            referencedRelation: "display_panels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_events_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_events_queue_ticket_id_fkey";
            columns: ["queue_ticket_id"];
            isOneToOne: false;
            referencedRelation: "queue_tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      clinic_units: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          name: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinic_units_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      clinical_alert_acknowledgements: {
        Row: {
          acknowledged_by: string;
          alert_id: string;
          created_at: string;
          id: string;
          note: string | null;
          tenant_id: string;
        };
        Insert: {
          acknowledged_by: string;
          alert_id: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          tenant_id: string;
        };
        Update: {
          acknowledged_by?: string;
          alert_id?: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinical_alert_acknowledgements_acknowledged_by_fkey";
            columns: ["acknowledged_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clinical_alert_acknowledgements_alert_id_fkey";
            columns: ["alert_id"];
            isOneToOne: false;
            referencedRelation: "clinical_alerts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clinical_alert_acknowledgements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      clinical_alerts: {
        Row: {
          created_at: string;
          created_by: string;
          encounter_id: string;
          id: string;
          message: string;
          severity: string;
          source_type: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          encounter_id: string;
          id?: string;
          message: string;
          severity: string;
          source_type: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          encounter_id?: string;
          id?: string;
          message?: string;
          severity?: string;
          source_type?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinical_alerts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clinical_alerts_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clinical_alerts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      clinical_professional_credentials: {
        Row: {
          clinic_unit_id: string | null;
          council_code: string | null;
          council_region: string | null;
          created_at: string;
          id: string;
          professional_role: string;
          registration_number: string | null;
          status: string;
          tenant_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          clinic_unit_id?: string | null;
          council_code?: string | null;
          council_region?: string | null;
          created_at?: string;
          id?: string;
          professional_role: string;
          registration_number?: string | null;
          status?: string;
          tenant_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          clinic_unit_id?: string | null;
          council_code?: string | null;
          council_region?: string | null;
          created_at?: string;
          id?: string;
          professional_role?: string;
          registration_number?: string | null;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinical_professional_credentials_clinic_unit_id_fkey";
            columns: ["clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clinical_professional_credentials_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clinical_professional_credentials_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      commercial_contracts: {
        Row: {
          billing_rules: Json;
          code: string;
          company_id: string;
          created_at: string;
          ends_on: string | null;
          id: string;
          name: string;
          starts_on: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          billing_rules?: Json;
          code: string;
          company_id: string;
          created_at?: string;
          ends_on?: string | null;
          id?: string;
          name: string;
          starts_on: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          billing_rules?: Json;
          code?: string;
          company_id?: string;
          created_at?: string;
          ends_on?: string | null;
          id?: string;
          name?: string;
          starts_on?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commercial_contracts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_contracts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      commercial_price_items: {
        Row: {
          billable_code: string;
          created_at: string;
          currency: string;
          description: string;
          id: string;
          price_table_id: string;
          technical_repeat_billable: boolean;
          tenant_id: string;
          unit_price_cents: number;
        };
        Insert: {
          billable_code: string;
          created_at?: string;
          currency?: string;
          description: string;
          id?: string;
          price_table_id: string;
          technical_repeat_billable?: boolean;
          tenant_id: string;
          unit_price_cents: number;
        };
        Update: {
          billable_code?: string;
          created_at?: string;
          currency?: string;
          description?: string;
          id?: string;
          price_table_id?: string;
          technical_repeat_billable?: boolean;
          tenant_id?: string;
          unit_price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "commercial_price_items_price_table_id_fkey";
            columns: ["price_table_id"];
            isOneToOne: false;
            referencedRelation: "commercial_price_tables";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_price_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      commercial_price_tables: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          contract_id: string;
          created_at: string;
          effective_from: string;
          effective_until: string | null;
          id: string;
          status: string;
          tenant_id: string;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          contract_id: string;
          created_at?: string;
          effective_from: string;
          effective_until?: string | null;
          id?: string;
          status?: string;
          tenant_id: string;
          version: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          contract_id?: string;
          created_at?: string;
          effective_from?: string;
          effective_until?: string | null;
          id?: string;
          status?: string;
          tenant_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "commercial_price_tables_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_price_tables_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "commercial_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commercial_price_tables_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          created_at: string;
          id: string;
          legal_name: string;
          status: string;
          tax_id_normalized: string;
          tenant_id: string;
          trade_name: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          legal_name: string;
          status?: string;
          tax_id_normalized: string;
          tenant_id: string;
          trade_name?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          legal_name?: string;
          status?: string;
          tax_id_normalized?: string;
          tenant_id?: string;
          trade_name?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "companies_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      company_contacts: {
        Row: {
          company_id: string;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
          role_name: string | null;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          role_name?: string | null;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          role_name?: string | null;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_contacts_company_tenant_fk";
            columns: ["tenant_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "company_contacts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      company_document_release_rules: {
        Row: {
          company_id: string;
          created_at: string;
          document_type: string;
          id: string;
          redaction_profile: string;
          release_to_company: boolean;
          tenant_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          document_type: string;
          id?: string;
          redaction_profile?: string;
          release_to_company?: boolean;
          tenant_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          document_type?: string;
          id?: string;
          redaction_profile?: string;
          release_to_company?: boolean;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_document_release_rules_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_document_release_rules_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      company_establishments: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          status: string;
          tax_id_normalized: string | null;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          status?: string;
          tax_id_normalized?: string | null;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          status?: string;
          tax_id_normalized?: string | null;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_establishments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_establishments_company_tenant_fk";
            columns: ["tenant_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "company_establishments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      company_portal_users: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          scopes: Json;
          status: string;
          tenant_id: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          scopes?: Json;
          status?: string;
          tenant_id: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          scopes?: Json;
          status?: string;
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_portal_users_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_portal_users_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_portal_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      diagnostic_exam_result_versions: {
        Row: {
          correction_reason: string;
          created_at: string;
          created_by: string;
          diagnostic_exam_result_id: string;
          equipment: Json;
          execution: Json;
          external_result_validation: Json;
          id: string;
          image_or_pdf_refs: Json;
          preparation: Json;
          professional_conclusion: string | null;
          raw_file_refs: Json;
          report: string | null;
          tenant_id: string;
          version: number;
        };
        Insert: {
          correction_reason: string;
          created_at?: string;
          created_by: string;
          diagnostic_exam_result_id: string;
          equipment?: Json;
          execution?: Json;
          external_result_validation?: Json;
          id?: string;
          image_or_pdf_refs?: Json;
          preparation?: Json;
          professional_conclusion?: string | null;
          raw_file_refs?: Json;
          report?: string | null;
          tenant_id: string;
          version: number;
        };
        Update: {
          correction_reason?: string;
          created_at?: string;
          created_by?: string;
          diagnostic_exam_result_id?: string;
          equipment?: Json;
          execution?: Json;
          external_result_validation?: Json;
          id?: string;
          image_or_pdf_refs?: Json;
          preparation?: Json;
          professional_conclusion?: string | null;
          raw_file_refs?: Json;
          report?: string | null;
          tenant_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "diagnostic_exam_result_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diagnostic_exam_result_versions_diagnostic_exam_result_id_fkey";
            columns: ["diagnostic_exam_result_id"];
            isOneToOne: false;
            referencedRelation: "diagnostic_exam_results";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diagnostic_exam_result_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      diagnostic_exam_results: {
        Row: {
          created_at: string;
          created_by: string;
          current_version: number;
          encounter_id: string;
          exam_order_id: string;
          executed_at: string | null;
          executor_user_id: string | null;
          id: string;
          modality: string;
          prepared_at: string | null;
          reported_at: string | null;
          requested_at: string;
          reviewer_user_id: string | null;
          status: string;
          tenant_id: string;
          updated_at: string;
          validated_at: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          current_version?: number;
          encounter_id: string;
          exam_order_id: string;
          executed_at?: string | null;
          executor_user_id?: string | null;
          id?: string;
          modality: string;
          prepared_at?: string | null;
          reported_at?: string | null;
          requested_at?: string;
          reviewer_user_id?: string | null;
          status?: string;
          tenant_id: string;
          updated_at?: string;
          validated_at?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          current_version?: number;
          encounter_id?: string;
          exam_order_id?: string;
          executed_at?: string | null;
          executor_user_id?: string | null;
          id?: string;
          modality?: string;
          prepared_at?: string | null;
          reported_at?: string | null;
          requested_at?: string;
          reviewer_user_id?: string | null;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
          validated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "diagnostic_exam_results_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diagnostic_exam_results_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diagnostic_exam_results_exam_order_id_fkey";
            columns: ["exam_order_id"];
            isOneToOne: false;
            referencedRelation: "exam_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diagnostic_exam_results_executor_user_id_fkey";
            columns: ["executor_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diagnostic_exam_results_reviewer_user_id_fkey";
            columns: ["reviewer_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diagnostic_exam_results_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      display_panel_sessions: {
        Row: {
          created_at: string;
          device_label: string;
          display_panel_id: string;
          id: string;
          last_heartbeat_at: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          device_label: string;
          display_panel_id: string;
          id?: string;
          last_heartbeat_at?: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          device_label?: string;
          display_panel_id?: string;
          id?: string;
          last_heartbeat_at?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "display_panel_sessions_display_panel_id_fkey";
            columns: ["display_panel_id"];
            isOneToOne: false;
            referencedRelation: "display_panels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "display_panel_sessions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      display_panels: {
        Row: {
          channel_name: string;
          clinic_unit_id: string;
          code: string;
          created_at: string;
          id: string;
          name: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          channel_name: string;
          clinic_unit_id: string;
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          channel_name?: string;
          clinic_unit_id?: string;
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "display_panels_clinic_unit_id_fkey";
            columns: ["clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "display_panels_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      document_access_logs: {
        Row: {
          access_type: string;
          actor_user_id: string | null;
          created_at: string;
          document_version_id: string;
          expires_at: string | null;
          id: string;
          request_id: string;
          tenant_id: string;
        };
        Insert: {
          access_type: string;
          actor_user_id?: string | null;
          created_at?: string;
          document_version_id: string;
          expires_at?: string | null;
          id?: string;
          request_id: string;
          tenant_id: string;
        };
        Update: {
          access_type?: string;
          actor_user_id?: string | null;
          created_at?: string;
          document_version_id?: string;
          expires_at?: string | null;
          id?: string;
          request_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_access_logs_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_access_logs_document_version_id_fkey";
            columns: ["document_version_id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_access_logs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      document_deliveries: {
        Row: {
          created_at: string;
          created_by: string;
          document_version_id: string;
          id: string;
          recipient_reference: string | null;
          recipient_type: string;
          release_matrix_snapshot: Json;
          status: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          document_version_id: string;
          id?: string;
          recipient_reference?: string | null;
          recipient_type: string;
          release_matrix_snapshot?: Json;
          status?: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          document_version_id?: string;
          id?: string;
          recipient_reference?: string | null;
          recipient_type?: string;
          release_matrix_snapshot?: Json;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_deliveries_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_deliveries_document_version_id_fkey";
            columns: ["document_version_id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_deliveries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      document_signatures: {
        Row: {
          aal: string;
          document_version_id: string;
          id: string;
          ip_address: unknown;
          method: string;
          signed_at: string;
          signed_hash: string;
          signer_user_id: string;
          tenant_id: string;
          user_agent: string | null;
        };
        Insert: {
          aal: string;
          document_version_id: string;
          id?: string;
          ip_address?: unknown;
          method: string;
          signed_at?: string;
          signed_hash: string;
          signer_user_id: string;
          tenant_id: string;
          user_agent?: string | null;
        };
        Update: {
          aal?: string;
          document_version_id?: string;
          id?: string;
          ip_address?: unknown;
          method?: string;
          signed_at?: string;
          signed_hash?: string;
          signer_user_id?: string;
          tenant_id?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "document_signatures_document_version_id_fkey";
            columns: ["document_version_id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_signatures_signer_user_id_fkey";
            columns: ["signer_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_signatures_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      document_template_versions: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          id: string;
          layout_payload: Json;
          preview_fixture: Json;
          status: string;
          template_id: string;
          tenant_id: string;
          variable_schema: Json;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          id?: string;
          layout_payload: Json;
          preview_fixture?: Json;
          status?: string;
          template_id: string;
          tenant_id: string;
          variable_schema?: Json;
          version: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          id?: string;
          layout_payload?: Json;
          preview_fixture?: Json;
          status?: string;
          template_id?: string;
          tenant_id?: string;
          variable_schema?: Json;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "document_template_versions_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_template_versions_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "document_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_template_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      document_templates: {
        Row: {
          code: string;
          created_at: string;
          document_type: string;
          id: string;
          name: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          document_type: string;
          id?: string;
          name: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          document_type?: string;
          id?: string;
          name?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_templates_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      document_versions: {
        Row: {
          content_hash: string;
          created_at: string;
          created_by: string;
          generated_document_id: string;
          id: string;
          print_config: Json;
          rectification_reason: string | null;
          render_status: string;
          snapshot_payload: Json;
          storage_bucket: string;
          storage_path: string;
          tenant_id: string;
          version: number;
        };
        Insert: {
          content_hash: string;
          created_at?: string;
          created_by: string;
          generated_document_id: string;
          id?: string;
          print_config?: Json;
          rectification_reason?: string | null;
          render_status?: string;
          snapshot_payload: Json;
          storage_bucket?: string;
          storage_path: string;
          tenant_id: string;
          version: number;
        };
        Update: {
          content_hash?: string;
          created_at?: string;
          created_by?: string;
          generated_document_id?: string;
          id?: string;
          print_config?: Json;
          rectification_reason?: string | null;
          render_status?: string;
          snapshot_payload?: Json;
          storage_bucket?: string;
          storage_path?: string;
          tenant_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "document_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_versions_generated_document_id_fkey";
            columns: ["generated_document_id"];
            isOneToOne: false;
            referencedRelation: "generated_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      employment_contract_history: {
        Row: {
          created_at: string;
          employment_contract_id: string;
          event_type: string;
          id: string;
          payload: Json;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          employment_contract_id: string;
          event_type: string;
          id?: string;
          payload?: Json;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          employment_contract_id?: string;
          event_type?: string;
          id?: string;
          payload?: Json;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employment_contract_history_employment_contract_id_fkey";
            columns: ["employment_contract_id"];
            isOneToOne: false;
            referencedRelation: "employment_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employment_contract_history_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      employment_contracts: {
        Row: {
          company_id: string;
          created_at: string;
          ends_on: string | null;
          exposure_group_id: string | null;
          id: string;
          job_position_id: string | null;
          sector_id: string | null;
          starts_on: string;
          status: string;
          tenant_id: string;
          updated_at: string;
          version: number;
          worker_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          ends_on?: string | null;
          exposure_group_id?: string | null;
          id?: string;
          job_position_id?: string | null;
          sector_id?: string | null;
          starts_on: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
          version?: number;
          worker_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          ends_on?: string | null;
          exposure_group_id?: string | null;
          id?: string;
          job_position_id?: string | null;
          sector_id?: string | null;
          starts_on?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
          version?: number;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employment_contracts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employment_contracts_company_tenant_fk";
            columns: ["tenant_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "employment_contracts_exposure_group_id_fkey";
            columns: ["exposure_group_id"];
            isOneToOne: false;
            referencedRelation: "exposure_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employment_contracts_exposure_group_tenant_fk";
            columns: ["tenant_id", "exposure_group_id"];
            isOneToOne: false;
            referencedRelation: "exposure_groups";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "employment_contracts_job_position_id_fkey";
            columns: ["job_position_id"];
            isOneToOne: false;
            referencedRelation: "job_positions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employment_contracts_job_position_tenant_fk";
            columns: ["tenant_id", "job_position_id"];
            isOneToOne: false;
            referencedRelation: "job_positions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "employment_contracts_sector_id_fkey";
            columns: ["sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employment_contracts_sector_tenant_fk";
            columns: ["tenant_id", "sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "employment_contracts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employment_contracts_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employment_contracts_worker_tenant_fk";
            columns: ["tenant_id", "worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      encounter_events: {
        Row: {
          created_at: string;
          created_by: string;
          encounter_id: string;
          event_type: string;
          id: string;
          payload: Json;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          encounter_id: string;
          event_type: string;
          id?: string;
          payload?: Json;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          encounter_id?: string;
          event_type?: string;
          id?: string;
          payload?: Json;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "encounter_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounter_events_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounter_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      encounter_flow_pauses: {
        Row: {
          created_at: string;
          created_by: string;
          encounter_id: string;
          id: string;
          reason: string;
          resolved_at: string | null;
          resolved_by: string | null;
          resolved_note: string | null;
          status: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          encounter_id: string;
          id?: string;
          reason: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resolved_note?: string | null;
          status?: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          encounter_id?: string;
          id?: string;
          reason?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resolved_note?: string | null;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "encounter_flow_pauses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounter_flow_pauses_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounter_flow_pauses_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounter_flow_pauses_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      encounter_price_snapshots: {
        Row: {
          content_hash: string;
          contract_id: string;
          created_at: string;
          created_by: string;
          encounter_id: string;
          id: string;
          price_table_id: string;
          snapshot_payload: Json;
          tenant_id: string;
        };
        Insert: {
          content_hash: string;
          contract_id: string;
          created_at?: string;
          created_by: string;
          encounter_id: string;
          id?: string;
          price_table_id: string;
          snapshot_payload: Json;
          tenant_id: string;
        };
        Update: {
          content_hash?: string;
          contract_id?: string;
          created_at?: string;
          created_by?: string;
          encounter_id?: string;
          id?: string;
          price_table_id?: string;
          snapshot_payload?: Json;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "encounter_price_snapshots_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "commercial_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounter_price_snapshots_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounter_price_snapshots_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounter_price_snapshots_price_table_id_fkey";
            columns: ["price_table_id"];
            isOneToOne: false;
            referencedRelation: "commercial_price_tables";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounter_price_snapshots_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      encounter_snapshots: {
        Row: {
          content_hash: string;
          created_at: string;
          encounter_id: string;
          id: string;
          payload: Json;
          schema_version: number;
          tenant_id: string;
        };
        Insert: {
          content_hash: string;
          created_at?: string;
          encounter_id: string;
          id?: string;
          payload: Json;
          schema_version: number;
          tenant_id: string;
        };
        Update: {
          content_hash?: string;
          created_at?: string;
          encounter_id?: string;
          id?: string;
          payload?: Json;
          schema_version?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "encounter_snapshots_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: true;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounter_snapshots_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      encounter_steps: {
        Row: {
          created_at: string;
          depends_on_step_id: string | null;
          encounter_id: string;
          id: string;
          sequence: number;
          status: string;
          step_type: string;
          tenant_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          depends_on_step_id?: string | null;
          encounter_id: string;
          id?: string;
          sequence: number;
          status?: string;
          step_type: string;
          tenant_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          depends_on_step_id?: string | null;
          encounter_id?: string;
          id?: string;
          sequence?: number;
          status?: string;
          step_type?: string;
          tenant_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "encounter_steps_depends_on_step_id_fkey";
            columns: ["depends_on_step_id"];
            isOneToOne: false;
            referencedRelation: "encounter_steps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounter_steps_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounter_steps_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      encounters: {
        Row: {
          appointment_id: string | null;
          checked_in_at: string;
          clinic_unit_id: string;
          created_at: string;
          id: string;
          referral_id: string | null;
          status: string;
          tenant_id: string;
          updated_at: string;
          version: number;
          worker_id: string;
        };
        Insert: {
          appointment_id?: string | null;
          checked_in_at?: string;
          clinic_unit_id: string;
          created_at?: string;
          id?: string;
          referral_id?: string | null;
          status?: string;
          tenant_id: string;
          updated_at?: string;
          version?: number;
          worker_id: string;
        };
        Update: {
          appointment_id?: string | null;
          checked_in_at?: string;
          clinic_unit_id?: string;
          created_at?: string;
          id?: string;
          referral_id?: string | null;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
          version?: number;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "encounters_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounters_appointment_tenant_fk";
            columns: ["tenant_id", "appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "encounters_clinic_unit_id_fkey";
            columns: ["clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounters_clinic_unit_tenant_fk";
            columns: ["tenant_id", "clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "encounters_referral_id_fkey";
            columns: ["referral_id"];
            isOneToOne: false;
            referencedRelation: "referrals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounters_referral_tenant_fk";
            columns: ["tenant_id", "referral_id"];
            isOneToOne: false;
            referencedRelation: "referrals";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "encounters_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounters_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounters_worker_tenant_fk";
            columns: ["tenant_id", "worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      equipment_calibrations: {
        Row: {
          calibrated_at: string;
          certificate_reference: string | null;
          created_at: string;
          created_by: string;
          equipment_id: string;
          id: string;
          payload_redacted: Json;
          status: string;
          tenant_id: string;
          valid_until: string;
        };
        Insert: {
          calibrated_at: string;
          certificate_reference?: string | null;
          created_at?: string;
          created_by: string;
          equipment_id: string;
          id?: string;
          payload_redacted?: Json;
          status?: string;
          tenant_id: string;
          valid_until: string;
        };
        Update: {
          calibrated_at?: string;
          certificate_reference?: string | null;
          created_at?: string;
          created_by?: string;
          equipment_id?: string;
          id?: string;
          payload_redacted?: Json;
          status?: string;
          tenant_id?: string;
          valid_until?: string;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_calibrations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_calibrations_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment_registry";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_calibrations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      equipment_maintenance_events: {
        Row: {
          created_at: string;
          created_by: string;
          equipment_id: string;
          event_type: string;
          id: string;
          note_redacted: string | null;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          equipment_id: string;
          event_type: string;
          id?: string;
          note_redacted?: string | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          equipment_id?: string;
          event_type?: string;
          id?: string;
          note_redacted?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_maintenance_events_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment_registry";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_maintenance_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      equipment_registry: {
        Row: {
          capabilities: Json;
          clinic_unit_id: string | null;
          created_at: string;
          equipment_type: string;
          id: string;
          manufacturer: string | null;
          model: string | null;
          serial_number: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          capabilities?: Json;
          clinic_unit_id?: string | null;
          created_at?: string;
          equipment_type: string;
          id?: string;
          manufacturer?: string | null;
          model?: string | null;
          serial_number: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          capabilities?: Json;
          clinic_unit_id?: string | null;
          created_at?: string;
          equipment_type?: string;
          id?: string;
          manufacturer?: string | null;
          model?: string | null;
          serial_number?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_registry_clinic_unit_id_fkey";
            columns: ["clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_registry_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      esocial_batch_events: {
        Row: {
          batch_id: string;
          created_at: string;
          event_id: string;
          id: string;
          tenant_id: string;
        };
        Insert: {
          batch_id: string;
          created_at?: string;
          event_id: string;
          id?: string;
          tenant_id: string;
        };
        Update: {
          batch_id?: string;
          created_at?: string;
          event_id?: string;
          id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "esocial_batch_events_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "esocial_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_batch_events_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "esocial_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_batch_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      esocial_batches: {
        Row: {
          created_at: string;
          created_by: string;
          environment: string;
          id: string;
          idempotency_key: string;
          layout_version_id: string;
          protocol_number: string | null;
          status: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          environment: string;
          id?: string;
          idempotency_key: string;
          layout_version_id: string;
          protocol_number?: string | null;
          status?: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          environment?: string;
          id?: string;
          idempotency_key?: string;
          layout_version_id?: string;
          protocol_number?: string | null;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "esocial_batches_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_batches_layout_version_id_fkey";
            columns: ["layout_version_id"];
            isOneToOne: false;
            referencedRelation: "esocial_layout_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_batches_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      esocial_event_validations: {
        Row: {
          code: string;
          created_at: string;
          event_id: string;
          field_path: string | null;
          id: string;
          message: string;
          severity: string;
          tenant_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          event_id: string;
          field_path?: string | null;
          id?: string;
          message: string;
          severity: string;
          tenant_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          event_id?: string;
          field_path?: string | null;
          id?: string;
          message?: string;
          severity?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "esocial_event_validations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "esocial_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_event_validations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      esocial_events: {
        Row: {
          business_key: string;
          created_at: string;
          created_by: string;
          environment: string;
          event_type: string;
          id: string;
          idempotency_key: string;
          layout_version_id: string;
          operation_type: string;
          payload: Json;
          payload_hash: string;
          payload_version: number;
          previous_event_id: string | null;
          status: string;
          tenant_id: string;
        };
        Insert: {
          business_key: string;
          created_at?: string;
          created_by: string;
          environment: string;
          event_type: string;
          id?: string;
          idempotency_key: string;
          layout_version_id: string;
          operation_type?: string;
          payload: Json;
          payload_hash: string;
          payload_version?: number;
          previous_event_id?: string | null;
          status?: string;
          tenant_id: string;
        };
        Update: {
          business_key?: string;
          created_at?: string;
          created_by?: string;
          environment?: string;
          event_type?: string;
          id?: string;
          idempotency_key?: string;
          layout_version_id?: string;
          operation_type?: string;
          payload?: Json;
          payload_hash?: string;
          payload_version?: number;
          previous_event_id?: string | null;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "esocial_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_events_layout_version_id_fkey";
            columns: ["layout_version_id"];
            isOneToOne: false;
            referencedRelation: "esocial_layout_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_events_previous_event_id_fkey";
            columns: ["previous_event_id"];
            isOneToOne: false;
            referencedRelation: "esocial_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      esocial_layout_versions: {
        Row: {
          consulted_at: string;
          created_at: string;
          id: string;
          manual_reference: string;
          revision_date: string;
          source_url: string;
          status: string;
          technical_note: string;
          tenant_id: string;
          version: string;
          xsd_production_date: string;
        };
        Insert: {
          consulted_at: string;
          created_at?: string;
          id?: string;
          manual_reference: string;
          revision_date: string;
          source_url: string;
          status?: string;
          technical_note: string;
          tenant_id: string;
          version: string;
          xsd_production_date: string;
        };
        Update: {
          consulted_at?: string;
          created_at?: string;
          id?: string;
          manual_reference?: string;
          revision_date?: string;
          source_url?: string;
          status?: string;
          technical_note?: string;
          tenant_id?: string;
          version?: string;
          xsd_production_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "esocial_layout_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      esocial_receipts: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          payload_redacted: Json;
          receipt_number: string;
          received_at: string;
          submission_id: string | null;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          payload_redacted?: Json;
          receipt_number: string;
          received_at: string;
          submission_id?: string | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          payload_redacted?: Json;
          receipt_number?: string;
          received_at?: string;
          submission_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "esocial_receipts_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "esocial_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_receipts_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "esocial_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_receipts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      esocial_rejections: {
        Row: {
          code: string;
          created_at: string;
          event_id: string;
          id: string;
          message: string;
          payload_redacted: Json;
          status: string;
          submission_id: string | null;
          tenant_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          event_id: string;
          id?: string;
          message: string;
          payload_redacted?: Json;
          status?: string;
          submission_id?: string | null;
          tenant_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          event_id?: string;
          id?: string;
          message?: string;
          payload_redacted?: Json;
          status?: string;
          submission_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "esocial_rejections_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "esocial_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_rejections_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "esocial_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_rejections_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      esocial_submissions: {
        Row: {
          batch_id: string;
          created_at: string;
          id: string;
          integration_job_id: string | null;
          received_at: string | null;
          request_payload_hash: string;
          response_payload_redacted: Json;
          sent_at: string | null;
          status: string;
          tenant_id: string;
        };
        Insert: {
          batch_id: string;
          created_at?: string;
          id?: string;
          integration_job_id?: string | null;
          received_at?: string | null;
          request_payload_hash: string;
          response_payload_redacted?: Json;
          sent_at?: string | null;
          status?: string;
          tenant_id: string;
        };
        Update: {
          batch_id?: string;
          created_at?: string;
          id?: string;
          integration_job_id?: string | null;
          received_at?: string | null;
          request_payload_hash?: string;
          response_payload_redacted?: Json;
          sent_at?: string | null;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "esocial_submissions_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "esocial_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_submissions_integration_job_id_fkey";
            columns: ["integration_job_id"];
            isOneToOne: false;
            referencedRelation: "integration_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "esocial_submissions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_catalog: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          id: string;
          name: string;
          result_type: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          result_type: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          result_type?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_catalog_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_orders: {
        Row: {
          created_at: string;
          encounter_id: string;
          exam_catalog_id: string;
          id: string;
          protocol_snapshot: Json;
          status: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          encounter_id: string;
          exam_catalog_id: string;
          id?: string;
          protocol_snapshot?: Json;
          status?: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          encounter_id?: string;
          exam_catalog_id?: string;
          id?: string;
          protocol_snapshot?: Json;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_orders_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_orders_encounter_tenant_fk";
            columns: ["tenant_id", "encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "exam_orders_exam_catalog_id_fkey";
            columns: ["exam_catalog_id"];
            isOneToOne: false;
            referencedRelation: "exam_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_orders_exam_catalog_tenant_fk";
            columns: ["tenant_id", "exam_catalog_id"];
            isOneToOne: false;
            referencedRelation: "exam_catalog";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "exam_orders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_protocol_items: {
        Row: {
          conditions: Json;
          created_at: string;
          exam_catalog_id: string;
          exam_protocol_id: string;
          id: string;
          required: boolean;
          tenant_id: string;
        };
        Insert: {
          conditions?: Json;
          created_at?: string;
          exam_catalog_id: string;
          exam_protocol_id: string;
          id?: string;
          required?: boolean;
          tenant_id: string;
        };
        Update: {
          conditions?: Json;
          created_at?: string;
          exam_catalog_id?: string;
          exam_protocol_id?: string;
          id?: string;
          required?: boolean;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_protocol_items_exam_catalog_id_fkey";
            columns: ["exam_catalog_id"];
            isOneToOne: false;
            referencedRelation: "exam_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_protocol_items_exam_protocol_id_fkey";
            columns: ["exam_protocol_id"];
            isOneToOne: false;
            referencedRelation: "exam_protocols";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_protocol_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_protocol_overrides: {
        Row: {
          action: string;
          created_at: string;
          created_by: string;
          employment_contract_id: string | null;
          exam_catalog_id: string;
          exam_protocol_id: string | null;
          id: string;
          justification: string;
          request_id: string;
          tenant_id: string;
          worker_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          created_by: string;
          employment_contract_id?: string | null;
          exam_catalog_id: string;
          exam_protocol_id?: string | null;
          id?: string;
          justification: string;
          request_id: string;
          tenant_id: string;
          worker_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          created_by?: string;
          employment_contract_id?: string | null;
          exam_catalog_id?: string;
          exam_protocol_id?: string | null;
          id?: string;
          justification?: string;
          request_id?: string;
          tenant_id?: string;
          worker_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exam_protocol_overrides_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_protocol_overrides_employment_contract_id_fkey";
            columns: ["employment_contract_id"];
            isOneToOne: false;
            referencedRelation: "employment_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_protocol_overrides_exam_catalog_id_fkey";
            columns: ["exam_catalog_id"];
            isOneToOne: false;
            referencedRelation: "exam_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_protocol_overrides_exam_protocol_id_fkey";
            columns: ["exam_protocol_id"];
            isOneToOne: false;
            referencedRelation: "exam_protocols";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_protocol_overrides_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_protocol_overrides_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_protocol_rules: {
        Row: {
          conditions: Json;
          conflict_policy: string;
          created_at: string;
          exam_protocol_id: string;
          id: string;
          name: string;
          priority: number;
          tenant_id: string;
        };
        Insert: {
          conditions?: Json;
          conflict_policy?: string;
          created_at?: string;
          exam_protocol_id: string;
          id?: string;
          name: string;
          priority?: number;
          tenant_id: string;
        };
        Update: {
          conditions?: Json;
          conflict_policy?: string;
          created_at?: string;
          exam_protocol_id?: string;
          id?: string;
          name?: string;
          priority?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_protocol_rules_exam_protocol_id_fkey";
            columns: ["exam_protocol_id"];
            isOneToOne: false;
            referencedRelation: "exam_protocols";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_protocol_rules_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_protocols: {
        Row: {
          created_at: string;
          id: string;
          occupational_exam_type: string;
          pcmso_version_id: string;
          rule_version: number;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          occupational_exam_type: string;
          pcmso_version_id: string;
          rule_version?: number;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          occupational_exam_type?: string;
          pcmso_version_id?: string;
          rule_version?: number;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_protocols_pcmso_version_id_fkey";
            columns: ["pcmso_version_id"];
            isOneToOne: false;
            referencedRelation: "pcmso_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_protocols_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      exposure_groups: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exposure_groups_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exposure_groups_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      external_laboratories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          status: string;
          tax_id: string | null;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          status?: string;
          tax_id?: string | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          status?: string;
          tax_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "external_laboratories_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      generated_documents: {
        Row: {
          created_at: string;
          created_by: string;
          current_version: number;
          document_type: string;
          encounter_id: string | null;
          id: string;
          idempotency_key: string;
          status: string;
          template_version_id: string;
          tenant_id: string;
          vigente_version_id: string | null;
          worker_id: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          current_version?: number;
          document_type: string;
          encounter_id?: string | null;
          id?: string;
          idempotency_key: string;
          status?: string;
          template_version_id: string;
          tenant_id: string;
          vigente_version_id?: string | null;
          worker_id?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          current_version?: number;
          document_type?: string;
          encounter_id?: string | null;
          id?: string;
          idempotency_key?: string;
          status?: string;
          template_version_id?: string;
          tenant_id?: string;
          vigente_version_id?: string | null;
          worker_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "generated_documents_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_documents_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_documents_encounter_tenant_fk";
            columns: ["tenant_id", "encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "generated_documents_template_version_id_fkey";
            columns: ["template_version_id"];
            isOneToOne: false;
            referencedRelation: "document_template_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_documents_template_version_tenant_fk";
            columns: ["tenant_id", "template_version_id"];
            isOneToOne: false;
            referencedRelation: "document_template_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "generated_documents_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_documents_vigente_fk";
            columns: ["vigente_version_id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_documents_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_documents_worker_tenant_fk";
            columns: ["tenant_id", "worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      idempotency_keys: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          key: string;
          request_hash: string;
          response_reference: Json | null;
          scope: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          key: string;
          request_hash: string;
          response_reference?: Json | null;
          scope: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          key?: string;
          request_hash?: string;
          response_reference?: Json | null;
          scope?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_connections: {
        Row: {
          config_redacted: Json;
          connection_type: string;
          created_at: string;
          credential_reference: string | null;
          display_name: string;
          id: string;
          provider: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          config_redacted?: Json;
          connection_type: string;
          created_at?: string;
          credential_reference?: string | null;
          display_name: string;
          id?: string;
          provider: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          config_redacted?: Json;
          connection_type?: string;
          created_at?: string;
          credential_reference?: string | null;
          display_name?: string;
          id?: string;
          provider?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_connections_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_dead_letters: {
        Row: {
          created_at: string;
          delivery_id: string | null;
          id: string;
          job_id: string | null;
          payload_redacted: Json;
          reason_redacted: string;
          reprocessed_at: string | null;
          reprocessed_by: string | null;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          delivery_id?: string | null;
          id?: string;
          job_id?: string | null;
          payload_redacted?: Json;
          reason_redacted: string;
          reprocessed_at?: string | null;
          reprocessed_by?: string | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          delivery_id?: string | null;
          id?: string;
          job_id?: string | null;
          payload_redacted?: Json;
          reason_redacted?: string;
          reprocessed_at?: string | null;
          reprocessed_by?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_dead_letters_delivery_id_fkey";
            columns: ["delivery_id"];
            isOneToOne: false;
            referencedRelation: "integration_deliveries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_dead_letters_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "integration_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_dead_letters_reprocessed_by_fkey";
            columns: ["reprocessed_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_dead_letters_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_deliveries: {
        Row: {
          attempts: number;
          created_at: string;
          destination: string;
          id: string;
          job_id: string;
          next_attempt_at: string | null;
          response_redacted: string | null;
          response_status: number | null;
          signature_header: string | null;
          status: string;
          tenant_id: string;
          webhook_id: string | null;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          destination: string;
          id?: string;
          job_id: string;
          next_attempt_at?: string | null;
          response_redacted?: string | null;
          response_status?: number | null;
          signature_header?: string | null;
          status?: string;
          tenant_id: string;
          webhook_id?: string | null;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          destination?: string;
          id?: string;
          job_id?: string;
          next_attempt_at?: string | null;
          response_redacted?: string | null;
          response_status?: number | null;
          signature_header?: string | null;
          status?: string;
          tenant_id?: string;
          webhook_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "integration_deliveries_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "integration_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_deliveries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_deliveries_webhook_id_fkey";
            columns: ["webhook_id"];
            isOneToOne: false;
            referencedRelation: "integration_webhooks";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_jobs: {
        Row: {
          attempts: number;
          connection_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          idempotency_key: string;
          job_type: string;
          last_error_redacted: string | null;
          locked_at: string | null;
          locked_by: string | null;
          max_attempts: number;
          next_attempt_at: string;
          payload_redacted: Json;
          status: string;
          tenant_id: string;
        };
        Insert: {
          attempts?: number;
          connection_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          idempotency_key: string;
          job_type: string;
          last_error_redacted?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          max_attempts?: number;
          next_attempt_at?: string;
          payload_redacted?: Json;
          status?: string;
          tenant_id: string;
        };
        Update: {
          attempts?: number;
          connection_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          idempotency_key?: string;
          job_type?: string;
          last_error_redacted?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          max_attempts?: number;
          next_attempt_at?: string;
          payload_redacted?: Json;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_jobs_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "integration_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_jobs_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_jobs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_logs: {
        Row: {
          connection_id: string | null;
          created_at: string;
          id: string;
          job_id: string | null;
          level: string;
          message: string;
          metadata_redacted: Json;
          tenant_id: string;
        };
        Insert: {
          connection_id?: string | null;
          created_at?: string;
          id?: string;
          job_id?: string | null;
          level: string;
          message: string;
          metadata_redacted?: Json;
          tenant_id: string;
        };
        Update: {
          connection_id?: string | null;
          created_at?: string;
          id?: string;
          job_id?: string | null;
          level?: string;
          message?: string;
          metadata_redacted?: Json;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_logs_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "integration_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_logs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "integration_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_logs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_webhooks: {
        Row: {
          connection_id: string;
          created_at: string;
          event_type: string;
          id: string;
          signing_secret_reference: string;
          status: string;
          target_url: string;
          tenant_id: string;
        };
        Insert: {
          connection_id: string;
          created_at?: string;
          event_type: string;
          id?: string;
          signing_secret_reference: string;
          status?: string;
          target_url: string;
          tenant_id: string;
        };
        Update: {
          connection_id?: string;
          created_at?: string;
          event_type?: string;
          id?: string;
          signing_secret_reference?: string;
          status?: string;
          target_url?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_webhooks_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "integration_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_webhooks_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      internal_notifications: {
        Row: {
          body_redacted: string;
          created_at: string;
          id: string;
          notification_type: string;
          status: string;
          target_user_id: string | null;
          tenant_id: string;
          title: string;
        };
        Insert: {
          body_redacted: string;
          created_at?: string;
          id?: string;
          notification_type: string;
          status?: string;
          target_user_id?: string | null;
          tenant_id: string;
          title: string;
        };
        Update: {
          body_redacted?: string;
          created_at?: string;
          id?: string;
          notification_type?: string;
          status?: string;
          target_user_id?: string | null;
          tenant_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "internal_notifications_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "internal_notifications_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          amount_cents: number;
          billing_item_id: string;
          created_at: string;
          description: string;
          id: string;
          invoice_id: string;
          tenant_id: string;
        };
        Insert: {
          amount_cents: number;
          billing_item_id: string;
          created_at?: string;
          description: string;
          id?: string;
          invoice_id: string;
          tenant_id: string;
        };
        Update: {
          amount_cents?: number;
          billing_item_id?: string;
          created_at?: string;
          description?: string;
          id?: string;
          invoice_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_billing_item_id_fkey";
            columns: ["billing_item_id"];
            isOneToOne: false;
            referencedRelation: "billing_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_billing_item_tenant_fk";
            columns: ["tenant_id", "billing_item_id"];
            isOneToOne: true;
            referencedRelation: "billing_items";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_invoice_tenant_fk";
            columns: ["tenant_id", "invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "invoice_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string;
          due_on: string | null;
          id: string;
          issued_at: string | null;
          status: string;
          tenant_id: string;
          total_cents: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by: string;
          due_on?: string | null;
          id?: string;
          issued_at?: string | null;
          status?: string;
          tenant_id: string;
          total_cents?: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string;
          due_on?: string | null;
          id?: string;
          issued_at?: string | null;
          status?: string;
          tenant_id?: string;
          total_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_company_tenant_fk";
            columns: ["tenant_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "invoices_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      job_positions: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          sector_id: string | null;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          sector_id?: string | null;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          sector_id?: string | null;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_positions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_positions_sector_id_fkey";
            columns: ["sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_positions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      laboratory_critical_confirmations: {
        Row: {
          confirmation_note: string;
          confirmed_by: string;
          created_at: string;
          id: string;
          laboratory_result_id: string;
          tenant_id: string;
        };
        Insert: {
          confirmation_note: string;
          confirmed_by: string;
          created_at?: string;
          id?: string;
          laboratory_result_id: string;
          tenant_id: string;
        };
        Update: {
          confirmation_note?: string;
          confirmed_by?: string;
          created_at?: string;
          id?: string;
          laboratory_result_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "laboratory_critical_confirmations_confirmed_by_fkey";
            columns: ["confirmed_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_critical_confirmations_laboratory_result_id_fkey";
            columns: ["laboratory_result_id"];
            isOneToOne: false;
            referencedRelation: "laboratory_results";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_critical_confirmations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      laboratory_order_items: {
        Row: {
          analyte_code: string;
          analyte_name: string;
          created_at: string;
          exam_order_id: string | null;
          id: string;
          laboratory_order_id: string;
          reference_range_config: Json;
          status: string;
          tenant_id: string;
        };
        Insert: {
          analyte_code: string;
          analyte_name: string;
          created_at?: string;
          exam_order_id?: string | null;
          id?: string;
          laboratory_order_id: string;
          reference_range_config?: Json;
          status?: string;
          tenant_id: string;
        };
        Update: {
          analyte_code?: string;
          analyte_name?: string;
          created_at?: string;
          exam_order_id?: string | null;
          id?: string;
          laboratory_order_id?: string;
          reference_range_config?: Json;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "laboratory_order_items_exam_order_id_fkey";
            columns: ["exam_order_id"];
            isOneToOne: false;
            referencedRelation: "exam_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_order_items_laboratory_order_id_fkey";
            columns: ["laboratory_order_id"];
            isOneToOne: false;
            referencedRelation: "laboratory_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_order_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      laboratory_orders: {
        Row: {
          barcode_value: string | null;
          created_at: string;
          created_by: string;
          encounter_id: string;
          external_laboratory_id: string | null;
          id: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          barcode_value?: string | null;
          created_at?: string;
          created_by: string;
          encounter_id: string;
          external_laboratory_id?: string | null;
          id?: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          barcode_value?: string | null;
          created_at?: string;
          created_by?: string;
          encounter_id?: string;
          external_laboratory_id?: string | null;
          id?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "laboratory_orders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_orders_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_orders_external_laboratory_id_fkey";
            columns: ["external_laboratory_id"];
            isOneToOne: false;
            referencedRelation: "external_laboratories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_orders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      laboratory_results: {
        Row: {
          created_at: string;
          created_by: string;
          critical_confirmed_at: string | null;
          critical_flag: boolean;
          id: string;
          laboratory_order_item_id: string;
          reference_range_snapshot: Json;
          released_at: string | null;
          released_by: string | null;
          result_payload: Json;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          tenant_id: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          critical_confirmed_at?: string | null;
          critical_flag?: boolean;
          id?: string;
          laboratory_order_item_id: string;
          reference_range_snapshot?: Json;
          released_at?: string | null;
          released_by?: string | null;
          result_payload: Json;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          tenant_id: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          critical_confirmed_at?: string | null;
          critical_flag?: boolean;
          id?: string;
          laboratory_order_item_id?: string;
          reference_range_snapshot?: Json;
          released_at?: string | null;
          released_by?: string | null;
          result_payload?: Json;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          tenant_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "laboratory_results_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_results_laboratory_order_item_id_fkey";
            columns: ["laboratory_order_item_id"];
            isOneToOne: false;
            referencedRelation: "laboratory_order_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_results_released_by_fkey";
            columns: ["released_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_results_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_results_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      laboratory_sample_events: {
        Row: {
          created_at: string;
          created_by: string;
          event_type: string;
          id: string;
          payload: Json;
          sample_id: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          event_type: string;
          id?: string;
          payload?: Json;
          sample_id: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          event_type?: string;
          id?: string;
          payload?: Json;
          sample_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "laboratory_sample_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_sample_events_sample_id_fkey";
            columns: ["sample_id"];
            isOneToOne: false;
            referencedRelation: "laboratory_samples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_sample_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      laboratory_samples: {
        Row: {
          collected_at: string | null;
          created_at: string;
          id: string;
          laboratory_order_id: string;
          received_at: string | null;
          sample_code: string;
          sample_type: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          collected_at?: string | null;
          created_at?: string;
          id?: string;
          laboratory_order_id: string;
          received_at?: string | null;
          sample_code: string;
          sample_type: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          collected_at?: string | null;
          created_at?: string;
          id?: string;
          laboratory_order_id?: string;
          received_at?: string | null;
          sample_code?: string;
          sample_type?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "laboratory_samples_laboratory_order_id_fkey";
            columns: ["laboratory_order_id"];
            isOneToOne: false;
            referencedRelation: "laboratory_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "laboratory_samples_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      local_connector_events: {
        Row: {
          connector_id: string;
          created_at: string;
          equipment_id: string | null;
          event_type: string;
          id: string;
          idempotency_key: string;
          payload_redacted: Json;
          status: string;
          tenant_id: string;
        };
        Insert: {
          connector_id: string;
          created_at?: string;
          equipment_id?: string | null;
          event_type: string;
          id?: string;
          idempotency_key: string;
          payload_redacted?: Json;
          status?: string;
          tenant_id: string;
        };
        Update: {
          connector_id?: string;
          created_at?: string;
          equipment_id?: string | null;
          event_type?: string;
          id?: string;
          idempotency_key?: string;
          payload_redacted?: Json;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "local_connector_events_connector_id_fkey";
            columns: ["connector_id"];
            isOneToOne: false;
            referencedRelation: "local_connectors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "local_connector_events_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment_registry";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "local_connector_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      local_connector_tokens: {
        Row: {
          connector_id: string;
          created_at: string;
          expires_at: string;
          id: string;
          status: string;
          tenant_id: string;
          token_hash: string;
        };
        Insert: {
          connector_id: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          status?: string;
          tenant_id: string;
          token_hash: string;
        };
        Update: {
          connector_id?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          status?: string;
          tenant_id?: string;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "local_connector_tokens_connector_id_fkey";
            columns: ["connector_id"];
            isOneToOne: false;
            referencedRelation: "local_connectors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "local_connector_tokens_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      local_connector_update_policies: {
        Row: {
          connector_id: string | null;
          created_at: string;
          id: string;
          min_version: string;
          signature_reference: string;
          status: string;
          target_version: string;
          tenant_id: string;
        };
        Insert: {
          connector_id?: string | null;
          created_at?: string;
          id?: string;
          min_version: string;
          signature_reference: string;
          status?: string;
          target_version: string;
          tenant_id: string;
        };
        Update: {
          connector_id?: string | null;
          created_at?: string;
          id?: string;
          min_version?: string;
          signature_reference?: string;
          status?: string;
          target_version?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "local_connector_update_policies_connector_id_fkey";
            columns: ["connector_id"];
            isOneToOne: false;
            referencedRelation: "local_connectors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "local_connector_update_policies_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      local_connectors: {
        Row: {
          clinic_unit_id: string | null;
          connector_name: string;
          created_at: string;
          device_public_key: string;
          id: string;
          last_seen_at: string | null;
          scope: Json;
          status: string;
          tenant_id: string;
        };
        Insert: {
          clinic_unit_id?: string | null;
          connector_name: string;
          created_at?: string;
          device_public_key: string;
          id?: string;
          last_seen_at?: string | null;
          scope?: Json;
          status?: string;
          tenant_id: string;
        };
        Update: {
          clinic_unit_id?: string | null;
          connector_name?: string;
          created_at?: string;
          device_public_key?: string;
          id?: string;
          last_seen_at?: string | null;
          scope?: Json;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "local_connectors_clinic_unit_id_fkey";
            columns: ["clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "local_connectors_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_conclusion_rules: {
        Row: {
          block_when_flow_paused: boolean;
          block_when_no_closed_consultation: boolean;
          block_when_no_closed_triage: boolean;
          block_when_pending_required_exams: boolean;
          code: string;
          created_at: string;
          id: string;
          name: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          block_when_flow_paused?: boolean;
          block_when_no_closed_consultation?: boolean;
          block_when_no_closed_triage?: boolean;
          block_when_pending_required_exams?: boolean;
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          block_when_flow_paused?: boolean;
          block_when_no_closed_consultation?: boolean;
          block_when_no_closed_triage?: boolean;
          block_when_pending_required_exams?: boolean;
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medical_conclusion_rules_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_conclusions: {
        Row: {
          conclusion_code: string;
          consultation_id: string;
          created_at: string;
          created_by: string;
          encounter_id: string;
          id: string;
          notes: string | null;
          physician_credential_id: string;
          restrictions: Json;
          signature_status: string;
          signed_at: string | null;
          tenant_id: string;
        };
        Insert: {
          conclusion_code: string;
          consultation_id: string;
          created_at?: string;
          created_by: string;
          encounter_id: string;
          id?: string;
          notes?: string | null;
          physician_credential_id: string;
          restrictions?: Json;
          signature_status?: string;
          signed_at?: string | null;
          tenant_id: string;
        };
        Update: {
          conclusion_code?: string;
          consultation_id?: string;
          created_at?: string;
          created_by?: string;
          encounter_id?: string;
          id?: string;
          notes?: string | null;
          physician_credential_id?: string;
          restrictions?: Json;
          signature_status?: string;
          signed_at?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medical_conclusions_consultation_id_fkey";
            columns: ["consultation_id"];
            isOneToOne: false;
            referencedRelation: "medical_consultations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_conclusions_consultation_tenant_fk";
            columns: ["tenant_id", "consultation_id"];
            isOneToOne: false;
            referencedRelation: "medical_consultations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "medical_conclusions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_conclusions_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_conclusions_encounter_tenant_fk";
            columns: ["tenant_id", "encounter_id"];
            isOneToOne: true;
            referencedRelation: "encounters";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "medical_conclusions_physician_credential_id_fkey";
            columns: ["physician_credential_id"];
            isOneToOne: false;
            referencedRelation: "clinical_professional_credentials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_conclusions_physician_tenant_fk";
            columns: ["tenant_id", "physician_credential_id"];
            isOneToOne: false;
            referencedRelation: "clinical_professional_credentials";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "medical_conclusions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_consultation_addenda: {
        Row: {
          consultation_id: string;
          created_at: string;
          created_by: string;
          id: string;
          note: string;
          reason: string;
          tenant_id: string;
        };
        Insert: {
          consultation_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          note: string;
          reason: string;
          tenant_id: string;
        };
        Update: {
          consultation_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          note?: string;
          reason?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medical_consultation_addenda_consultation_id_fkey";
            columns: ["consultation_id"];
            isOneToOne: false;
            referencedRelation: "medical_consultations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_consultation_addenda_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_consultation_addenda_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_consultation_versions: {
        Row: {
          assessment: string | null;
          consultation_id: string;
          created_at: string;
          created_by: string;
          id: string;
          objective: Json;
          plan: string | null;
          reason: string;
          subjective: Json;
          tenant_id: string;
          version: number;
        };
        Insert: {
          assessment?: string | null;
          consultation_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          objective?: Json;
          plan?: string | null;
          reason: string;
          subjective?: Json;
          tenant_id: string;
          version: number;
        };
        Update: {
          assessment?: string | null;
          consultation_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          objective?: Json;
          plan?: string | null;
          reason?: string;
          subjective?: Json;
          tenant_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "medical_consultation_versions_consultation_id_fkey";
            columns: ["consultation_id"];
            isOneToOne: false;
            referencedRelation: "medical_consultations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_consultation_versions_consultation_tenant_fk";
            columns: ["tenant_id", "consultation_id"];
            isOneToOne: false;
            referencedRelation: "medical_consultations";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "medical_consultation_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_consultation_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_consultations: {
        Row: {
          closed_at: string | null;
          closed_by: string | null;
          created_at: string;
          current_version: number;
          encounter_id: string;
          id: string;
          physician_credential_id: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          current_version?: number;
          encounter_id: string;
          id?: string;
          physician_credential_id: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          current_version?: number;
          encounter_id?: string;
          id?: string;
          physician_credential_id?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medical_consultations_closed_by_fkey";
            columns: ["closed_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_consultations_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_consultations_encounter_tenant_fk";
            columns: ["tenant_id", "encounter_id"];
            isOneToOne: true;
            referencedRelation: "encounters";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "medical_consultations_physician_credential_id_fkey";
            columns: ["physician_credential_id"];
            isOneToOne: false;
            referencedRelation: "clinical_professional_credentials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_consultations_physician_tenant_fk";
            columns: ["tenant_id", "physician_credential_id"];
            isOneToOne: false;
            referencedRelation: "clinical_professional_credentials";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "medical_consultations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      membership_roles: {
        Row: {
          clinic_unit_id: string | null;
          id: string;
          membership_id: string;
          role_id: string;
        };
        Insert: {
          clinic_unit_id?: string | null;
          id?: string;
          membership_id: string;
          role_id: string;
        };
        Update: {
          clinic_unit_id?: string | null;
          id?: string;
          membership_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "membership_roles_clinic_unit_id_fkey";
            columns: ["clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "membership_roles_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "tenant_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "membership_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      message_consents: {
        Row: {
          channel: string;
          created_at: string;
          granted_at: string | null;
          id: string;
          legal_basis: string;
          revoked_at: string | null;
          status: string;
          subject_reference: string;
          subject_type: string;
          tenant_id: string;
        };
        Insert: {
          channel: string;
          created_at?: string;
          granted_at?: string | null;
          id?: string;
          legal_basis: string;
          revoked_at?: string | null;
          status?: string;
          subject_reference: string;
          subject_type: string;
          tenant_id: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          granted_at?: string | null;
          id?: string;
          legal_basis?: string;
          revoked_at?: string | null;
          status?: string;
          subject_reference?: string;
          subject_type?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_consents_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      message_deliveries: {
        Row: {
          created_at: string;
          id: string;
          message_id: string;
          occurred_at: string;
          provider_message_id: string | null;
          response_redacted: Json;
          status: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message_id: string;
          occurred_at?: string;
          provider_message_id?: string | null;
          response_redacted?: Json;
          status: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message_id?: string;
          occurred_at?: string;
          provider_message_id?: string | null;
          response_redacted?: Json;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_deliveries_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "message_queue";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_deliveries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      message_opt_outs: {
        Row: {
          channel: string;
          created_at: string;
          destination_hash: string;
          id: string;
          reason: string | null;
          tenant_id: string;
        };
        Insert: {
          channel: string;
          created_at?: string;
          destination_hash: string;
          id?: string;
          reason?: string | null;
          tenant_id: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          destination_hash?: string;
          id?: string;
          reason?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_opt_outs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      message_queue: {
        Row: {
          attempts: number;
          channel: string;
          created_at: string;
          created_by: string | null;
          destination_hash: string;
          id: string;
          idempotency_key: string;
          integration_connection_id: string | null;
          next_attempt_at: string;
          payload_redacted: Json;
          recipient_reference: string | null;
          recipient_type: string;
          status: string;
          template_version_id: string | null;
          tenant_id: string;
        };
        Insert: {
          attempts?: number;
          channel: string;
          created_at?: string;
          created_by?: string | null;
          destination_hash: string;
          id?: string;
          idempotency_key: string;
          integration_connection_id?: string | null;
          next_attempt_at?: string;
          payload_redacted?: Json;
          recipient_reference?: string | null;
          recipient_type: string;
          status?: string;
          template_version_id?: string | null;
          tenant_id: string;
        };
        Update: {
          attempts?: number;
          channel?: string;
          created_at?: string;
          created_by?: string | null;
          destination_hash?: string;
          id?: string;
          idempotency_key?: string;
          integration_connection_id?: string | null;
          next_attempt_at?: string;
          payload_redacted?: Json;
          recipient_reference?: string | null;
          recipient_type?: string;
          status?: string;
          template_version_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_queue_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_queue_integration_connection_id_fkey";
            columns: ["integration_connection_id"];
            isOneToOne: false;
            referencedRelation: "integration_connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_queue_template_version_id_fkey";
            columns: ["template_version_id"];
            isOneToOne: false;
            referencedRelation: "message_template_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_queue_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      message_template_versions: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          body_template: string;
          contains_sensitive_content: boolean;
          created_at: string;
          id: string;
          status: string;
          subject_template: string | null;
          template_id: string;
          tenant_id: string;
          variables_schema: Json;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          body_template: string;
          contains_sensitive_content?: boolean;
          created_at?: string;
          id?: string;
          status?: string;
          subject_template?: string | null;
          template_id: string;
          tenant_id: string;
          variables_schema?: Json;
          version: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          body_template?: string;
          contains_sensitive_content?: boolean;
          created_at?: string;
          id?: string;
          status?: string;
          subject_template?: string | null;
          template_id?: string;
          tenant_id?: string;
          variables_schema?: Json;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "message_template_versions_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_template_versions_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "message_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_template_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      message_templates: {
        Row: {
          channel: string;
          code: string;
          created_at: string;
          id: string;
          name: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          channel: string;
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          channel?: string;
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_templates_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      occupational_risks: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          name: string;
          risk_type: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          risk_type: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          risk_type?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "occupational_risks_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      outbox_events: {
        Row: {
          aggregate_id: string;
          aggregate_type: string;
          attempts: number;
          created_at: string;
          event_type: string;
          id: string;
          next_attempt_at: string | null;
          payload_redacted: Json;
          status: string;
          tenant_id: string;
        };
        Insert: {
          aggregate_id: string;
          aggregate_type: string;
          attempts?: number;
          created_at?: string;
          event_type: string;
          id?: string;
          next_attempt_at?: string | null;
          payload_redacted?: Json;
          status?: string;
          tenant_id: string;
        };
        Update: {
          aggregate_id?: string;
          aggregate_type?: string;
          attempts?: number;
          created_at?: string;
          event_type?: string;
          id?: string;
          next_attempt_at?: string | null;
          payload_redacted?: Json;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outbox_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_cents: number;
          created_at: string;
          created_by: string;
          id: string;
          invoice_id: string;
          method: string;
          paid_at: string;
          reference: string | null;
          tenant_id: string;
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          created_by: string;
          id?: string;
          invoice_id: string;
          method: string;
          paid_at: string;
          reference?: string | null;
          tenant_id: string;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          created_by?: string;
          id?: string;
          invoice_id?: string;
          method?: string;
          paid_at?: string;
          reference?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_invoice_tenant_fk";
            columns: ["tenant_id", "invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "payments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      pcmso_programs: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pcmso_programs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pcmso_programs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      pcmso_versions: {
        Row: {
          approved_at: string | null;
          company_id: string;
          content_hash: string | null;
          created_at: string;
          id: string;
          pcmso_program_id: string;
          status: string;
          tenant_id: string;
          updated_at: string;
          valid_from: string;
          valid_until: string | null;
          version_number: number;
        };
        Insert: {
          approved_at?: string | null;
          company_id: string;
          content_hash?: string | null;
          created_at?: string;
          id?: string;
          pcmso_program_id: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
          valid_from: string;
          valid_until?: string | null;
          version_number: number;
        };
        Update: {
          approved_at?: string | null;
          company_id?: string;
          content_hash?: string | null;
          created_at?: string;
          id?: string;
          pcmso_program_id?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
          valid_from?: string;
          valid_until?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pcmso_versions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pcmso_versions_pcmso_program_id_fkey";
            columns: ["pcmso_program_id"];
            isOneToOne: false;
            referencedRelation: "pcmso_programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pcmso_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      permissions: {
        Row: {
          code: string;
          description: string;
          id: string;
        };
        Insert: {
          code: string;
          description: string;
          id?: string;
        };
        Update: {
          code?: string;
          description?: string;
          id?: string;
        };
        Relationships: [];
      };
      price_list_items: {
        Row: {
          created_at: string;
          exam_catalog_id: string;
          id: string;
          price_cents: number;
          price_list_id: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          exam_catalog_id: string;
          id?: string;
          price_cents: number;
          price_list_id: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          exam_catalog_id?: string;
          id?: string;
          price_cents?: number;
          price_list_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "price_list_items_exam_catalog_id_fkey";
            columns: ["exam_catalog_id"];
            isOneToOne: false;
            referencedRelation: "exam_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "price_list_items_price_list_id_fkey";
            columns: ["price_list_id"];
            isOneToOne: false;
            referencedRelation: "price_lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "price_list_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      price_lists: {
        Row: {
          code: string;
          company_id: string | null;
          created_at: string;
          id: string;
          name: string;
          status: string;
          tenant_id: string;
          updated_at: string;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          code: string;
          company_id?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
          valid_from: string;
          valid_until?: string | null;
        };
        Update: {
          code?: string;
          company_id?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "price_lists_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "price_lists_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      queue_definitions: {
        Row: {
          clinic_unit_id: string;
          code: string;
          created_at: string;
          id: string;
          name: string;
          status: string;
          step_type: string;
          tenant_id: string;
        };
        Insert: {
          clinic_unit_id: string;
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          status?: string;
          step_type: string;
          tenant_id: string;
        };
        Update: {
          clinic_unit_id?: string;
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          status?: string;
          step_type?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "queue_definitions_clinic_unit_id_fkey";
            columns: ["clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_definitions_clinic_unit_tenant_fk";
            columns: ["tenant_id", "clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "queue_definitions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      queue_tickets: {
        Row: {
          created_at: string;
          encounter_id: string;
          encounter_step_id: string;
          id: string;
          position_key: string;
          priority: number;
          queue_definition_id: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          encounter_id: string;
          encounter_step_id: string;
          id?: string;
          position_key?: string;
          priority?: number;
          queue_definition_id: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          encounter_id?: string;
          encounter_step_id?: string;
          id?: string;
          position_key?: string;
          priority?: number;
          queue_definition_id?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "queue_tickets_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_tickets_encounter_step_id_fkey";
            columns: ["encounter_step_id"];
            isOneToOne: false;
            referencedRelation: "encounter_steps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_tickets_encounter_step_tenant_fk";
            columns: ["tenant_id", "encounter_step_id"];
            isOneToOne: false;
            referencedRelation: "encounter_steps";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "queue_tickets_encounter_tenant_fk";
            columns: ["tenant_id", "encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "queue_tickets_queue_definition_id_fkey";
            columns: ["queue_definition_id"];
            isOneToOne: false;
            referencedRelation: "queue_definitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_tickets_queue_definition_tenant_fk";
            columns: ["tenant_id", "queue_definition_id"];
            isOneToOne: false;
            referencedRelation: "queue_definitions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "queue_tickets_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_items: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          price_snapshot: Json;
          quantity: number;
          quote_id: string;
          tenant_id: string;
          total_cents: number;
          unit_price_cents: number;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          price_snapshot?: Json;
          quantity: number;
          quote_id: string;
          tenant_id: string;
          total_cents: number;
          unit_price_cents: number;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          price_snapshot?: Json;
          quantity?: number;
          quote_id?: string;
          tenant_id?: string;
          total_cents?: number;
          unit_price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_items_quote_tenant_fk";
            columns: ["tenant_id", "quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "quote_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      quotes: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          company_id: string;
          contract_id: string | null;
          converted_at: string | null;
          created_at: string;
          created_by: string;
          id: string;
          status: string;
          tenant_id: string;
          total_cents: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          company_id: string;
          contract_id?: string | null;
          converted_at?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          status?: string;
          tenant_id: string;
          total_cents?: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          company_id?: string;
          contract_id?: string | null;
          converted_at?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          status?: string;
          tenant_id?: string;
          total_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_company_tenant_fk";
            columns: ["tenant_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "quotes_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "commercial_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_contract_tenant_fk";
            columns: ["tenant_id", "contract_id"];
            isOneToOne: false;
            referencedRelation: "commercial_contracts";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "quotes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      referral_import_batches: {
        Row: {
          created_at: string;
          created_by: string;
          file_name: string;
          id: string;
          idempotency_key: string;
          invalid_count: number;
          row_count: number;
          status: string;
          tenant_id: string;
          valid_count: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          file_name: string;
          id?: string;
          idempotency_key: string;
          invalid_count?: number;
          row_count?: number;
          status?: string;
          tenant_id: string;
          valid_count?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          file_name?: string;
          id?: string;
          idempotency_key?: string;
          invalid_count?: number;
          row_count?: number;
          status?: string;
          tenant_id?: string;
          valid_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "referral_import_batches_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referral_import_batches_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      referral_import_lines: {
        Row: {
          batch_id: string;
          created_at: string;
          errors: Json;
          id: string;
          normalized_payload: Json;
          raw_payload: Json;
          referral_id: string | null;
          row_number: number;
          status: string;
          tenant_id: string;
        };
        Insert: {
          batch_id: string;
          created_at?: string;
          errors?: Json;
          id?: string;
          normalized_payload?: Json;
          raw_payload: Json;
          referral_id?: string | null;
          row_number: number;
          status: string;
          tenant_id: string;
        };
        Update: {
          batch_id?: string;
          created_at?: string;
          errors?: Json;
          id?: string;
          normalized_payload?: Json;
          raw_payload?: Json;
          referral_id?: string | null;
          row_number?: number;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referral_import_lines_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "referral_import_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referral_import_lines_referral_id_fkey";
            columns: ["referral_id"];
            isOneToOne: false;
            referencedRelation: "referrals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referral_import_lines_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      referral_items: {
        Row: {
          created_at: string;
          exam_catalog_id: string | null;
          id: string;
          referral_id: string;
          source: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          exam_catalog_id?: string | null;
          id?: string;
          referral_id: string;
          source: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          exam_catalog_id?: string | null;
          id?: string;
          referral_id?: string;
          source?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referral_items_exam_catalog_id_fkey";
            columns: ["exam_catalog_id"];
            isOneToOne: false;
            referencedRelation: "exam_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referral_items_exam_catalog_tenant_fk";
            columns: ["tenant_id", "exam_catalog_id"];
            isOneToOne: false;
            referencedRelation: "exam_catalog";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "referral_items_referral_id_fkey";
            columns: ["referral_id"];
            isOneToOne: false;
            referencedRelation: "referrals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referral_items_referral_tenant_fk";
            columns: ["tenant_id", "referral_id"];
            isOneToOne: false;
            referencedRelation: "referrals";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "referral_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      referrals: {
        Row: {
          company_id: string;
          created_at: string;
          divergence_report: Json;
          employment_contract_id: string | null;
          exam_preview: Json;
          id: string;
          idempotency_key: string | null;
          occupational_exam_type: string;
          status: string;
          tenant_id: string;
          updated_at: string;
          valid_until: string | null;
          worker_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          divergence_report?: Json;
          employment_contract_id?: string | null;
          exam_preview?: Json;
          id?: string;
          idempotency_key?: string | null;
          occupational_exam_type: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
          valid_until?: string | null;
          worker_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          divergence_report?: Json;
          employment_contract_id?: string | null;
          exam_preview?: Json;
          id?: string;
          idempotency_key?: string | null;
          occupational_exam_type?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
          valid_until?: string | null;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referrals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_company_tenant_fk";
            columns: ["tenant_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "referrals_contract_tenant_fk";
            columns: ["tenant_id", "employment_contract_id"];
            isOneToOne: false;
            referencedRelation: "employment_contracts";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "referrals_employment_contract_id_fkey";
            columns: ["employment_contract_id"];
            isOneToOne: false;
            referencedRelation: "employment_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_worker_tenant_fk";
            columns: ["tenant_id", "worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      risk_assignments: {
        Row: {
          company_id: string;
          created_at: string;
          ends_on: string | null;
          exposure_group_id: string | null;
          id: string;
          job_position_id: string | null;
          notes: string | null;
          occupational_risk_id: string;
          source: string;
          starts_on: string;
          tenant_id: string;
          version: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          ends_on?: string | null;
          exposure_group_id?: string | null;
          id?: string;
          job_position_id?: string | null;
          notes?: string | null;
          occupational_risk_id: string;
          source: string;
          starts_on: string;
          tenant_id: string;
          version?: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          ends_on?: string | null;
          exposure_group_id?: string | null;
          id?: string;
          job_position_id?: string | null;
          notes?: string | null;
          occupational_risk_id?: string;
          source?: string;
          starts_on?: string;
          tenant_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "risk_assignments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "risk_assignments_exposure_group_id_fkey";
            columns: ["exposure_group_id"];
            isOneToOne: false;
            referencedRelation: "exposure_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "risk_assignments_job_position_id_fkey";
            columns: ["job_position_id"];
            isOneToOne: false;
            referencedRelation: "job_positions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "risk_assignments_occupational_risk_id_fkey";
            columns: ["occupational_risk_id"];
            isOneToOne: false;
            referencedRelation: "occupational_risks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "risk_assignments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          permission_id: string;
          role_id: string;
        };
        Insert: {
          permission_id: string;
          role_id: string;
        };
        Update: {
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          is_system: boolean;
          name: string;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          is_system?: boolean;
          name: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          is_system?: boolean;
          name?: string;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      schedule_resources: {
        Row: {
          clinic_unit_id: string;
          code: string;
          created_at: string;
          id: string;
          name: string;
          resource_type: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          clinic_unit_id: string;
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          resource_type: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          clinic_unit_id?: string;
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          resource_type?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedule_resources_clinic_unit_id_fkey";
            columns: ["clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedule_resources_clinic_unit_tenant_fk";
            columns: ["tenant_id", "clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "schedule_resources_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      sectors: {
        Row: {
          code: string;
          company_id: string;
          created_at: string;
          establishment_id: string | null;
          id: string;
          name: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          company_id: string;
          created_at?: string;
          establishment_id?: string | null;
          id?: string;
          name: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          company_id?: string;
          created_at?: string;
          establishment_id?: string | null;
          id?: string;
          name?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sectors_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sectors_company_tenant_fk";
            columns: ["tenant_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "sectors_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "company_establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sectors_establishment_tenant_fk";
            columns: ["tenant_id", "establishment_id"];
            isOneToOne: false;
            referencedRelation: "company_establishments";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "sectors_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      spirometry_calibrations: {
        Row: {
          created_at: string;
          equipment_name: string;
          equipment_serial: string;
          id: string;
          status: string;
          tenant_id: string;
          valid_until: string;
          verification_payload: Json;
          verified_at: string;
        };
        Insert: {
          created_at?: string;
          equipment_name: string;
          equipment_serial: string;
          id?: string;
          status?: string;
          tenant_id: string;
          valid_until: string;
          verification_payload?: Json;
          verified_at: string;
        };
        Update: {
          created_at?: string;
          equipment_name?: string;
          equipment_serial?: string;
          id?: string;
          status?: string;
          tenant_id?: string;
          valid_until?: string;
          verification_payload?: Json;
          verified_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spirometry_calibrations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      spirometry_maneuvers: {
        Row: {
          accepted: boolean;
          attempt_number: number;
          created_at: string;
          created_by: string;
          curve_attachment_refs: Json;
          id: string;
          measured_values: Json;
          percentages: Json;
          predicted_values: Json;
          quality_grade: string;
          spirometry_result_id: string;
          technical_notes: string | null;
          tenant_id: string;
        };
        Insert: {
          accepted?: boolean;
          attempt_number: number;
          created_at?: string;
          created_by: string;
          curve_attachment_refs?: Json;
          id?: string;
          measured_values: Json;
          percentages: Json;
          predicted_values: Json;
          quality_grade: string;
          spirometry_result_id: string;
          technical_notes?: string | null;
          tenant_id: string;
        };
        Update: {
          accepted?: boolean;
          attempt_number?: number;
          created_at?: string;
          created_by?: string;
          curve_attachment_refs?: Json;
          id?: string;
          measured_values?: Json;
          percentages?: Json;
          predicted_values?: Json;
          quality_grade?: string;
          spirometry_result_id?: string;
          technical_notes?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spirometry_maneuvers_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spirometry_maneuvers_spirometry_result_id_fkey";
            columns: ["spirometry_result_id"];
            isOneToOne: false;
            referencedRelation: "spirometry_results";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spirometry_maneuvers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      spirometry_predicted_value_sets: {
        Row: {
          code: string;
          created_at: string;
          formula_metadata: Json;
          id: string;
          name: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          formula_metadata: Json;
          id?: string;
          name: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          formula_metadata?: Json;
          id?: string;
          name?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spirometry_predicted_value_sets_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      spirometry_result_versions: {
        Row: {
          accepted_maneuver_snapshot: Json | null;
          bronchodilator: Json;
          correction_reason: string;
          created_at: string;
          created_by: string;
          id: string;
          inconclusive_reason: string | null;
          professional_conclusion: string | null;
          required_inputs: Json;
          spirometry_result_id: string;
          tenant_id: string;
          version: number;
        };
        Insert: {
          accepted_maneuver_snapshot?: Json | null;
          bronchodilator?: Json;
          correction_reason: string;
          created_at?: string;
          created_by: string;
          id?: string;
          inconclusive_reason?: string | null;
          professional_conclusion?: string | null;
          required_inputs: Json;
          spirometry_result_id: string;
          tenant_id: string;
          version: number;
        };
        Update: {
          accepted_maneuver_snapshot?: Json | null;
          bronchodilator?: Json;
          correction_reason?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          inconclusive_reason?: string | null;
          professional_conclusion?: string | null;
          required_inputs?: Json;
          spirometry_result_id?: string;
          tenant_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "spirometry_result_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spirometry_result_versions_spirometry_result_id_fkey";
            columns: ["spirometry_result_id"];
            isOneToOne: false;
            referencedRelation: "spirometry_results";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spirometry_result_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      spirometry_results: {
        Row: {
          accepted_maneuver_id: string | null;
          calibration_id: string | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          current_version: number;
          encounter_id: string;
          exam_order_id: string;
          id: string;
          predicted_value_set_id: string | null;
          started_at: string;
          started_by: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          accepted_maneuver_id?: string | null;
          calibration_id?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          current_version?: number;
          encounter_id: string;
          exam_order_id: string;
          id?: string;
          predicted_value_set_id?: string | null;
          started_at?: string;
          started_by: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          accepted_maneuver_id?: string | null;
          calibration_id?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          current_version?: number;
          encounter_id?: string;
          exam_order_id?: string;
          id?: string;
          predicted_value_set_id?: string | null;
          started_at?: string;
          started_by?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spirometry_results_accepted_maneuver_id_fkey";
            columns: ["accepted_maneuver_id"];
            isOneToOne: false;
            referencedRelation: "spirometry_maneuvers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spirometry_results_calibration_id_fkey";
            columns: ["calibration_id"];
            isOneToOne: false;
            referencedRelation: "spirometry_calibrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spirometry_results_completed_by_fkey";
            columns: ["completed_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spirometry_results_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spirometry_results_exam_order_id_fkey";
            columns: ["exam_order_id"];
            isOneToOne: false;
            referencedRelation: "exam_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spirometry_results_predicted_value_set_id_fkey";
            columns: ["predicted_value_set_id"];
            isOneToOne: false;
            referencedRelation: "spirometry_predicted_value_sets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spirometry_results_started_by_fkey";
            columns: ["started_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spirometry_results_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_memberships: {
        Row: {
          created_at: string;
          id: string;
          status: string;
          tenant_id: string;
          updated_at: string;
          user_id: string;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
          user_id: string;
          valid_from?: string;
          valid_until?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
          user_id?: string;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          created_at: string;
          id: string;
          legal_name: string;
          status: string;
          timezone: string;
          trade_name: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          legal_name: string;
          status?: string;
          timezone?: string;
          trade_name?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          legal_name?: string;
          status?: string;
          timezone?: string;
          trade_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      triage_form_templates: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          name: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "triage_form_templates_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      triage_form_versions: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          id: string;
          schema_json: Json;
          status: string;
          template_id: string;
          tenant_id: string;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          id?: string;
          schema_json: Json;
          status?: string;
          template_id: string;
          tenant_id: string;
          version: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          id?: string;
          schema_json?: Json;
          status?: string;
          template_id?: string;
          tenant_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "triage_form_versions_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "triage_form_versions_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "triage_form_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "triage_form_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      triage_record_versions: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          payload: Json;
          reason: string;
          tenant_id: string;
          triage_record_id: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          payload: Json;
          reason: string;
          tenant_id: string;
          triage_record_id: string;
          version: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          payload?: Json;
          reason?: string;
          tenant_id?: string;
          triage_record_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "triage_record_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "triage_record_versions_record_tenant_fk";
            columns: ["tenant_id", "triage_record_id"];
            isOneToOne: false;
            referencedRelation: "triage_records";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "triage_record_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "triage_record_versions_triage_record_id_fkey";
            columns: ["triage_record_id"];
            isOneToOne: false;
            referencedRelation: "triage_records";
            referencedColumns: ["id"];
          },
        ];
      };
      triage_records: {
        Row: {
          closed_at: string | null;
          closed_by: string | null;
          created_at: string;
          created_by: string;
          current_version: number;
          encounter_id: string;
          form_version_id: string;
          id: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          created_by: string;
          current_version?: number;
          encounter_id: string;
          form_version_id: string;
          id?: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          created_by?: string;
          current_version?: number;
          encounter_id?: string;
          form_version_id?: string;
          id?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "triage_records_closed_by_fkey";
            columns: ["closed_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "triage_records_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "triage_records_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "triage_records_encounter_tenant_fk";
            columns: ["tenant_id", "encounter_id"];
            isOneToOne: true;
            referencedRelation: "encounters";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "triage_records_form_version_id_fkey";
            columns: ["form_version_id"];
            isOneToOne: false;
            referencedRelation: "triage_form_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "triage_records_form_version_tenant_fk";
            columns: ["tenant_id", "form_version_id"];
            isOneToOne: false;
            referencedRelation: "triage_form_versions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "triage_records_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      visual_acuity_result_versions: {
        Row: {
          binocular: Json;
          chart_type: string;
          correction_reason: string;
          created_at: string;
          created_by: string;
          equipment_name: string;
          id: string;
          left_eye: Json;
          observations: string | null;
          professional_conclusion: string | null;
          right_eye: Json;
          tenant_id: string;
          test_conditions: Json;
          version: number;
          visual_acuity_result_id: string;
        };
        Insert: {
          binocular: Json;
          chart_type: string;
          correction_reason: string;
          created_at?: string;
          created_by: string;
          equipment_name: string;
          id?: string;
          left_eye: Json;
          observations?: string | null;
          professional_conclusion?: string | null;
          right_eye: Json;
          tenant_id: string;
          test_conditions: Json;
          version: number;
          visual_acuity_result_id: string;
        };
        Update: {
          binocular?: Json;
          chart_type?: string;
          correction_reason?: string;
          created_at?: string;
          created_by?: string;
          equipment_name?: string;
          id?: string;
          left_eye?: Json;
          observations?: string | null;
          professional_conclusion?: string | null;
          right_eye?: Json;
          tenant_id?: string;
          test_conditions?: Json;
          version?: number;
          visual_acuity_result_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visual_acuity_result_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visual_acuity_result_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visual_acuity_result_versions_visual_acuity_result_id_fkey";
            columns: ["visual_acuity_result_id"];
            isOneToOne: false;
            referencedRelation: "visual_acuity_results";
            referencedColumns: ["id"];
          },
        ];
      };
      visual_acuity_results: {
        Row: {
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          current_version: number;
          encounter_id: string;
          exam_order_id: string;
          id: string;
          started_at: string;
          started_by: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          current_version?: number;
          encounter_id: string;
          exam_order_id: string;
          id?: string;
          started_at?: string;
          started_by: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          current_version?: number;
          encounter_id?: string;
          exam_order_id?: string;
          id?: string;
          started_at?: string;
          started_by?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visual_acuity_results_completed_by_fkey";
            columns: ["completed_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visual_acuity_results_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visual_acuity_results_exam_order_id_fkey";
            columns: ["exam_order_id"];
            isOneToOne: false;
            referencedRelation: "exam_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visual_acuity_results_started_by_fkey";
            columns: ["started_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visual_acuity_results_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      waitlist_entries: {
        Row: {
          clinic_unit_id: string;
          created_at: string;
          desired_from: string | null;
          id: string;
          priority: number;
          referral_id: string;
          status: string;
          tenant_id: string;
        };
        Insert: {
          clinic_unit_id: string;
          created_at?: string;
          desired_from?: string | null;
          id?: string;
          priority?: number;
          referral_id: string;
          status?: string;
          tenant_id: string;
        };
        Update: {
          clinic_unit_id?: string;
          created_at?: string;
          desired_from?: string | null;
          id?: string;
          priority?: number;
          referral_id?: string;
          status?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_clinic_unit_id_fkey";
            columns: ["clinic_unit_id"];
            isOneToOne: false;
            referencedRelation: "clinic_units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "waitlist_entries_referral_id_fkey";
            columns: ["referral_id"];
            isOneToOne: false;
            referencedRelation: "referrals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      worker_identifiers: {
        Row: {
          created_at: string;
          id: string;
          identifier_hash: string;
          identifier_type: string;
          tenant_id: string;
          worker_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          identifier_hash: string;
          identifier_type: string;
          tenant_id: string;
          worker_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          identifier_hash?: string;
          identifier_type?: string;
          tenant_id?: string;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "worker_identifiers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "worker_identifiers_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
        ];
      };
      workers: {
        Row: {
          cpf_ciphertext: string | null;
          cpf_lookup_hash: string | null;
          created_at: string;
          full_name: string;
          id: string;
          status: string;
          tenant_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          cpf_ciphertext?: string | null;
          cpf_lookup_hash?: string | null;
          created_at?: string;
          full_name: string;
          id?: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          cpf_ciphertext?: string | null;
          cpf_lookup_hash?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "workers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      append_audit_log: {
        Args: {
          audit_action: string;
          audit_entity_id: string;
          audit_entity_type: string;
          audit_metadata_redacted?: Json;
          audit_request_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      check_in_appointment: {
        Args: {
          audit_request_id: string;
          idempotency_key_value: string;
          target_appointment_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      close_medical_consultation: {
        Args: {
          assessment_value: string;
          audit_request_id: string;
          change_reason: string;
          objective_value: Json;
          physician_credential_id_value: string;
          plan_value: string;
          subjective_value: Json;
          target_encounter_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      create_call_event: {
        Args: {
          audit_request_id: string;
          call_action: string;
          target_display_panel_id: string;
          target_queue_ticket_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      create_clinic_unit: {
        Args: {
          audit_request_id: string;
          target_tenant_id: string;
          unit_code: string;
          unit_name: string;
        };
        Returns: string;
      };
      create_encounter_price_snapshot: {
        Args: {
          audit_request_id: string;
          content_hash_value: string;
          snapshot_payload_value: Json;
          target_contract_id: string;
          target_encounter_id: string;
          target_price_table_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      create_esocial_event: {
        Args: {
          audit_request_id: string;
          business_key_value: string;
          environment_value: string;
          event_type_value: string;
          idempotency_key_value: string;
          layout_version_id_value: string;
          operation_type_value: string;
          payload_hash_value: string;
          payload_value: Json;
          previous_event_id_value: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      create_exam_protocol_override: {
        Args: {
          audit_request_id: string;
          override_action: string;
          override_justification: string;
          target_employment_contract_id: string;
          target_exam_catalog_id: string;
          target_exam_protocol_id: string;
          target_tenant_id: string;
          target_worker_id: string;
        };
        Returns: string;
      };
      create_generated_document_version: {
        Args: {
          audit_request_id: string;
          content_hash_value: string;
          document_type_value: string;
          idempotency_key_value: string;
          rectification_reason_value: string;
          snapshot_payload_value: Json;
          storage_path_value: string;
          target_encounter_id: string;
          target_template_version_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      create_medical_conclusion: {
        Args: {
          audit_request_id: string;
          conclusion_code_value: string;
          consultation_id_value: string;
          notes_value: string;
          physician_credential_id_value: string;
          restrictions_value: Json;
          target_encounter_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      create_occupational_company: {
        Args: {
          audit_request_id: string;
          company_legal_name: string;
          company_tax_id: string;
          company_trade_name: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      create_occupational_worker: {
        Args: {
          audit_request_id: string;
          target_tenant_id: string;
          worker_cpf: string;
          worker_full_name: string;
        };
        Returns: string;
      };
      create_scheduled_appointment: {
        Args: {
          audit_request_id: string;
          ends_at_value: string;
          preparation_text: string;
          starts_at_value: string;
          target_clinic_unit_id: string;
          target_referral_id: string;
          target_resource_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      enqueue_integration_job: {
        Args: {
          audit_request_id: string;
          idempotency_key_value: string;
          job_type_value: string;
          payload_redacted_value: Json;
          target_connection_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      enqueue_message: {
        Args: {
          audit_request_id: string;
          channel_value: string;
          connection_id_value: string;
          destination_hash_value: string;
          idempotency_key_value: string;
          payload_redacted_value: Json;
          recipient_reference_value: string;
          recipient_type_value: string;
          target_tenant_id: string;
          template_version_id_value: string;
        };
        Returns: string;
      };
      enrich_triage_payload: { Args: { payload_value: Json }; Returns: Json };
      get_my_authorization_context: {
        Args: { target_tenant_id: string };
        Returns: Json;
      };
      has_company_permission: {
        Args: { permission_code: string; target_company_id: string };
        Returns: boolean;
      };
      has_document_permission: {
        Args: { permission_code: string; target_document_id: string };
        Returns: boolean;
      };
      has_encounter_permission: {
        Args: { permission_code: string; target_encounter_id: string };
        Returns: boolean;
      };
      has_professional_permission: {
        Args: { permission_code: string; target_professional_id: string };
        Returns: boolean;
      };
      has_tenant_permission: {
        Args: { permission_code: string; target_tenant_id: string };
        Returns: boolean;
      };
      has_tenant_or_any_unit_permission: {
        Args: {
          permission_code: string;
          target_tenant_id: string;
        };
        Returns: boolean;
      };

      has_unit_permission: {
        Args: { permission_code: string; target_unit_id: string };
        Returns: boolean;
      };
      is_aal2: { Args: never; Returns: boolean };
      is_active_tenant_member: {
        Args: { target_tenant_id: string };
        Returns: boolean;
      };
      issue_invoice: {
        Args: {
          audit_request_id: string;
          billing_item_ids: string[];
          due_on_value: string;
          target_company_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      log_audit: {
        Args: {
          audit_action: string;
          audit_entity_id: string;
          audit_entity_type: string;
          audit_metadata_redacted?: Json;
          audit_request_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      mark_integration_attempt: {
        Args: {
          audit_request_id: string;
          error_redacted: string;
          succeeded: boolean;
          target_job_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      provision_tenant_for_user: {
        Args: {
          target_user_id: string;
          tenant_legal_name: string;
          tenant_trade_name?: string;
        };
        Returns: string;
      };
      record_connector_event: {
        Args: {
          audit_request_id: string;
          event_type_value: string;
          idempotency_key_value: string;
          payload_redacted_value: Json;
          target_connector_id: string;
          target_equipment_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      record_esocial_rejection: {
        Args: {
          audit_request_id: string;
          code_value: string;
          message_value: string;
          payload_redacted_value: Json;
          target_event_id: string;
          target_submission_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      record_laboratory_sample_event: {
        Args: {
          audit_request_id: string;
          event_type_value: string;
          payload_value: Json;
          target_sample_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      save_audiometry_result: {
        Args: {
          audit_request_id: string;
          booth_value: Json;
          calibration_id_value: string;
          comparison_value: Json;
          complaints_value: Json;
          complete_result: boolean;
          correction_reason_value: string;
          equipment_value: Json;
          inconclusive_result: boolean;
          masking_value: Json;
          normalized_payload_value: Json;
          occupational_data_value: Json;
          original_import_payload_value: Json;
          otoscopy_value: Json;
          professional_conclusion_value: string;
          report_value: string;
          rest_reported_value: Json;
          target_result_id: string;
          target_tenant_id: string;
          thresholds_value: Json;
        };
        Returns: string;
      };
      save_diagnostic_exam_result: {
        Args: {
          audit_request_id: string;
          correction_reason_value: string;
          equipment_value: Json;
          execution_value: Json;
          external_result_validation_value: Json;
          image_or_pdf_refs_value: Json;
          modality_value: string;
          preparation_value: Json;
          professional_conclusion_value: string;
          raw_file_refs_value: Json;
          report_value: string;
          status_value: string;
          target_exam_order_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      save_laboratory_result: {
        Args: {
          audit_request_id: string;
          correction_reason: string;
          critical_flag_value: boolean;
          reference_range_snapshot_value: Json;
          result_payload_value: Json;
          status_value: string;
          target_order_item_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      save_medical_consultation: {
        Args: {
          assessment_value: string;
          audit_request_id: string;
          change_reason: string;
          close_record: boolean;
          objective_value: Json;
          physician_credential_id_value: string;
          plan_value: string;
          subjective_value: Json;
          target_encounter_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      save_spirometry_maneuver: {
        Args: {
          accept_maneuver: boolean;
          attempt_number_value: number;
          audit_request_id: string;
          bronchodilator_value: Json;
          calibration_id_value: string;
          complete_result: boolean;
          correction_reason_value: string;
          curve_attachment_refs_value: Json;
          inconclusive_reason_value: string;
          inconclusive_result: boolean;
          measured_values_value: Json;
          percentages_value: Json;
          predicted_value_set_id_value: string;
          predicted_values_value: Json;
          professional_conclusion_value: string;
          quality_grade_value: string;
          required_inputs_value: Json;
          target_result_id: string;
          target_tenant_id: string;
          technical_notes_value: string;
        };
        Returns: string;
      };
      save_triage_record: {
        Args: {
          audit_request_id: string;
          change_reason: string;
          close_record: boolean;
          payload_value: Json;
          target_encounter_id: string;
          target_form_version_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      save_visual_acuity_result: {
        Args: {
          audit_request_id: string;
          binocular_value: Json;
          chart_type_value: string;
          complete_result: boolean;
          correction_reason_value: string;
          equipment_name_value: string;
          left_eye_value: Json;
          observations_value: string;
          professional_conclusion_value: string;
          right_eye_value: Json;
          target_result_id: string;
          target_tenant_id: string;
          test_conditions_value: Json;
        };
        Returns: string;
      };
      set_membership_status: {
        Args: {
          audit_request_id: string;
          new_status: string;
          target_membership_id: string;
          target_tenant_id: string;
        };
        Returns: undefined;
      };
      assign_membership_role: {
        Args: {
          audit_request_id: string;
          target_clinic_unit_id: string | null;
          target_membership_id: string;
          target_role_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      revoke_membership_role: {
        Args: {
          audit_request_id: string;
          target_membership_role_id: string;
          target_tenant_id: string;
        };
        Returns: undefined;
      };
      log_sensitive_read: {
        Args: {
          access_result: string;
          audit_action: string;
          audit_entity_id: string | null;
          audit_entity_type: string;
          audit_request_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      log_document_access: {
        Args: {
          access_type_value: string;
          audit_request_id: string;
          expires_at_value: string | null;
          target_document_version_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      sign_document_version: {
        Args: {
          aal_value: string;
          audit_request_id: string;
          ip_value: unknown;
          method_value: string;
          signed_hash_value: string;
          target_document_version_id: string;
          target_tenant_id: string;
          user_agent_value: string;
        };
        Returns: string;
      };
      start_audiometry_exam: {
        Args: {
          audit_request_id: string;
          target_exam_order_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      start_spirometry_exam: {
        Args: {
          audit_request_id: string;
          target_exam_order_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
      start_visual_acuity_exam: {
        Args: {
          audit_request_id: string;
          target_exam_order_id: string;
          target_tenant_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
