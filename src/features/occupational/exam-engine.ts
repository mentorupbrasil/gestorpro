import { AppError } from "@/core/errors/app-error";
import type { OccupationalExamType } from "./schemas";

export type PcmsoVersionSnapshot = Readonly<{
  id: string;
  status: "draft" | "approved" | "expired";
  validFrom: string;
  validUntil?: string | null;
}>;

export type ExamCatalogSnapshot = Readonly<{
  code: string;
  id: string;
  name: string;
}>;

export type ExamProtocolItemSnapshot = Readonly<{
  exam: ExamCatalogSnapshot;
  required: boolean;
  riskCodes?: readonly string[];
}>;

export type ExamProtocolSnapshot = Readonly<{
  id: string;
  occupationalExamType: OccupationalExamType;
  pcmsoVersion: PcmsoVersionSnapshot;
  status: "draft" | "approved" | "inactive";
  items: readonly ExamProtocolItemSnapshot[];
}>;

export type ExamProtocolOverrideSnapshot = Readonly<{
  action: "add" | "remove";
  exam: ExamCatalogSnapshot;
  justification: string;
}>;

export type CalculateRequiredExamsInput = Readonly<{
  asOf: string;
  occupationalExamType: OccupationalExamType;
  protocols: readonly ExamProtocolSnapshot[];
  riskCodes: readonly string[];
  overrides?: readonly ExamProtocolOverrideSnapshot[];
}>;

export type CalculatedExam = Readonly<{
  code: string;
  id: string;
  name: string;
  reason: "protocol" | "risk" | "manual_override";
}>;

export type CalculatedExamPackage = Readonly<{
  exams: readonly CalculatedExam[];
  pcmsoVersionId: string;
  protocolId: string;
}>;

function isVersionEffective(version: PcmsoVersionSnapshot, asOf: string) {
  return (
    version.status === "approved" &&
    version.validFrom <= asOf &&
    (!version.validUntil || version.validUntil > asOf)
  );
}

function itemApplies(item: ExamProtocolItemSnapshot, riskCodes: ReadonlySet<string>) {
  if (!item.required) return false;
  if (!item.riskCodes?.length) return true;

  return item.riskCodes.some((riskCode) => riskCodes.has(riskCode));
}

export function calculateRequiredExams(input: CalculateRequiredExamsInput): CalculatedExamPackage {
  const activeProtocols = input.protocols.filter(
    (protocol) =>
      protocol.status === "approved" &&
      protocol.occupationalExamType === input.occupationalExamType &&
      isVersionEffective(protocol.pcmsoVersion, input.asOf),
  );

  if (activeProtocols.length === 0) {
    throw new AppError("PROTOCOL_MISSING", "Nenhum protocolo vigente encontrado.", {
      details: { occupationalExamType: input.occupationalExamType },
      status: 409,
    });
  }

  if (activeProtocols.length > 1) {
    throw new AppError("PROTOCOL_CONFLICT", "Mais de um protocolo vigente foi encontrado.", {
      details: { protocolIds: activeProtocols.map((protocol) => protocol.id) },
      status: 409,
    });
  }

  const [protocol] = activeProtocols;
  if (!protocol) {
    throw new AppError("PROTOCOL_MISSING", "Nenhum protocolo vigente encontrado.", {
      details: { occupationalExamType: input.occupationalExamType },
      status: 409,
    });
  }
  const riskCodes = new Set(input.riskCodes);
  const exams = new Map<string, CalculatedExam>();

  for (const item of protocol.items) {
    if (!itemApplies(item, riskCodes)) continue;

    exams.set(item.exam.id, {
      code: item.exam.code,
      id: item.exam.id,
      name: item.exam.name,
      reason: item.riskCodes?.length ? "risk" : "protocol",
    });
  }

  for (const override of input.overrides ?? []) {
    if (override.justification.trim().length < 10) {
      throw new AppError("OVERRIDE_DENIED", "Override manual exige justificativa.", {
        status: 403,
      });
    }

    if (override.action === "remove") {
      exams.delete(override.exam.id);
      continue;
    }

    exams.set(override.exam.id, {
      code: override.exam.code,
      id: override.exam.id,
      name: override.exam.name,
      reason: "manual_override",
    });
  }

  return {
    exams: Array.from(exams.values()).sort((left, right) => left.code.localeCompare(right.code)),
    pcmsoVersionId: protocol.pcmsoVersion.id,
    protocolId: protocol.id,
  };
}
