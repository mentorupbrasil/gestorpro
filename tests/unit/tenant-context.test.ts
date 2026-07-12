import { describe, expect, it } from "vitest";
import { parseTrustedTenantContext } from "@/core/tenancy/tenant-context";

describe("trusted tenant context", () => {
  it("accepts a server-resolved UUID context", () => {
    expect(
      parseTrustedTenantContext({
        tenantId: "01e54c4d-b899-43d7-9bd8-bb5694cf40f9",
        userId: "c83445c1-8744-4289-9af5-10261745a64d",
      }),
    ).toEqual({
      tenantId: "01e54c4d-b899-43d7-9bd8-bb5694cf40f9",
      userId: "c83445c1-8744-4289-9af5-10261745a64d",
    });
  });

  it("rejects arbitrary tenant input", () => {
    expect(() => parseTrustedTenantContext({ tenantId: "tenant-a", userId: "user-a" })).toThrow();
  });
});
