import { describe, expect, it } from "vitest";
import { hasSupabaseAuthCookie } from "@/lib/supabase/auth-cookie";

describe("Supabase auth cookie detection", () => {
  it("detects normal and chunked auth cookies", () => {
    expect(hasSupabaseAuthCookie([{ name: "sb-project-auth-token" }])).toBe(true);
    expect(hasSupabaseAuthCookie([{ name: "sb-project-auth-token.0" }])).toBe(true);
  });

  it("does not treat arbitrary cookies as authentication", () => {
    expect(
      hasSupabaseAuthCookie([{ name: "gestorpro_tenant" }, { name: "sb-project-other" }]),
    ).toBe(false);
  });
});
