import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PageLoadError } from "@/components/ui/page-load-error";
import { PageHeader } from "@/components/ui/page-chrome";
import { hasTenantOrUnitPermission, type AuthorizationContext } from "@/core/auth/authorization";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { AppError } from "@/core/errors/app-error";
import { getEncounterCloseReadiness } from "@/features/clinical/closure";
import { loadConclusionWorkspace } from "@/features/clinical/service";
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
  const encounterId = workspace.selectedRecord?.encounterId ?? selected?.encounterId;

  let readiness = null;
  let readinessError: string | null = null;
  if (encounterId) {
    try {
      readiness = await getEncounterCloseReadiness({
        encounterId,
        tenantId: selectedTenantId,
      });
    } catch (error) {
      readinessError =
        error instanceof AppError || error instanceof Error
          ? error.message
          : "Falha ao carregar prontidão de fechamento.";
    }
  }

  const closeBlockers = readiness
    ? readiness.blockers.map((blocker) => ({
        code: blocker.code as
          | "OPEN_STEPS"
          | "UNSIGNED_CONCLUSION"
          | "UNSIGNED_ASO"
          | "PENDING_EXAMS"
          | "MISSING_SNAPSHOT"
          | "MISSING_INVOICE"
          | "FLOW_PAUSED"
          | "DELIVERY_OPEN"
          | "CRITICAL_ALERTS"
          | "CANCELLED"
          | "UNKNOWN",
        message: blocker.owner ? `${blocker.message} (${blocker.owner})` : blocker.message,
      }))
    : [
        {
          code: "UNKNOWN" as const,
          message:
            readinessError ??
            "Prontidão de fechamento indisponível — não habilitar encerramento sem estado do servidor.",
        },
      ];

  return (
    <div>
      <PageHeader
        description="Conclusão médica humana. Geração, assinatura e entrega documental são estações separadas."
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
        canDeliverDocuments={hasTenantOrUnitPermission(context, "documents.deliver")}
        canManageDocuments={hasTenantOrUnitPermission(context, "documents.manage")}
        canSignConclusion={hasTenantOrUnitPermission(context, "conclusions.manage")}
        canSignDocuments={hasTenantOrUnitPermission(context, "documents.sign")}
        closeBlockers={closeBlockers}
        companyId={workspace.billingDefaults.companyId}
        conclusionId={workspace.selectedRecord?.conclusionId}
        conclusionVersion={workspace.selectedRecord?.conclusionVersion ?? 1}
        contractId={workspace.billingDefaults.contractId}
        encounterId={encounterId}
        encounterVersion={readiness?.encounterVersion ?? workspace.encounterVersion ?? 1}
        priceTableId={workspace.billingDefaults.priceTableId}
        readiness={
          readiness
            ? {
                asoStatus: readiness.asoStatus,
                billingStatus: readiness.billingStatus,
                deliveryStatus: readiness.deliveryStatus,
                invoiceStatus: readiness.invoiceStatus,
                ready: readiness.ready,
                storageStatus: readiness.storageStatus,
              }
            : null
        }
        templateVersionId={workspace.billingDefaults.templateVersionId}
      />
    </div>
  );
}
