"use server";

import { z } from "zod";
import { getServerEnv } from "@/lib/env/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ForgotPasswordState = { error?: string; message?: string };

const forgotPasswordSchema = z.object({
  email: z.email(),
});

const uniformRecoveryMessage =
  "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.";

export async function requestPasswordReset(
  _state: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const input = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!input.success) return { error: "Informe um e-mail válido." };

  const supabase = await createServerSupabaseClient();
  const redirectTo = new URL("/auth/callback", getServerEnv().APP_URL);
  redirectTo.searchParams.set("next", "/update-password");

  await supabase.auth.resetPasswordForEmail(input.data.email, {
    redirectTo: redirectTo.toString(),
  });

  return { message: uniformRecoveryMessage };
}
