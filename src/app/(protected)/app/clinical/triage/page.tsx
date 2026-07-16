import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PageLoadError } from "@/components/ui/page-load-error";
import { PageHeader } from "@/components/ui/page-chrome";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { AppError } from "@/core/errors/app-error";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { loadTriageWorkspace } from "@/features/clinical/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BootstrapOperationsPanel } from "../../_components/bootstrap-operations-panel";
import { TriageStation } from "../triage-station";

type Props = { searchParams?: Promise<{ encounter?: string }> };

export default async function TriageStationPage({ searchParams }: Props) {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "triage.manage", "tenantOrUnit");
  if ("error" in auth) {
    const readOnly = await loadWorkspaceAuth(selectedTenantId, "clinical.read", "tenantOrUnit");
    if ("error" in readOnly) {
      return <PageLoadError title="Estação de triagem" detail={auth.error} />;
    }
  }

  const encounterId = searchParams
    ? z.uuid().safeParse((await searchParams).encounter).data
    : undefined;

  let workspace;
  try {
    workspace = await loadTriageWorkspace(selectedTenantId, encounterId);
  } catch (error) {
    return (
      <PageLoadError
        title="Estação de triagem"
        detail={
          error instanceof AppError || error instanceof Error ? error.message : "Falha ao carregar."
        }
      />
    );
  }

  const context = await resolveAuthorizationContext(selectedTenantId);
  const supabase = await createServerSupabaseClient();
  const { count: unitCount } = await supabase
    .from("clinic_units")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", selectedTenantId)
    .eq("status", "active");
  const needsBootstrap = !workspace.formVersion.id || (unitCount ?? 0) === 0;

  return (
    <div>
      <PageHeader
        description="Fila própria de triagem. Concluir a etapa libera automaticamente a próxima via transition_encounter_step."
        eyebrow="Enfermagem"
        title="Estação de triagem"
      />
      {needsBootstrap ? (
        <BootstrapOperationsPanel
          canBootstrap={context.permissions.has("roles.manage")}
          reason={
            !workspace.formVersion.id
              ? "Este tenant ainda não tem formulário de triagem aprovado — a estação não funciona sem isso."
              : "Não há unidade clínica ativa — a fila fica vazia até existir unidade."
          }
        />
      ) : null}
      <TriageStation
        formVersionId={workspace.formVersion.id}
        formVersionLabel={workspace.formVersion.label}
        professionalName={workspace.professionalName}
        queue={workspace.queue}
        selectedEncounter={workspace.selectedEncounter}
        selectedRecord={workspace.selectedRecord}
      />
    </div>
  );
}
