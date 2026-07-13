import { AppError } from "@/core/errors/app-error";

export type SpirometryMeasuredValues = {
  fev1: number;
  fvc: number;
  pef?: number | undefined;
};

export function assertSpirometryCatalogType(resultType: string | null | undefined) {
  if (resultType !== "spirometry") {
    throw new AppError("VALIDATION_FAILED", "A ordem informada não é de espirometria.", {
      status: 400,
    });
  }
}

export function computeSpirometryPercentages(
  measured: SpirometryMeasuredValues,
  predicted: SpirometryMeasuredValues,
) {
  if (measured.fev1 <= 0 || measured.fvc <= 0 || predicted.fev1 <= 0 || predicted.fvc <= 0) {
    throw new AppError("VALIDATION_FAILED", "Valores medidos e previstos devem ser positivos.", {
      status: 400,
    });
  }

  return {
    fev1: Math.round((measured.fev1 / predicted.fev1) * 1000) / 10,
    fev1Fvc: Math.round((measured.fev1 / measured.fvc) * 1000) / 10,
    fvc: Math.round((measured.fvc / predicted.fvc) * 1000) / 10,
    pef:
      typeof measured.pef === "number" && typeof predicted.pef === "number" && predicted.pef > 0
        ? Math.round((measured.pef / predicted.pef) * 1000) / 10
        : undefined,
  };
}

export function validateSpirometryQuality(qualityGrade: string) {
  const allowed = ["A", "B", "C", "D", "E", "F", "unacceptable"];
  if (!allowed.includes(qualityGrade)) {
    throw new AppError("VALIDATION_FAILED", "Qualidade técnica inválida.", { status: 400 });
  }

  return qualityGrade;
}

export function assertAcceptedManeuver(input: {
  acceptManeuver: boolean;
  completeResult: boolean;
}) {
  if (input.completeResult && !input.acceptManeuver) {
    throw new AppError("VALIDATION_FAILED", "Conclusão exige seleção da tentativa aceita.", {
      status: 400,
    });
  }
}
