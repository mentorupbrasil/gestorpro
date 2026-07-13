import { AppError } from "@/core/errors/app-error";

export type ReadinessStatus = "passed" | "pending" | "failed";
export type ReadinessSeverity = "critical" | "high" | "medium" | "low";

export type ReadinessItem = {
  area: string;
  severity: ReadinessSeverity;
  status: ReadinessStatus;
};

export function evaluateGoNoGo(items: readonly ReadinessItem[]) {
  const blockers = items.filter((item) => item.severity === "critical" && item.status !== "passed");

  return {
    blockers,
    decision: blockers.length > 0 ? ("NO-GO" as const) : ("GO" as const),
  };
}

export function assertNoRealDataInPilot(label: string) {
  if (/cpf|rg|paciente real|prontu[aá]rio real|empresa real/i.test(label)) {
    throw new AppError("VALIDATION_FAILED", "Piloto técnico não pode usar dados reais.", {
      status: 400,
    });
  }

  return label;
}

export function requireHumanValidation(validations: Record<string, boolean>) {
  const missing = Object.entries(validations)
    .filter(([, done]) => !done)
    .map(([area]) => area);

  if (missing.length > 0) {
    throw new AppError("VALIDATION_FAILED", "Validações humanas pendentes.", {
      details: { missing },
      status: 409,
    });
  }
}
