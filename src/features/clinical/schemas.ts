import { z } from "zod";
import {
  buildTriageStoredPayload,
  hasTriageClinicalData,
  triageStructuredInputSchema,
  type TriageStoredPayload,
} from "./triage-payload";

export const clinicalPayloadSchema = z
  .record(z.string(), z.unknown())
  .refine((payload) => Object.keys(payload).length > 0, "Informe pelo menos um dado clínico.");

export const saveTriageRecordSchema = z
  .object({
    closeRecord: z.boolean().default(false),
    encounterId: z.string().uuid(),
    formVersionId: z.string().uuid(),
    input: triageStructuredInputSchema,
    reason: z.string().trim().min(3).max(500),
    tenantId: z.string().uuid(),
  })
  .superRefine((value, context) => {
    if (!hasTriageClinicalData(value.input)) {
      context.addIssue({
        code: "custom",
        message: "Informe pelo menos um dado clínico.",
        path: ["input"],
      });
    }
  })
  .transform((value) => ({
    ...value,
    payload: buildTriageStoredPayload(value.input) satisfies TriageStoredPayload,
  }));

export type SaveTriageRecordInput = {
  closeRecord?: boolean;
  encounterId: string;
  formVersionId: string;
  input: z.output<typeof triageStructuredInputSchema>;
  reason: string;
  tenantId: string;
};
export type SaveTriageRecordParsed = z.output<typeof saveTriageRecordSchema>;

export const closeMedicalConsultationSchema = z.object({
  assessment: z.string().max(5000).optional().default(""),
  encounterId: z.string().uuid(),
  objective: clinicalPayloadSchema,
  physicianCredentialId: z.string().uuid(),
  plan: z.string().max(5000).optional().default(""),
  reason: z.string().min(3).max(500),
  subjective: clinicalPayloadSchema,
  tenantId: z.string().uuid(),
});

export type CloseMedicalConsultationInput = z.infer<typeof closeMedicalConsultationSchema>;

export const createMedicalConclusionSchema = z.object({
  conclusionCode: z.enum(["fit", "fit_with_restrictions", "unfit", "inconclusive"]),
  consultationId: z.string().uuid(),
  encounterId: z.string().uuid(),
  notes: z.string().max(5000).optional().default(""),
  physicianCredentialId: z.string().uuid(),
  restrictions: z.array(z.string().min(2).max(250)).default([]),
  tenantId: z.string().uuid(),
});

export type CreateMedicalConclusionInput = z.infer<typeof createMedicalConclusionSchema>;

export const encounterClinicalListSchema = z.array(
  z.object({
    id: z.string(),
    status: z.string(),
    workers: z.object({ full_name: z.string() }).nullable().optional(),
  }),
);

export const triageFormVersionListSchema = z.array(
  z.object({
    id: z.string(),
    version: z.number(),
    triage_form_templates: z.object({ name: z.string() }).nullable().optional(),
  }),
);

export const physicianCredentialListSchema = z.array(
  z.object({
    council_code: z.string().nullable(),
    council_region: z.string().nullable(),
    id: z.string(),
    professional_role: z.string(),
    registration_number: z.string().nullable(),
    user_profiles: z.object({ display_name: z.string().nullable() }).nullable().optional(),
  }),
);

export const clinicalTimelineSchema = z.array(
  z.object({
    created_at: z.string(),
    event_type: z.string().optional(),
    id: z.string(),
    payload: z.record(z.string(), z.unknown()).optional(),
  }),
);

export const triageQueueRowSchema = z.object({
  checked_in_at: z.string(),
  clinic_unit_id: z.string().uuid(),
  clinic_units: z.object({ name: z.string() }).nullable(),
  encounter_steps: z
    .array(
      z.object({
        id: z.string().uuid(),
        status: z.string(),
        step_type: z.string(),
      }),
    )
    .default([]),
  id: z.string().uuid(),
  queue_tickets: z
    .array(
      z.object({
        id: z.string().uuid(),
        priority: z.number(),
        queue_definitions: z.object({ name: z.string() }).nullable(),
        status: z.string(),
      }),
    )
    .default([]),
  referrals: z
    .object({
      companies: z.object({ legal_name: z.string() }).nullable(),
      occupational_exam_type: z.string(),
    })
    .nullable(),
  status: z.string(),
  triage_records: z
    .array(
      z.object({
        current_version: z.number(),
        id: z.string().uuid(),
        status: z.string(),
      }),
    )
    .default([]),
  workers: z.object({ full_name: z.string() }).nullable(),
});

export const triageQueueListSchema = z.array(triageQueueRowSchema);

export const triageRecordVersionSchema = z.object({
  payload: z.record(z.string(), z.unknown()),
  version: z.number(),
});

export const triageWorkspaceRecordSchema = z.object({
  current_version: z.number(),
  encounter_id: z.string().uuid(),
  form_version_id: z.string().uuid(),
  id: z.string().uuid(),
  status: z.string(),
  triage_record_versions: z.array(triageRecordVersionSchema).default([]),
});

export const approvedTriageFormVersionSchema = z.object({
  id: z.string().uuid(),
  triage_form_templates: z.object({ name: z.string() }).nullable(),
  version: z.number(),
});
