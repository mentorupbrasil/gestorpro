/**
 * PostgREST hints for composite + legacy FKs on the same columns (PGRST201).
 * Prefer the tenant-scoped composite constraint.
 */
export const EXAM_ORDER_CATALOG_EMBED = "exam_catalog!exam_orders_exam_catalog_tenant_fk";
export const EXAM_PROTOCOL_ITEM_CATALOG_EMBED =
  "exam_catalog!exam_protocol_items_catalog_tenant_fk";
export const EXAM_PROTOCOL_OVERRIDE_CATALOG_EMBED =
  "exam_catalog!exam_protocol_overrides_catalog_tenant_fk";
