import { AppError } from "@/core/errors/app-error";

export type ClinicalRecordStatus = "draft" | "closed" | "reopened" | "voided";
export type ConclusionCode = "fit" | "fit_with_restrictions" | "unfit" | "inconclusive";

export type ConclusionBlocker = {
  code:
    | "TRIAGE_OPEN"
    | "CONSULTATION_OPEN"
    | "PENDING_REQUIRED_EXAMS"
    | "FLOW_PAUSED"
    | "MISSING_PHYSICIAN_REGISTRATION";
  message: string;
};

export function nextClinicalVersion(currentVersion: number) {
  if (!Number.isInteger(currentVersion) || currentVersion < 1) {
    throw new AppError("VALIDATION_FAILED", "Versão clínica inválida.", { status: 400 });
  }

  return currentVersion + 1;
}

export function requireReopenJustification(justification: string) {
  if (justification.trim().length < 12) {
    throw new AppError("VALIDATION_FAILED", "Reabertura exige justificativa clara.", {
      status: 400,
    });
  }

  return justification.trim();
}

export function computeConclusionBlockers(input: {
  closedConsultation: boolean;
  closedTriage: boolean;
  flowPaused: boolean;
  pendingRequiredExams: number;
  physicianRegistrationComplete: boolean;
}) {
  const blockers: ConclusionBlocker[] = [];

  if (!input.closedTriage) {
    blockers.push({ code: "TRIAGE_OPEN", message: "Triagem ainda não foi fechada." });
  }

  if (!input.closedConsultation) {
    blockers.push({ code: "CONSULTATION_OPEN", message: "Consulta médica ainda não foi fechada." });
  }

  if (input.pendingRequiredExams > 0) {
    blockers.push({
      code: "PENDING_REQUIRED_EXAMS",
      message: "Existem exames obrigatórios pendentes.",
    });
  }

  if (input.flowPaused) {
    blockers.push({
      code: "FLOW_PAUSED",
      message: "Fluxo clínico está pausado por intercorrência.",
    });
  }

  if (!input.physicianRegistrationComplete) {
    blockers.push({
      code: "MISSING_PHYSICIAN_REGISTRATION",
      message: "Vínculo médico ou registro profissional ausente.",
    });
  }

  return blockers;
}

export function assertHumanMedicalConclusion(conclusionCode: ConclusionCode) {
  const allowed: readonly ConclusionCode[] = [
    "fit",
    "fit_with_restrictions",
    "unfit",
    "inconclusive",
  ];

  if (!allowed.includes(conclusionCode)) {
    throw new AppError("VALIDATION_FAILED", "Conclusão médica inválida.", { status: 400 });
  }

  return conclusionCode;
}
