import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PageLoadError } from "@/components/ui/page-load-error";
import { PageHeader } from "@/components/ui/page-chrome";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { AppError } from "@/core/errors/app-error";
import { loadTriageWorkspace } from "@/features/clinical/service";
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

  return (
    <div>
      <PageHeader
        description="Fila própria de triagem. Concluir a etapa libera automaticamente a próxima via transition_encounter_step."
        eyebrow="Enfermagem"
        title="Estação de triagem"
      />
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
