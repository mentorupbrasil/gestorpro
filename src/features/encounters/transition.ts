import "server-only";

import { requireAal2, requireTenantOrUnitPermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const transitionSchema = z.object({
  action: z.enum(["start", "complete", "return", "pause", "waive", "no_show", "cancel", "reopen"]),
  encounterStepId: z.uuid(),
  expectedVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(8).max(160),
  justification: z.string().trim().max(500).optional(),
  tenantId: z.uuid(),
});

export type TransitionEncounterStepInput = z.infer<typeof transitionSchema>;

export async function transitionEncounterStep(
  input: TransitionEncounterStepInput,
  requestId: string,
) {
  const parsed = transitionSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireTenantOrUnitPermission(context, "encounters.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("transition_encounter_step", {
    audit_request_id: requestId,
    expected_version: parsed.expectedVersion,
    idempotency_key_value: parsed.idempotencyKey,
    justification_text: parsed.justification ?? "",
    target_action: parsed.action,
    target_encounter_step_id: parsed.encounterStepId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    const message = error?.message ?? "";
    if (/aal2 required/i.test(message)) {
      throw new AppError("MFA_REQUIRED", "Transição exige AAL2 (MFA).", {
        cause: error,
        status: 401,
      });
    }
    if (/version conflict/i.test(message)) {
      throw new AppError("VERSION_CONFLICT", "Etapa foi alterada por outro usuário.", {
        cause: error,
        status: 409,
      });
    }
    if (/permission|cannot|invalid|justification|closed/i.test(message)) {
      throw new AppError("VALIDATION_FAILED", message, { cause: error, status: 422 });
    }
    throw new AppError("INTERNAL_ERROR", "Não foi possível transicionar a etapa.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
