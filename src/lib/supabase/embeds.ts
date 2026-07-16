/**
 * PostgREST hints for composite + legacy FKs on the same columns (PGRST201).
 * Prefer the tenant-scoped composite constraint.
 */
export const EXAM_ORDER_CATALOG_EMBED = "exam_catalog!exam_orders_exam_catalog_tenant_fk";
export const EXAM_PROTOCOL_ITEM_CATALOG_EMBED =
  "exam_catalog!exam_protocol_items_catalog_tenant_fk";
export const EXAM_PROTOCOL_OVERRIDE_CATALOG_EMBED =
  "exam_catalog!exam_protocol_overrides_catalog_tenant_fk";
export const PCMSO_VERSION_COMPANY_EMBED = "companies!pcmso_versions_company_tenant_fk";
export const REFERRAL_COMPANY_EMBED = "companies!referrals_company_tenant_fk";
export const REFERRAL_WORKER_EMBED = "workers!referrals_worker_tenant_fk";
export const ENCOUNTER_WORKER_EMBED = "workers!encounters_worker_tenant_fk";
export const BILLING_ITEM_COMPANY_EMBED = "companies!billing_items_company_tenant_fk";
export const INVOICE_COMPANY_EMBED = "companies!invoices_company_tenant_fk";
export const PORTAL_USER_COMPANY_EMBED = "companies!company_portal_users_company_tenant_fk";
export const SST_INCIDENT_COMPANY_EMBED = "companies!sst_incidents_company_tenant_fk";
export const SST_EPI_WORKER_EMBED = "workers!sst_epi_worker_tenant_fk";
export const SST_CIPA_COMPANY_EMBED = "companies!sst_cipa_company_tenant_fk";
export const SST_CIPA_WORKER_EMBED = "workers!sst_cipa_worker_tenant_fk";
export const APPOINTMENT_RESOURCE_EMBED =
  "schedule_resources!appointments_resource_tenant_fk";
export const APPOINTMENT_REFERRAL_EMBED = "referrals!appointments_referral_tenant_fk";
export const ENCOUNTER_EXAM_ORDERS_EMBED = "exam_orders!exam_orders_encounter_tenant_fk";
export const QUEUE_TICKET_DEFINITION_EMBED =
  "queue_definitions!queue_tickets_queue_definition_tenant_fk";
export const QUEUE_TICKET_ENCOUNTER_EMBED = "encounters!queue_tickets_encounter_tenant_fk";
