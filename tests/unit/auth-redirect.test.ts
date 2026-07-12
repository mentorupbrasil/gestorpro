import { describe, expect, it } from "vitest";
import { getSafeAuthRedirect } from "@/core/auth/redirect";

describe("auth redirect allowlist", () => {
  it("accepts known internal auth destinations", () => {
    expect(getSafeAuthRedirect("/select-tenant")).toBe("/select-tenant");
    expect(getSafeAuthRedirect("/update-password")).toBe("/update-password");
  });

  it("rejects external or unexpected destinations", () => {
    expect(getSafeAuthRedirect("https://example.com")).toBe("/select-tenant");
    expect(getSafeAuthRedirect("//example.com")).toBe("/select-tenant");
    expect(getSafeAuthRedirect("/app")).toBe("/select-tenant");
    expect(getSafeAuthRedirect(null, "/fallback")).toBe("/fallback");
  });
});
