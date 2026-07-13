import { createHash } from "node:crypto";
import { AppError } from "@/core/errors/app-error";

export const esocialReference = {
  consultedAt: "2026-07-13",
  layoutVersion: "S-1.3",
  manualReference: "MOS S-1.3 consolidado até NO 11/2026",
  sourceUrl: "https://www.gov.br/esocial/pt-br/documentacao-tecnica",
  technicalNote: "NT 06/2026 rev. 09/04/2026",
  xsdProductionDate: "2026-04-27",
} as const;

export type EsocialEnvironment = "restricted_production" | "production";
export type EsocialOperation = "original" | "correction" | "rectification" | "exclusion";

export function hashEsocialPayload(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function assertEsocialEnvironment(
  environment: EsocialEnvironment,
  productionAuthorized: boolean,
) {
  if (environment === "production" && !productionAuthorized) {
    throw new AppError("PERMISSION_DENIED", "Produção eSocial exige autorização separada.", {
      status: 403,
    });
  }
}

export function assertEsocialPayloadShape(payload: Record<string, unknown>) {
  if (!payload.evt || typeof payload.evt !== "object") {
    throw new AppError("VALIDATION_FAILED", "Payload eSocial fictício deve conter grupo evt.", {
      status: 400,
    });
  }

  return payload;
}

export function buildEsocialIdempotencyKey(input: {
  businessKey: string;
  eventType: string;
  operation: EsocialOperation;
}) {
  return `${input.eventType}:${input.operation}:${input.businessKey}`.replace(
    /[^A-Za-z0-9:_-]/g,
    "_",
  );
}

export function classifyEsocialBatchStatus(input: { accepted: number; rejected: number }) {
  if (input.rejected > 0 && input.accepted > 0) return "partially_rejected";
  if (input.rejected > 0) return "rejected";
  return "processed";
}
