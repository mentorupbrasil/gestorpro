import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTenantOrUnitPermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import {
  loadConclusionWorkspace,
  loadConsultationWorkspace,
  loadTriageWorkspace,
} from "@/features/clinical/service";
import { getRequestId } from "@/lib/http/request-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

  const context = await resolveAuthorizationContext(selectedTenantId);
  requireTenantOrUnitPermission(context, "clinical.read");

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

  const [triageWorkspace, consultationWorkspace, conclusionWorkspace] = await Promise.all([
    loadTriageWorkspace(selectedTenantId, selectedEncounterId),
    loadConsultationWorkspace(
      selectedTenantId,
      selectedConsultationId,
      getRequestId(await headers()),
    ),
    loadConclusionWorkspace(selectedTenantId, selectedConclusionId),
  ]);

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
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Clínica ocupacional
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Triagem, consulta e conclusão médica</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Dados clínicos são sensíveis, exigem MFA para escrita e ficam separados da recepção e da
          empresa. Alertas são auxiliares; aptidão final continua sendo decisão humana do médico.
        </p>
      </header>

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
    </main>
  );
}
