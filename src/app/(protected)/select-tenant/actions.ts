"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { provisionTenantForUser } from "@/features/platform/provisioning";
import { provisionTenantSchema } from "@/features/platform/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectWithTenantError(message: string): never {
  redirect(`/select-tenant?error=${encodeURIComponent(message)}`);
}

async function setSelectedTenantCookie(tenantId: string) {
  const cookieStore = await cookies();
  cookieStore.set("gestorpro_tenant", tenantId, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

async function enterTenant(tenantId: string) {
  let context;
  try {
    context = await resolveAuthorizationContext(tenantId);
  } catch (error) {
    if (error instanceof AppError) {
      redirectWithTenantError(error.message);
    }

    redirectWithTenantError(
      "Não foi possível validar o acesso a esta organização. Verifique se as migrations do Supabase estão aplicadas.",
    );
  }

  if (!context.permissions.has("tenant.read")) {
    redirectWithTenantError(
      "Sua conta está vinculada a esta organização, mas ainda não possui permissões de acesso. Peça a um administrador para atribuir um papel com permissão de leitura.",
    );
  }

  await setSelectedTenantCookie(tenantId);
  redirect("/app");
}

export async function selectTenant(formData: FormData) {
  const tenantId = z.uuid().parse(formData.get("tenantId"));
  await enterTenant(tenantId);
}

export type CreateOrganizationState = {
  error?: string;
  success?: string;
};

export async function createOrganization(
  _state: CreateOrganizationState,
  formData: FormData,
): Promise<CreateOrganizationState> {
  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/sign-in");
  }

  const parsed = provisionTenantSchema.safeParse({
    legalName: formData.get("legalName"),
    tradeName: formData.get("tradeName") || undefined,
  });

  if (!parsed.success) {
    return { error: "Informe a razão social da organização com pelo menos 2 caracteres." };
  }

  try {
    const tenantId = await provisionTenantForUser({
      displayName: userData.user.user_metadata?.display_name ?? userData.user.email,
      legalName: parsed.data.legalName,
      tradeName: parsed.data.tradeName,
      userId: userData.user.id,
    });

    await enterTenant(tenantId);
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }

    return {
      error:
        "Não foi possível criar a organização. Verifique SUPABASE_SERVICE_ROLE_KEY no .env e as migrations.",
    };
  }

  return {};
}
