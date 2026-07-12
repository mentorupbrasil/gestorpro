import { describe, expect, it } from "vitest";
import { passwordSchema } from "@/core/auth/password";

describe("password policy", () => {
  it("requires a strong password", () => {
    expect(passwordSchema.safeParse("SenhaForte-2026!").success).toBe(true);
  });

  it("rejects weak password variants", () => {
    expect(passwordSchema.safeParse("curta1A!").success).toBe(false);
    expect(passwordSchema.safeParse("sem-maiuscula-2026!").success).toBe(false);
    expect(passwordSchema.safeParse("SEM-MINUSCULA-2026!").success).toBe(false);
    expect(passwordSchema.safeParse("SemNumero!Seguro").success).toBe(false);
    expect(passwordSchema.safeParse("SemEspecial2026").success).toBe(false);
  });
});
