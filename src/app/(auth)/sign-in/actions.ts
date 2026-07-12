"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SignInState = { error?: string };

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export async function signIn(_state: SignInState, formData: FormData): Promise<SignInState> {
  const input = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!input.success) return { error: "Informe e-mail e senha válidos." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(input.data);
  if (error) return { error: "Não foi possível autenticar com essas credenciais." };

  redirect("/select-tenant");
}
