import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabaseAuthCookie } from "@/lib/supabase/auth-cookie";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WorkspaceShell } from "./_components/workspace-shell";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  if (!hasSupabaseAuthCookie(cookieStore.getAll())) redirect("/sign-in");

  const selectedTenantId = cookieStore.get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const supabase = await createServerSupabaseClient();
  const [{ data: userData }, { data: tenant }, { data: units }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("tenants")
      .select("legal_name, trade_name")
      .eq("id", selectedTenantId)
      .maybeSingle(),
    supabase
      .from("clinic_units")
      .select("name")
      .eq("tenant_id", selectedTenantId)
      .eq("status", "active")
      .order("name")
      .limit(1),
  ]);

  if (!userData.user) redirect("/sign-in");

  const tenantLabel = tenant?.trade_name?.trim() || tenant?.legal_name?.trim() || "Organização";
  const userLabel =
    (userData.user.user_metadata?.display_name as string | undefined)?.trim() ||
    userData.user.email ||
    "Usuário";
  const unitLabel = units?.[0]?.name?.trim() || "Sem unidade ativa";

  return (
    <WorkspaceShell tenantLabel={tenantLabel} unitLabel={unitLabel} userLabel={userLabel}>
      {children}
    </WorkspaceShell>
  );
}
