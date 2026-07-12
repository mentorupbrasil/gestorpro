import { describe, expect, it } from "vitest";
import { requireAal2, requireClinicUnit, requirePermission } from "@/core/auth/authorization";
import type { AuthorizationContext } from "@/core/auth/authorization";

const context: AuthorizationContext = {
  aal: "aal1",
  clinicUnitIds: new Set(["5dc038d8-f7a1-4ecf-87bc-15cc72c39f38"]),
  permissions: new Set(["tenant.read", "units.read"]),
  tenantId: "01e54c4d-b899-43d7-9bd8-bb5694cf40f9",
  userId: "c83445c1-8744-4289-9af5-10261745a64d",
};

describe("authorization", () => {
  it("requires an authenticated context", () => {
    expect(() => requirePermission(null, "tenant.read")).toThrowError(
      expect.objectContaining({ code: "AUTHENTICATION_REQUIRED", status: 401 }),
    );
  });

  it("denies a missing permission", () => {
    expect(() => requirePermission(context, "tenant.manage")).toThrowError(
      expect.objectContaining({ code: "PERMISSION_DENIED", status: 403 }),
    );
  });

  it("returns context when permission is granted", () => {
    expect(requirePermission(context, "tenant.read")).toBe(context);
  });

  it("denies a clinic unit outside membership scope", () => {
    expect(() => requireClinicUnit(context, "14fa3769-3034-4fbf-b0a7-815f1abfce6c")).toThrowError(
      expect.objectContaining({ code: "TENANT_ACCESS_DENIED" }),
    );
  });

  it("requires aal2 for critical operations", () => {
    expect(() => requireAal2(context)).toThrowError(expect.objectContaining({ status: 403 }));
  });
});
