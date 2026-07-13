"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { resolveAuthorizationContext } from "@/core/auth/session";

function redirectWithTenantError(message: string): never {
  redirect(`/select-tenant?error=${encodeURIComponent(message)}`);
}

export async function selectTenant(formData: FormData) {
  const tenantId = z.uuid().parse(formData.get("tenantId"));

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

  const cookieStore = await cookies();
  cookieStore.set("gestorpro_tenant", tenantId, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  redirect("/app");
}
