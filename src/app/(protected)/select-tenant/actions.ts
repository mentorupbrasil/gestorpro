"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { resolveAuthorizationContext } from "@/core/auth/session";

export async function selectTenant(formData: FormData) {
  const tenantId = z.uuid().parse(formData.get("tenantId"));
  await resolveAuthorizationContext(tenantId);

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
