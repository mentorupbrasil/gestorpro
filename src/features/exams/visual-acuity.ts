import { AppError } from "@/core/errors/app-error";

export type EyeAcuity = {
  farWithCorrection?: string;
  farWithoutCorrection?: string;
  nearWithCorrection?: string;
  nearWithoutCorrection?: string;
};

export type VisualAcuityPayload = {
  binocular: EyeAcuity;
  leftEye: EyeAcuity;
  rightEye: EyeAcuity;
};

const acuityPattern =
  /^(20\/\d{2,3}|6\/\d{1,2}|0([.,]\d{1,2})?|1([.,]0{1,2})?|conta dedos|movimento de mãos|percepção luminosa)$/i;

function hasAnyValue(eye: EyeAcuity) {
  return Object.values(eye).some((value) => typeof value === "string" && value.trim().length > 0);
}

function validateEye(label: string, eye: EyeAcuity) {
  if (!hasAnyValue(eye)) {
    throw new AppError("VALIDATION_FAILED", `${label}: informe ao menos uma medida.`, {
      status: 400,
    });
  }

  for (const value of Object.values(eye)) {
    if (value && !acuityPattern.test(value.trim())) {
      throw new AppError("VALIDATION_FAILED", `${label}: medida de acuidade inválida.`, {
        status: 400,
      });
    }
  }
}

export function validateVisualAcuityPayload(payload: VisualAcuityPayload) {
  validateEye("Olho direito", payload.rightEye);
  validateEye("Olho esquerdo", payload.leftEye);
  validateEye("Binocular", payload.binocular);

  return payload;
}

export function buildVisualAcuitySummary(payload: VisualAcuityPayload) {
  validateVisualAcuityPayload(payload);

  return {
    binocular: payload.binocular.farWithCorrection ?? payload.binocular.farWithoutCorrection,
    left: payload.leftEye.farWithCorrection ?? payload.leftEye.farWithoutCorrection,
    right: payload.rightEye.farWithCorrection ?? payload.rightEye.farWithoutCorrection,
  };
}

export function assertProfessionalConclusion(value: string) {
  if (value.trim().length < 5) {
    throw new AppError("VALIDATION_FAILED", "Conclusão profissional do exame é obrigatória.", {
      status: 400,
    });
  }

  return value.trim();
}
