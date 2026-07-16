import "server-only";

import { requireAal2, requireTenantOrUnitPermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const signConclusionSchema = z.object({
  conclusionId: z.uuid(),
  expectedVersion: z.number().int().positive(),
  tenantId: z.uuid(),
});

const closeEncounterSchema = z.object({
  encounterId: z.uuid(),
  expectedVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(8).max(160),
  tenantId: z.uuid(),
});

export async function signMedicalConclusion(
  input: z.infer<typeof signConclusionSchema>,
  requestId: string,
) {
  const parsed = signConclusionSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireTenantOrUnitPermission(context, "conclusions.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("sign_medical_conclusion", {
    audit_request_id: requestId,
    expected_version: parsed.expectedVersion,
    target_conclusion_id: parsed.conclusionId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível assinar a conclusão.", {
      cause: error,
      status: 500,
    });
  }

  const conclusion = await supabase
    .from("medical_conclusions")
    .select("encounter_id")
    .eq("tenant_id", context.tenantId)
    .eq("id", parsed.conclusionId)
    .maybeSingle();

  if (conclusion.data?.encounter_id) {
    const { completeEncounterStepByType } = await import("@/features/encounters/complete-step");
    await completeEncounterStepByType({
      encounterId: conclusion.data.encounter_id,
      requestId,
      stepType: "conclusion",
      tenantId: context.tenantId,
    });
  }

  return data;
}

export type EncounterCloseReadiness = {
  asoStatus: string;
  billingStatus: string;
  blockers: Array<{ code: string; message: string; owner?: string }>;
  conclusionStatus: string;
  criticalAlerts: number;
  deliveryStatus: string;
  encounterStatus?: string;
  encounterVersion: number;
  invoiceStatus: string;
  openRequiredSteps: number;
  paymentStatus: string;
  pendingRequiredExams: number;
  ready: boolean;
  storageStatus: string;
};

export async function getEncounterCloseReadiness(input: {
  encounterId: string;
  tenantId: string;
}): Promise<EncounterCloseReadiness> {
  const parsed = z.object({ encounterId: z.uuid(), tenantId: z.uuid() }).parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  if (!context.userId) {
    throw new AppError("AUTHENTICATION_REQUIRED", "Sessão inválida.", { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_encounter_close_readiness", {
    target_encounter_id: parsed.encounterId,
    target_tenant_id: context.tenantId,
  });

  if (error || !data || typeof data !== "object") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível carregar prontidão de fechamento.", {
      cause: error,
      status: 500,
    });
  }

  const row = data as Record<string, unknown>;
  const blockersRaw = Array.isArray(row.blockers) ? row.blockers : [];
  const readiness: EncounterCloseReadiness = {
    asoStatus: String(row.asoStatus ?? "missing"),
    billingStatus: String(row.billingStatus ?? "missing"),
    blockers: blockersRaw.map((item) => {
      const blocker = (item ?? {}) as Record<string, unknown>;
      const owner = typeof blocker.owner === "string" ? blocker.owner : undefined;
      return {
        code: String(blocker.code ?? "UNKNOWN"),
        message: String(blocker.message ?? "Pendência operacional"),
        ...(owner ? { owner } : {}),
      };
    }),
    conclusionStatus: String(row.conclusionStatus ?? "unsigned"),
    criticalAlerts: Number(row.criticalAlerts ?? 0),
    deliveryStatus: String(row.deliveryStatus ?? "missing"),
    encounterVersion: Number(row.encounterVersion ?? 1),
    invoiceStatus: String(row.invoiceStatus ?? "missing"),
    openRequiredSteps: Number(row.openRequiredSteps ?? 0),
    paymentStatus: String(row.paymentStatus ?? "unresolved"),
    pendingRequiredExams: Number(row.pendingRequiredExams ?? 0),
    ready: Boolean(row.ready),
    storageStatus: String(row.storageStatus ?? "missing"),
  };
  if (typeof row.encounterStatus === "string") {
    readiness.encounterStatus = row.encounterStatus;
  }
  return readiness;
}

export async function closeOccupationalEncounter(
  input: z.infer<typeof closeEncounterSchema>,
  requestId: string,
) {
  const parsed = closeEncounterSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireTenantOrUnitPermission(context, "encounters.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("close_occupational_encounter", {
    audit_request_id: requestId,
    expected_version: parsed.expectedVersion,
    idempotency_key_value: parsed.idempotencyKey,
    target_encounter_id: parsed.encounterId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    const message = error?.message ?? "";
    if (/required|pending|open|signed|readiness|closure|storage|version/i.test(message)) {
      throw new AppError("VALIDATION_FAILED", message, { cause: error, status: 422 });
    }
    throw new AppError("INTERNAL_ERROR", "Não foi possível encerrar o atendimento.", {
      cause: error,
      status: 500,
    });
  }
  return data;
}
