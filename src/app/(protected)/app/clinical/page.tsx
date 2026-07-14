import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PageLoadError } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { AppError } from "@/core/errors/app-error";
import {
  loadConclusionWorkspace,
  loadConsultationWorkspace,
  loadTriageWorkspace,
} from "@/features/clinical/service";
import { getRequestId } from "@/lib/http/request-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-chrome";
import { ClinicalFlowPanel } from "./clinical-flow-panel";
import { ConclusionStation } from "./conclusion-station";
import { ConsultationStation } from "./consultation-station";
import { TriageStation } from "./triage-station";

type ClinicalPageProps = {
  searchParams?: Promise<{ conclusion?: string; consultation?: string; encounter?: string }>;
};

export default async function ClinicalPage({ searchParams }: ClinicalPageProps) {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "clinical.read", "tenantOrUnit");
  if ("error" in auth) {
    return <PageLoadError title="Triagem, consulta e conclusão médica" detail={auth.error} />;
  }
  const context = auth.context;

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedEncounterId = resolvedSearchParams?.encounter
    ? z.uuid().safeParse(resolvedSearchParams.encounter).data
    : undefined;
  const selectedConsultationId = resolvedSearchParams?.consultation
    ? z.uuid().safeParse(resolvedSearchParams.consultation).data
    : undefined;
  const selectedConclusionId = resolvedSearchParams?.conclusion
    ? z.uuid().safeParse(resolvedSearchParams.conclusion).data
    : undefined;

  let triageWorkspace: Awaited<ReturnType<typeof loadTriageWorkspace>>;
  let consultationWorkspace: Awaited<ReturnType<typeof loadConsultationWorkspace>>;
  let conclusionWorkspace: Awaited<ReturnType<typeof loadConclusionWorkspace>>;
  try {
    [triageWorkspace, consultationWorkspace, conclusionWorkspace] = await Promise.all([
      loadTriageWorkspace(selectedTenantId, selectedEncounterId),
      loadConsultationWorkspace(
        selectedTenantId,
        selectedConsultationId,
        getRequestId(await headers()),
      ),
      loadConclusionWorkspace(selectedTenantId, selectedConclusionId),
    ]);
  } catch (error) {
    const detail =
      error instanceof AppError || error instanceof Error
        ? error.message
        : "Não foi possível carregar o espaço clínico.";
    return <PageLoadError title="Triagem, consulta e conclusão médica" detail={detail} />;
  }

  const flowEncounterId =
    triageWorkspace.selectedEncounter?.encounterId ??
    consultationWorkspace.selectedEncounter?.encounterId ??
    conclusionWorkspace.selectedEncounter?.encounterId ??
    null;
  const flowConsultationId =
    consultationWorkspace.selectedRecord?.consultationId ??
    consultationWorkspace.selectedEncounter?.consultationId ??
    null;

  let alerts: { id: string; message: string; severity: string; status: string }[] = [];
  let pauses: { id: string; reason: string; status: string }[] = [];

  if (flowEncounterId) {
    const supabase = await createServerSupabaseClient();
    const [alertsResult, pausesResult] = await Promise.all([
      supabase
        .from("clinical_alerts")
        .select("id, message, severity, status")
        .eq("tenant_id", context.tenantId)
        .eq("encounter_id", flowEncounterId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("encounter_flow_pauses")
        .select("id, reason, status")
        .eq("tenant_id", context.tenantId)
        .eq("encounter_id", flowEncounterId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    alerts = alertsResult.data ?? [];
    pauses = pausesResult.data ?? [];
  }

  return (
    <div>
      <PageHeader
        description="Dados clínicos são sensíveis, exigem MFA para escrita e ficam separados da recepção e da empresa. Alertas são auxiliares; aptidão final continua sendo decisão humana do médico."
        eyebrow="Clínica ocupacional"
        title="Triagem, consulta e conclusão médica"
      />

      <TriageStation
        formVersionId={triageWorkspace.formVersion.id}
        formVersionLabel={triageWorkspace.formVersion.label}
        professionalName={triageWorkspace.professionalName}
        queue={triageWorkspace.queue}
        selectedEncounter={triageWorkspace.selectedEncounter}
        selectedRecord={triageWorkspace.selectedRecord}
      />

      <ConsultationStation
        physicians={consultationWorkspace.physicians}
        professionalName={consultationWorkspace.professionalName}
        queue={consultationWorkspace.queue}
        selectedEncounter={consultationWorkspace.selectedEncounter}
        selectedRecord={consultationWorkspace.selectedRecord}
      />

      <ConclusionStation
        physicians={conclusionWorkspace.physicians}
        professionalName={conclusionWorkspace.professionalName}
        queue={conclusionWorkspace.queue}
        selectedEncounter={conclusionWorkspace.selectedEncounter}
        selectedRecord={conclusionWorkspace.selectedRecord}
      />

      <ClinicalFlowPanel
        alerts={alerts}
        consultationId={flowConsultationId}
        encounterId={flowEncounterId}
        pauses={pauses}
      />
    </div>
  );
}
