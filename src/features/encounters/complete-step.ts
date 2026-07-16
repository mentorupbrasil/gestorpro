import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { transitionEncounterStep } from "./transition";

/**
 * Completa (start→complete se necessário) uma etapa do encounter pelo step_type.
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

  if (error || !step) return;
  if (["completed", "cancelled"].includes(step.status)) return;

  let expectedVersion = step.version;
  let status = step.status;

  if (status === "pending" || status === "blocked" || status === "available") {
    if (status === "blocked") {
      // deps incompletas: tenta start mesmo assim; RPC valida
    }
    if (status !== "in_progress") {
      try {
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
      } catch {
        // se start falhar (deps), não força complete
        return;
      }
    }
  }

  if (status === "in_progress" || status === "available" || status === "paused") {
    try {
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
    } catch {
      // best-effort: caller ainda pode fechar depois
    }
  }
}
