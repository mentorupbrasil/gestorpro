import { describe, expect, it } from "vitest";
import {
  accessMembershipListSchema,
  createClinicUnitSchema,
  setMembershipStatusSchema,
} from "@/features/platform/schemas";

describe("platform schemas", () => {
  it("normalizes a clinic unit code", () => {
    expect(
      createClinicUnitSchema.parse({
        code: "  for-01 ",
        name: " Unidade Fortaleza ",
        tenantId: "a0000000-0000-4000-8000-000000000001",
      }),
    ).toEqual({
      code: "FOR-01",
      name: "Unidade Fortaleza",
      tenantId: "a0000000-0000-4000-8000-000000000001",
    });
  });

  it("rejects an unsupported membership status", () => {
    expect(() =>
      setMembershipStatusSchema.parse({
        membershipId: "a1000000-0000-4000-8000-000000000001",
        status: "deleted",
        tenantId: "a0000000-0000-4000-8000-000000000001",
      }),
    ).toThrow();
  });

  it("rejects malformed persistence output before rendering", () => {
    expect(() =>
      accessMembershipListSchema.parse([
        {
          id: "not-a-uuid",
          membership_roles: [],
          status: "active",
          user_id: "also-invalid",
          user_profiles: null,
        },
      ]),
    ).toThrow();
  });
});
