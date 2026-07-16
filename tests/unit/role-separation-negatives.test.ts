import { describe, expect, it } from "vitest";
import { permissionForStepType } from "@/features/encounters/step-permissions";
import {
  hasTenantOrUnitPermission,
  requireTenantOrUnitPermission,
  type AuthorizationContext,
} from "@/core/auth/authorization";
import type { Permission } from "@/core/auth/permissions";

const unitId = "5dc038d8-f7a1-4ecf-87bc-15cc72c39f38";

function ctx(permissions: Permission[], unitPermissions: Permission[] = []): AuthorizationContext {
  return {
    aal: "aal2",
    clinicUnitIds: new Set([unitId]),
    permissions: new Set(permissions),
    tenantId: "01e54c4d-b899-43d7-9bd8-bb5694cf40f9",
    unitPermissions: new Map([[unitId, new Set(unitPermissions)]]),
    userId: "c83445c1-8744-4289-9af5-10261745a64d",
  };
}

describe("role separation negatives", () => {
  it("receptionist cannot move triage/consultation/conclusion/billing steps", () => {
    const receptionist = ctx([], ["encounters.manage"]);
    expect(hasTenantOrUnitPermission(receptionist, permissionForStepType("triage"))).toBe(false);
    expect(hasTenantOrUnitPermission(receptionist, permissionForStepType("consultation"))).toBe(
      false,
    );
    expect(hasTenantOrUnitPermission(receptionist, permissionForStepType("conclusion"))).toBe(
      false,
    );
    expect(hasTenantOrUnitPermission(receptionist, permissionForStepType("billing"))).toBe(false);
    expect(() => requireTenantOrUnitPermission(receptionist, "triage.manage")).toThrowError(
      expect.objectContaining({ code: "PERMISSION_DENIED" }),
    );
  });

  it("nursing cannot sign conclusion or manage finance", () => {
    const nursing = ctx([], ["triage.manage", "clinical.read"]);
    expect(hasTenantOrUnitPermission(nursing, "conclusions.manage")).toBe(false);
    expect(hasTenantOrUnitPermission(nursing, "documents.sign")).toBe(false);
    expect(hasTenantOrUnitPermission(nursing, "finance.manage")).toBe(false);
  });

  it("finance cannot read clinical chart permissions", () => {
    const finance = ctx([], ["finance.manage", "finance.read"]);
    expect(hasTenantOrUnitPermission(finance, "clinical.read")).toBe(false);
    expect(hasTenantOrUnitPermission(finance, "triage.manage")).toBe(false);
  });

  it("physician cannot manage price tables", () => {
    const physician = ctx([], ["consultations.manage", "conclusions.manage", "clinical.read"]);
    expect(hasTenantOrUnitPermission(physician, "pricing.manage")).toBe(false);
    expect(hasTenantOrUnitPermission(physician, "finance.manage")).toBe(false);
  });

  it("document operator cannot alter medical conclusion", () => {
    const docs = ctx([], ["documents.manage", "documents.sign", "documents.deliver"]);
    expect(hasTenantOrUnitPermission(docs, "conclusions.manage")).toBe(false);
    expect(hasTenantOrUnitPermission(docs, "consultations.manage")).toBe(false);
  });

  it("tenant admin without clinical unit grant does not auto-receive triage", () => {
    const adminOnly = ctx(["tenant.manage", "roles.manage", "units.manage"]);
    expect(hasTenantOrUnitPermission(adminOnly, "triage.manage")).toBe(false);
    expect(hasTenantOrUnitPermission(adminOnly, "conclusions.manage")).toBe(false);
  });
});
