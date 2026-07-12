import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  legalName: text("legal_name").notNull(),
  tradeName: text("trade_name"),
  status: text("status").default("active").notNull(),
  timezone: text("timezone").default("America/Fortaleza").notNull(),
  ...timestamps,
});

export const clinicUnits = pgTable(
  "clinic_units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "restrict" })
      .notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    status: text("status").default("active").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("clinic_units_tenant_code_uq").on(table.tenantId, table.code)],
);

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name").notNull(),
  status: text("status").default("active").notNull(),
  ...timestamps,
});

export const tenantMemberships = pgTable(
  "tenant_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "restrict" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => userProfiles.id, { onDelete: "restrict" })
      .notNull(),
    status: text("status").default("active").notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }).defaultNow().notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tenant_memberships_tenant_user_uq").on(table.tenantId, table.userId),
    index("tenant_memberships_user_status_idx").on(table.userId, table.status),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("roles_global_code_uq")
      .on(table.code)
      .where(sql`${table.tenantId} is null`),
    uniqueIndex("roles_tenant_code_uq")
      .on(table.tenantId, table.code)
      .where(sql`${table.tenantId} is not null`),
  ],
);

export const permissionRecords = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "restrict" })
      .notNull(),
    permissionId: uuid("permission_id")
      .references(() => permissionRecords.id, { onDelete: "restrict" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export const membershipRoles = pgTable(
  "membership_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    membershipId: uuid("membership_id")
      .references(() => tenantMemberships.id, { onDelete: "restrict" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "restrict" })
      .notNull(),
    clinicUnitId: uuid("clinic_unit_id").references(() => clinicUnits.id, {
      onDelete: "restrict",
    }),
  },
  (table) => [
    uniqueIndex("membership_roles_tenant_scope_uq")
      .on(table.membershipId, table.roleId)
      .where(sql`${table.clinicUnitId} is null`),
    uniqueIndex("membership_roles_unit_scope_uq")
      .on(table.membershipId, table.roleId, table.clinicUnitId)
      .where(sql`${table.clinicUnitId} is not null`),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "restrict" }),
    actorUserId: uuid("actor_user_id").references(() => userProfiles.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    requestId: text("request_id").notNull(),
    metadataRedacted: jsonb("metadata_redacted")
      .$type<Readonly<Record<string, unknown>>>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(
      table.tenantId,
      table.entityType,
      table.entityId,
      table.createdAt,
    ),
  ],
);
