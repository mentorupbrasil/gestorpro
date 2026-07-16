import "server-only";

import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { transitionEncounterStep } from "./transition";

/**
 * Completa (start→complete se necessário) uma etapa do encounter pelo step_type.
 * Falhas de persistência/autorização/deps propagam — nunca best-effort.
 */
export async function completeEncounterStepByType(input: {
  encounterId: string;
  requestId: string;
  stepType: string;
  tenantId: string;
}): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data: step, error } = await supabase
    .from("encounter_steps")
    .select("id, status, version")
    .eq("tenant_id", input.tenantId)
    .eq("encounter_id", input.encounterId)
    .eq("step_type", input.stepType)
    .maybeSingle();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível carregar a etapa do atendimento.", {
      cause: error,
      status: 500,
    });
  }

  if (!step) {
    throw new AppError(
      "VALIDATION_FAILED",
      `Etapa ${input.stepType} não encontrada no atendimento.`,
      {
        status: 404,
      },
    );
  }

  if (["completed", "cancelled"].includes(step.status)) {
    return;
  }

  let expectedVersion = step.version;
  let status = step.status;

  if (status === "pending" || status === "blocked" || status === "available") {
    if (status !== "in_progress") {
      await transitionEncounterStep(
        {
          action: "start",
          encounterStepId: step.id,
          expectedVersion,
          idempotencyKey: `step:start:${input.encounterId}:${input.stepType}`,
          tenantId: input.tenantId,
        },
        input.requestId,
      );
      expectedVersion += 1;
      status = "in_progress";
    }
  }

  if (status === "in_progress" || status === "available" || status === "paused") {
    await transitionEncounterStep(
      {
        action: "complete",
        encounterStepId: step.id,
        expectedVersion,
        idempotencyKey: `step:complete:${input.encounterId}:${input.stepType}`,
        tenantId: input.tenantId,
      },
      input.requestId,
    );
  }
}
