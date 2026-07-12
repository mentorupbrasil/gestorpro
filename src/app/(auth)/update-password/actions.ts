"use server";

import { z } from "zod";
import { passwordSchema } from "@/core/auth/password";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UpdatePasswordState = { error?: string; message?: string };

const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "As senhas informadas não coincidem.",
    path: ["passwordConfirmation"],
  });

export async function updatePassword(
  _state: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const input = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!input.success) return { error: input.error.issues[0]?.message ?? "Senha inválida." };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sua sessão de recuperação expirou. Solicite um novo link." };
  }

  const { error } = await supabase.auth.updateUser({ password: input.data.password });
  if (error) return { error: "Não foi possível atualizar a senha. Tente novamente." };

  return { message: "Senha atualizada com segurança." };
}
