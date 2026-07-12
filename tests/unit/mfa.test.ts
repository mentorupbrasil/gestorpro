import { describe, expect, it } from "vitest";
import { getPrimaryTotpFactor, getVerifiedTotpFactors, totpCodeSchema } from "@/core/auth/mfa";

describe("mfa helpers", () => {
  it("accepts only six digit TOTP codes", () => {
    expect(totpCodeSchema.safeParse("123456").success).toBe(true);
    expect(totpCodeSchema.safeParse("12345").success).toBe(false);
    expect(totpCodeSchema.safeParse("12345a").success).toBe(false);
  });

  it("keeps only verified TOTP factors", () => {
    const factors = getVerifiedTotpFactors([
      {
        created_at: "2026-07-12T12:00:00Z",
        factor_type: "totp",
        friendly_name: "Principal",
        id: "factor-1",
        status: "verified",
      },
      {
        created_at: "2026-07-12T12:00:00Z",
        factor_type: "totp",
        id: "factor-2",
        status: "unverified",
      },
      {
        created_at: "2026-07-12T12:00:00Z",
        factor_type: "phone",
        id: "factor-3",
        status: "verified",
      },
    ]);

    expect(factors).toEqual([
      { createdAt: "2026-07-12T12:00:00Z", friendlyName: "Principal", id: "factor-1" },
    ]);
    expect(getPrimaryTotpFactor(factors)?.id).toBe("factor-1");
  });
});
