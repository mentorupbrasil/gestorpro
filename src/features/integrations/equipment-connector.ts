import { AppError } from "@/core/errors/app-error";

export function assertEquipmentCanRun(input: {
  calibrationValid: boolean;
  maintenanceBlocked: boolean;
  status: string;
}) {
  if (input.status !== "active" || input.maintenanceBlocked || !input.calibrationValid) {
    throw new AppError("VALIDATION_FAILED", "Equipamento bloqueado para execução.", {
      status: 409,
    });
  }
}

export function assertConnectorScope(scope: readonly string[], capability: string) {
  if (!scope.includes(capability)) {
    throw new AppError("PERMISSION_DENIED", "Conector sem escopo para esta capacidade.", {
      status: 403,
    });
  }
}

export function redactConnectorPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !/cpf|nome|diagn|resultado|secret|token/i.test(key)),
  );
}

export function assertNoUniversalIntegrationPromise(capabilities: readonly string[]) {
  if (capabilities.includes("*") || capabilities.includes("universal")) {
    throw new AppError("VALIDATION_FAILED", "Integração universal não é suportada.", {
      status: 400,
    });
  }
}
