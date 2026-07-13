import { z } from "zod";

export const clinicalPayloadSchema = z
  .record(z.string(), z.unknown())
  .refine((payload) => Object.keys(payload).length > 0, "Informe pelo menos um dado clínico.");

export const saveTriageRecordSchema = z.object({
  closeRecord: z.boolean().default(false),
  encounterId: z.string().uuid(),
  formVersionId: z.string().uuid(),
  payload: clinicalPayloadSchema,
  reason: z.string().min(3).max(500),
  tenantId: z.string().uuid(),
});

export type SaveTriageRecordInput = z.infer<typeof saveTriageRecordSchema>;

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
    user_profiles: z.object({ full_name: z.string().nullable() }).nullable().optional(),
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
