import type { Permission } from "@/core/auth/permissions";

const STEP_PERMISSIONS: Record<string, Permission> = {
  reception: "encounters.manage",
  triage: "triage.manage",
  consultation: "consultations.manage",
  conclusion: "conclusions.manage",
  document: "documents.manage",
  delivery: "documents.deliver",
  billing: "finance.manage",
};

export function permissionForStepType(stepType: string): Permission {
  return STEP_PERMISSIONS[stepType] ?? "exams.manage";
}
