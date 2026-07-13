import { z } from "zod";

export const CONSULTATION_PAYLOAD_SCHEMA_VERSION = 1;

const optionalText = (max: number) =>
  z
    .union([z.literal(""), z.string().max(max), z.null()])
    .transform((value) => (value === null ? null : value.trim()))
    .transform((value) => (value === null || value.length === 0 ? null : value));

export const consultationSubjectiveInputSchema = z.object({
  chiefComplaint: optionalText(4000),
  historyOfPresentIllness: optionalText(8000),
  occupationalHistory: optionalText(4000),
  reviewOfSystems: optionalText(4000),
});

export const consultationObjectiveInputSchema = z.object({
  generalAppearance: optionalText(2000),
  physicalExam: optionalText(8000),
  vitalSignsReview: optionalText(2000),
});

export const consultationStructuredInputSchema = z.object({
  assessment: optionalText(5000),
  objective: consultationObjectiveInputSchema,
  plan: optionalText(5000),
  subjective: consultationSubjectiveInputSchema,
});

export type ConsultationStructuredInput = z.infer<typeof consultationStructuredInputSchema>;

export type ConsultationStoredPayload = {
  assessment: string | null;
  objective: {
    generalAppearance: string | null;
    physicalExam: string | null;
    vitalSignsReview: string | null;
  };
  plan: string | null;
  schemaVersion: number;
  subjective: {
    chiefComplaint: string | null;
    historyOfPresentIllness: string | null;
    occupationalHistory: string | null;
    reviewOfSystems: string | null;
  };
  _legacy?: Record<string, unknown>;
};

export function hasConsultationClinicalData(input: ConsultationStructuredInput) {
  const values = [
    input.assessment,
    input.plan,
    ...Object.values(input.subjective),
    ...Object.values(input.objective),
  ];
  return values.some((value) => value !== null && value !== "");
}

export function buildConsultationStoredPayload(
  input: ConsultationStructuredInput,
): ConsultationStoredPayload {
  return {
    assessment: input.assessment,
    objective: { ...input.objective },
    plan: input.plan,
    schemaVersion: CONSULTATION_PAYLOAD_SCHEMA_VERSION,
    subjective: { ...input.subjective },
  };
}

function readLegacyText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeLegacyConsultationPayload(
  subjective: Record<string, unknown>,
  objective: Record<string, unknown>,
  assessment: string | null,
  plan: string | null,
): ConsultationStoredPayload {
  const structured = consultationStructuredInputSchema.parse({
    assessment: assessment ?? "",
    objective: {
      generalAppearance: readLegacyText(objective.aparenciaGeral ?? objective.generalAppearance) ?? "",
      physicalExam: readLegacyText(objective.exameFisico ?? objective.physicalExam) ?? "",
      vitalSignsReview: readLegacyText(objective.sinaisVitais ?? objective.vitalSignsReview) ?? "",
    },
    plan: plan ?? "",
    subjective: {
      chiefComplaint: readLegacyText(subjective.queixa ?? subjective.chiefComplaint) ?? "",
      historyOfPresentIllness:
        readLegacyText(subjective.hda ?? subjective.historyOfPresentIllness) ?? "",
      occupationalHistory:
        readLegacyText(subjective.historicoOcupacional ?? subjective.occupationalHistory) ?? "",
      reviewOfSystems: readLegacyText(subjective.revisaoSistemas ?? subjective.reviewOfSystems) ?? "",
    },
  });

  return buildConsultationStoredPayload(structured);
}

export function parseConsultationVersionPayload(
  subjective: Record<string, unknown>,
  objective: Record<string, unknown>,
  assessment: string | null,
  plan: string | null,
): ConsultationStoredPayload {
  if (
    subjective.schemaVersion === CONSULTATION_PAYLOAD_SCHEMA_VERSION ||
    objective.schemaVersion === CONSULTATION_PAYLOAD_SCHEMA_VERSION
  ) {
    const structured = consultationStructuredInputSchema.parse({
      assessment: assessment ?? "",
      objective: {
        generalAppearance: readLegacyText(objective.generalAppearance) ?? "",
        physicalExam: readLegacyText(objective.physicalExam) ?? "",
        vitalSignsReview: readLegacyText(objective.vitalSignsReview) ?? "",
      },
      plan: plan ?? "",
      subjective: {
        chiefComplaint: readLegacyText(subjective.chiefComplaint) ?? "",
        historyOfPresentIllness: readLegacyText(subjective.historyOfPresentIllness) ?? "",
        occupationalHistory: readLegacyText(subjective.occupationalHistory) ?? "",
        reviewOfSystems: readLegacyText(subjective.reviewOfSystems) ?? "",
      },
    });
    return buildConsultationStoredPayload(structured);
  }

  return normalizeLegacyConsultationPayload(subjective, objective, assessment, plan);
}

export function consultationInputFromStored(
  payload: ConsultationStoredPayload,
): ConsultationStructuredInput {
  return {
    assessment: payload.assessment,
    objective: { ...payload.objective },
    plan: payload.plan,
    subjective: { ...payload.subjective },
  };
}

export function consultationPayloadForRpc(payload: ConsultationStoredPayload) {
  return {
    assessment: payload.assessment ?? "",
    objective: {
      ...payload.objective,
      schemaVersion: CONSULTATION_PAYLOAD_SCHEMA_VERSION,
    },
    plan: payload.plan ?? "",
    subjective: {
      ...payload.subjective,
      schemaVersion: CONSULTATION_PAYLOAD_SCHEMA_VERSION,
    },
  };
}
