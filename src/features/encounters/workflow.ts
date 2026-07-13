import { AppError } from "@/core/errors/app-error";

export type EncounterStatus = "checked_in" | "waiting" | "in_progress" | "completed" | "cancelled";
export type EncounterStepStatus =
  "pending" | "available" | "in_progress" | "blocked" | "completed" | "cancelled";

const encounterTransitions: Record<EncounterStatus, readonly EncounterStatus[]> = {
  cancelled: [],
  checked_in: ["waiting", "in_progress", "cancelled"],
  completed: [],
  in_progress: ["waiting", "completed", "cancelled"],
  waiting: ["in_progress", "completed", "cancelled"],
};

const stepTransitions: Record<EncounterStepStatus, readonly EncounterStepStatus[]> = {
  available: ["in_progress", "blocked", "cancelled"],
  blocked: ["available", "cancelled"],
  cancelled: [],
  completed: [],
  in_progress: ["completed", "blocked", "cancelled"],
  pending: ["available", "blocked", "cancelled"],
};

export function transitionEncounter(current: EncounterStatus, next: EncounterStatus) {
  if (!encounterTransitions[current].includes(next)) {
    throw new AppError("VALIDATION_FAILED", "Transição de atendimento inválida.", {
      details: { current, next },
      status: 409,
    });
  }

  return next;
}

export function transitionEncounterStep(current: EncounterStepStatus, next: EncounterStepStatus) {
  if (!stepTransitions[current].includes(next)) {
    throw new AppError("VALIDATION_FAILED", "Transição de etapa inválida.", {
      details: { current, next },
      status: 409,
    });
  }

  return next;
}

export function releaseDependentStep(dependencyStatus: EncounterStepStatus) {
  if (dependencyStatus !== "completed") {
    throw new AppError("VALIDATION_FAILED", "Dependência de etapa ainda não concluída.", {
      status: 409,
    });
  }

  return "available" as const;
}

export function orderQueueTickets<T extends { createdAt: string; priority: number }>(
  tickets: readonly T[],
) {
  return [...tickets].sort(
    (left, right) =>
      left.priority - right.priority || left.createdAt.localeCompare(right.createdAt),
  );
}
