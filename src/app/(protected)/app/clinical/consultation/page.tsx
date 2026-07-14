import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PageLoadError } from "@/components/ui/page-load-error";
import { PageHeader } from "@/components/ui/page-chrome";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { AppError } from "@/core/errors/app-error";
import { loadConsultationWorkspace } from "@/features/clinical/service";
import { getRequestId } from "@/lib/http/request-id";
import { ConsultationStation } from "../consultation-station";

type Props = { searchParams?: Promise<{ consultation?: string; encounter?: string }> };

export default async function ConsultationStationPage({ searchParams }: Props) {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "consultations.manage", "tenantOrUnit");
  if ("error" in auth) {
    const readOnly = await loadWorkspaceAuth(selectedTenantId, "clinical.read", "tenantOrUnit");
    if ("error" in readOnly) {
      return <PageLoadError title="Estação de consulta" detail={auth.error} />;
    }
  }

  const resolved = searchParams ? await searchParams : undefined;
  const consultationId = resolved?.consultation
    ? z.uuid().safeParse(resolved.consultation).data
    : undefined;

  let workspace;
  try {
    workspace = await loadConsultationWorkspace(
      selectedTenantId,
      consultationId,
      getRequestId(await headers()),
    );
  } catch (error) {
    return (
      <PageLoadError
        title="Estação de consulta"
        detail={
          error instanceof AppError || error instanceof Error ? error.message : "Falha ao carregar."
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        description="Consulta ocupacional com credencial profissional e decisão humana."
        eyebrow="Médico ocupacional"
        title="Estação de consulta"
      />
      <ConsultationStation
        physicians={workspace.physicians}
        professionalName={workspace.professionalName}
        queue={workspace.queue}
        selectedEncounter={workspace.selectedEncounter}
        selectedRecord={workspace.selectedRecord}
      />
    </div>
  );
}
