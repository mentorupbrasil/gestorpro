import { z } from "zod";

export const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{6}$/, "Informe o código de 6 dígitos do autenticador.");

export const mfaFactorIdSchema = z.string().min(1, "Fator MFA inválido.");

export type TotpFactorSummary = Readonly<{
  createdAt: string;
  friendlyName: string;
  id: string;
}>;

type SupabaseFactor = {
  created_at: string;
  factor_type: string;
  friendly_name?: string;
  id: string;
  status: string;
};

export function getVerifiedTotpFactors(factors: readonly SupabaseFactor[]): TotpFactorSummary[] {
  return factors
    .filter((factor) => factor.factor_type === "totp" && factor.status === "verified")
    .map((factor) => ({
      createdAt: factor.created_at,
      friendlyName: factor.friendly_name || "Aplicativo autenticador",
      id: factor.id,
    }));
}

export function getPrimaryTotpFactor(factors: readonly TotpFactorSummary[]) {
  return factors[0] ?? null;
}
