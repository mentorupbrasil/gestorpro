"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppError } from "@/core/errors/app-error";
import { provisionTenantForUser } from "@/features/platform/provisioning";
import { signUpSchema } from "@/features/platform/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SignUpState = {
  error?: string;
  success?: string;
};

export async function signUp(_state: SignUpState, formData: FormData): Promise<SignUpState> {
  const input = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    legalName: formData.get("legalName"),
    password: formData.get("password"),
    tradeName: formData.get("tradeName") || undefined,
  });

  if (!input.success) {
    return { error: "Preencha nome, e-mail, senha (mín. 8) e razão social da organização." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.data.email,
    options: {
      data: {
        display_name: input.data.displayName,
      },
    },
    password: input.data.password,
  });

  if (error) {
    return { error: "Não foi possível criar a conta. Verifique se o e-mail já está em uso." };
  }

  if (!data.user) {
    return { error: "Não foi possível concluir o cadastro." };
  }

  if (!data.session) {
    return {
      success:
        "Conta criada. Confirme seu e-mail (se o Supabase exigir) e depois faça login. Na primeira entrada, use “Criar minha organização” com a mesma razão social.",
    };
  }

  try {
    const tenantId = await provisionTenantForUser({
      displayName: input.data.displayName,
      legalName: input.data.legalName,
      tradeName: input.data.tradeName,
      userId: data.user.id,
    });

    const cookieStore = await cookies();
    cookieStore.set("gestorpro_tenant", tenantId, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  } catch (provisionError) {
    if (provisionError instanceof AppError) {
      return {
        error: `${provisionError.message} Faça login e use “Criar minha organização”.`,
      };
    }

    return {
      error:
        "Conta criada, mas a organização não pôde ser provisionada. Configure SUPABASE_SERVICE_ROLE_KEY e faça login para criar a organização manualmente.",
    };
  }

  redirect("/app");
}
