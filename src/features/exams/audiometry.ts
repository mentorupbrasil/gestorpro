import { AppError } from "@/core/errors/app-error";

export type Ear = "left" | "right";
export type Frequency = "250" | "500" | "1000" | "2000" | "3000" | "4000" | "6000" | "8000";
export type AudiometryThresholds = Record<Ear, Partial<Record<Frequency, number>>>;

const frequencies: readonly Frequency[] = [
  "250",
  "500",
  "1000",
  "2000",
  "3000",
  "4000",
  "6000",
  "8000",
];

export function validateAudiometryThresholds(thresholds: AudiometryThresholds) {
  for (const ear of ["left", "right"] as const) {
    const values = thresholds[ear] ?? {};
    const measured = frequencies.filter((frequency) => typeof values[frequency] === "number");

    if (measured.length < 3) {
      throw new AppError("VALIDATION_FAILED", `${ear}: informe ao menos três frequências.`, {
        status: 400,
      });
    }

    for (const frequency of measured) {
      const value = values[frequency];
      if (typeof value !== "number" || value < -10 || value > 120) {
        throw new AppError("VALIDATION_FAILED", `${ear}: limiar fora da faixa aceitável.`, {
          status: 400,
        });
      }
    }
  }

  return thresholds;
}

export function assertAuditoryRest(restHours: number, requiredHours = 14) {
  if (!Number.isFinite(restHours) || restHours < requiredHours) {
    throw new AppError("VALIDATION_FAILED", "Repouso auditivo informado insuficiente.", {
      status: 400,
    });
  }

  return restHours;
}

export function assertCalibrationValid(input: { status: string; validUntil: string }, today: Date) {
  const validUntil = new Date(`${input.validUntil}T23:59:59`);
  if (input.status !== "valid" || validUntil < today) {
    throw new AppError("VALIDATION_FAILED", "Calibração vigente é obrigatória.", { status: 400 });
  }

  return true;
}
