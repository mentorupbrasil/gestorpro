import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PageLoadError } from "@/components/ui/page-load-error";
import { PageHeader } from "@/components/ui/page-chrome";
import { hasTenantOrUnitPermission, type AuthorizationContext } from "@/core/auth/authorization";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { AppError } from "@/core/errors/app-error";
import { loadConclusionWorkspace } from "@/features/clinical/service";
import { computeCloseBlockers } from "@/features/encounters/state-machine";
import { ConclusionStation } from "../conclusion-station";
import { ConclusionClosureForms } from "../conclusion-closure-forms";

type Props = { searchParams?: Promise<{ conclusion?: string }> };

export default async function ConclusionStationPage({ searchParams }: Props) {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  let context: AuthorizationContext | null = null;
  const auth = await loadWorkspaceAuth(selectedTenantId, "conclusions.manage", "tenantOrUnit");
  if ("context" in auth) {
    context = auth.context;
  } else {
    const readOnly = await loadWorkspaceAuth(selectedTenantId, "clinical.read", "tenantOrUnit");
    if ("error" in readOnly) {
      return <PageLoadError title="Estação de conclusão" detail={auth.error} />;
    }
    context = readOnly.context;
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

  const selected = workspace.selectedEncounter;
  const closeBlockers = computeCloseBlockers({
    flowPaused: Boolean(selected?.blockers.some((item) => item.code === "FLOW_PAUSED")),
    hasConsolidatedInvoice: false,
    hasPriceSnapshot: Boolean(workspace.billingDefaults.priceTableId),
    openStepCount: 0,
    pendingRequiredExams: selected?.pendingExams ?? 0,
    signedAso: false,
    signedConclusion: workspace.selectedRecord?.signatureStatus === "signed",
  });

  return (
    <div>
      <PageHeader
        description="Conclusão médica humana. ASO, faturamento e encerramento só aparecem com a permissão da estação."
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
      <ConclusionClosureForms
        canBill={hasTenantOrUnitPermission(context, "finance.manage")}
        canClose={hasTenantOrUnitPermission(context, "encounters.manage")}
        canManageDocuments={hasTenantOrUnitPermission(context, "documents.manage")}
        canSignConclusion={hasTenantOrUnitPermission(context, "conclusions.manage")}
        canSignDocuments={hasTenantOrUnitPermission(context, "documents.sign")}
        closeBlockers={closeBlockers}
        companyId={workspace.billingDefaults.companyId}
        conclusionId={workspace.selectedRecord?.conclusionId}
        conclusionVersion={workspace.selectedRecord?.conclusionVersion ?? 1}
        contractId={workspace.billingDefaults.contractId}
        encounterId={
          workspace.selectedRecord?.encounterId ?? workspace.selectedEncounter?.encounterId
        }
        encounterVersion={workspace.encounterVersion ?? 1}
        priceTableId={workspace.billingDefaults.priceTableId}
        templateVersionId={workspace.billingDefaults.templateVersionId}
      />
    </div>
  );
}
