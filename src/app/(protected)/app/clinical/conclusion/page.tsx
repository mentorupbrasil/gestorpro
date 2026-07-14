import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PageLoadError } from "@/components/ui/page-load-error";
import { PageHeader } from "@/components/ui/page-chrome";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { AppError } from "@/core/errors/app-error";
import { loadConclusionWorkspace } from "@/features/clinical/service";
import { ConclusionStation } from "../conclusion-station";

type Props = { searchParams?: Promise<{ conclusion?: string }> };

export default async function ConclusionStationPage({ searchParams }: Props) {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "conclusions.manage", "tenantOrUnit");
  if ("error" in auth) {
    const readOnly = await loadWorkspaceAuth(selectedTenantId, "clinical.read", "tenantOrUnit");
    if ("error" in readOnly) {
      return <PageLoadError title="Estação de conclusão" detail={auth.error} />;
    }
  }

  const conclusionId = searchParams
    ? z.uuid().safeParse((await searchParams).conclusion).data
    : undefined;

  let workspace;
  try {
    workspace = await loadConclusionWorkspace(selectedTenantId, conclusionId);
  } catch (error) {
    return (
      <PageLoadError
        title="Estação de conclusão"
        detail={
          error instanceof AppError || error instanceof Error ? error.message : "Falha ao carregar."
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        description="Conclusão médica e preparação do ASO. Assinatura com AAL2; aptidão jamais é automática."
        eyebrow="Médico ocupacional"
        title="Estação de conclusão"
      />
      <ConclusionStation
        physicians={workspace.physicians}
        professionalName={workspace.professionalName}
        queue={workspace.queue}
        selectedEncounter={workspace.selectedEncounter}
        selectedRecord={workspace.selectedRecord}
      />
    </div>
  );
}
