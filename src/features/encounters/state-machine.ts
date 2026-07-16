import { AppError } from "@/core/errors/app-error";

export type EncounterStepStatus =
  | "blocked"
  | "available"
  | "waiting"
  | "called"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled"
  | "waived"
  | "no_show"
  | "failed"
  | "pending";

export type EncounterStepAction =
  | "release"
  | "call"
  | "recall"
  | "start"
  | "complete"
  | "pause"
  | "resume"
  | "return_to_queue"
  | "waive"
  | "no_show"
  | "cancel"
  | "reopen"
  | "redirect";

/** Canonical matrix for UI + unit tests. DB RPC remains source of truth. */
export const ENCOUNTER_STEP_TRANSITIONS: Array<{
  action: EncounterStepAction;
  from: EncounterStepStatus[];
  to: EncounterStepStatus;
  requiresJustification: boolean;
  reopenOnly?: boolean;
}> = [
  {
    action: "start",
    from: ["available", "pending", "waiting", "called"],
    to: "in_progress",
    requiresJustification: false,
  },
  {
    action: "complete",
    from: ["available", "in_progress"],
    to: "completed",
    requiresJustification: false,
  },
  { action: "pause", from: ["in_progress"], to: "paused", requiresJustification: true },
  { action: "resume", from: ["paused"], to: "in_progress", requiresJustification: false },
  {
    action: "return_to_queue",
    from: ["called", "in_progress", "paused"],
    to: "available",
    requiresJustification: false,
  },
  {
    action: "waive",
    from: ["available", "blocked", "pending", "waiting"],
    to: "waived",
    requiresJustification: true,
  },
  {
    action: "no_show",
    from: ["available", "waiting", "called"],
    to: "no_show",
    requiresJustification: false,
  },
  {
    action: "cancel",
    from: ["available", "blocked", "pending", "waiting", "called", "in_progress", "paused"],
    to: "cancelled",
    requiresJustification: true,
  },
  {
    action: "reopen",
    from: ["completed", "cancelled", "waived"],
    to: "available",
    requiresJustification: true,
    reopenOnly: true,
  },
];

export function assertEncounterStepTransition(input: {
  action: EncounterStepAction;
  currentStatus: EncounterStepStatus;
}) {
  const rule = ENCOUNTER_STEP_TRANSITIONS.find((row) => row.action === input.action);
  if (!rule) {
    throw new AppError("VALIDATION_FAILED", `Ação de etapa inválida: ${input.action}.`, {
      status: 422,
    });
  }
  if (!rule.from.includes(input.currentStatus)) {
    throw new AppError(
      "VALIDATION_FAILED",
      `Transição inválida: ${input.action} a partir de ${input.currentStatus}.`,
      { status: 422 },
    );
  }
  if (input.action === "no_show" && input.currentStatus === "in_progress") {
    throw new AppError(
      "VALIDATION_FAILED",
      "no_show não é permitido após início clínico da etapa.",
      { status: 422 },
    );
  }
  return rule.to;
}

export type CloseBlocker = {
  code:
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
    | "UNKNOWN";
  message: string;
};

export function computeCloseBlockers(input: {
  flowPaused: boolean;
  hasConsolidatedInvoice: boolean;
  hasPriceSnapshot: boolean;
  openStepCount: number;
  pendingRequiredExams: number;
  signedAso: boolean;
  signedConclusion: boolean;
}): CloseBlocker[] {
  const blockers: CloseBlocker[] = [];
  if (input.openStepCount > 0) {
    blockers.push({
      code: "OPEN_STEPS",
      message: `${input.openStepCount} etapa(s) ainda aberta(s).`,
    });
  }
  if (input.pendingRequiredExams > 0) {
    blockers.push({
      code: "PENDING_EXAMS",
      message: "Exames obrigatórios ainda pendentes.",
    });
  }
  if (!input.signedConclusion) {
    blockers.push({ code: "UNSIGNED_CONCLUSION", message: "Conclusão médica não assinada." });
  }
  if (!input.signedAso) {
    blockers.push({ code: "UNSIGNED_ASO", message: "ASO real ainda não assinado." });
  }
  if (!input.hasPriceSnapshot) {
    blockers.push({ code: "MISSING_SNAPSHOT", message: "Snapshot comercial ausente." });
  }
  if (!input.hasConsolidatedInvoice) {
    blockers.push({ code: "MISSING_INVOICE", message: "Fatura consolidada ausente." });
  }
  if (input.flowPaused) {
    blockers.push({ code: "FLOW_PAUSED", message: "Fluxo clínico pausado." });
  }
  return blockers;
}
