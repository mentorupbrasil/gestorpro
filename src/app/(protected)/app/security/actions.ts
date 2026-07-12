"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { mfaFactorIdSchema, totpCodeSchema } from "@/core/auth/mfa";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TotpEnrollmentState = {
  enrollment?: {
    factorId: string;
    qrCode: string;
    secret: string;
    uri: string;
  };
  error?: string;
  success?: string;
};

export type TotpVerificationState = { error?: string; success?: string };

const verifySchema = z.object({
  code: totpCodeSchema,
  factorId: mfaFactorIdSchema,
});

export async function startTotpEnrollment(): Promise<TotpEnrollmentState> {
  const supabase = await createServerSupabaseClient();
  const { error: userError } = await supabase.auth.getUser();
  if (userError) return { error: "Sessão expirada. Entre novamente." };

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "GestorPro",
  });

  if (error) {
    return { error: "Não foi possível iniciar o cadastro do MFA." };
  }

  return {
    enrollment: {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    },
  };
}

export async function verifyTotpEnrollment(
  _state: TotpVerificationState,
  formData: FormData,
): Promise<TotpVerificationState> {
  return verifyTotp(formData, "MFA ativado com sucesso.");
}

export async function verifyTotpChallenge(
  _state: TotpVerificationState,
  formData: FormData,
): Promise<TotpVerificationState> {
  return verifyTotp(formData, "Sessão reforçada com MFA.");
}

export async function unenrollTotpFactor(
  _state: TotpVerificationState,
  formData: FormData,
): Promise<TotpVerificationState> {
  const input = z
    .object({ factorId: mfaFactorIdSchema })
    .safeParse({ factorId: formData.get("factorId") });
  if (!input.success) return { error: "Fator MFA inválido." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId: input.data.factorId });
  if (error) return { error: "Não foi possível remover o fator. Confirme o MFA antes." };

  revalidatePath("/app/security");
  return { success: "Fator MFA removido." };
}

async function verifyTotp(formData: FormData, success: string): Promise<TotpVerificationState> {
  const input = verifySchema.safeParse({
    code: formData.get("code"),
    factorId: formData.get("factorId"),
  });
  if (!input.success) return { error: input.error.issues[0]?.message ?? "Código inválido." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify(input.data);
  if (error) return { error: "Código MFA inválido ou expirado." };

  revalidatePath("/app/security");
  revalidatePath("/app");
  return { success };
}
