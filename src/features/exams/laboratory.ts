import { AppError } from "@/core/errors/app-error";

export type LaboratoryResultStatus =
  "resulted" | "reviewed" | "released" | "repeated" | "cancelled";

export function assertLaboratoryRelease(input: {
  criticalConfirmed: boolean;
  criticalFlag: boolean;
  status: LaboratoryResultStatus;
}) {
  if (input.status === "released" && input.criticalFlag && !input.criticalConfirmed) {
    throw new AppError(
      "VALIDATION_FAILED",
      "Resultado crítico exige confirmação antes da liberação.",
      {
        status: 400,
      },
    );
  }
}

export function buildSampleBarcodePayload(input: {
  orderId: string;
  sampleCode: string;
  tenantId: string;
}) {
  return {
    kind: "laboratory-sample",
    orderId: input.orderId,
    sampleCode: input.sampleCode,
    tenantId: input.tenantId,
  };
}

export function assertReferenceRangeConfig(config: Record<string, unknown>) {
  if (Object.keys(config).length === 0) {
    throw new AppError("VALIDATION_FAILED", "Referência laboratorial configurável é obrigatória.", {
      status: 400,
    });
  }

  return config;
}
