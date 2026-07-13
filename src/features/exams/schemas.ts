import { z } from "zod";

const eyeAcuitySchema = z.object({
  farWithCorrection: z.string().optional().default(""),
  farWithoutCorrection: z.string().optional().default(""),
  nearWithCorrection: z.string().optional().default(""),
  nearWithoutCorrection: z.string().optional().default(""),
});

export const visualAcuityPayloadSchema = z.object({
  binocular: eyeAcuitySchema,
  leftEye: eyeAcuitySchema,
  rightEye: eyeAcuitySchema,
});

export type VisualAcuityPayloadInput = z.infer<typeof visualAcuityPayloadSchema>;

export const startVisualAcuityExamSchema = z.object({
  examOrderId: z.string().uuid(),
  tenantId: z.string().uuid(),
});

export type StartVisualAcuityExamInput = z.infer<typeof startVisualAcuityExamSchema>;

export const saveVisualAcuityResultSchema = z.object({
  chartType: z.string().min(2).max(120),
  completeResult: z.boolean().default(false),
  correctionReason: z.string().min(3).max(500),
  equipmentName: z.string().min(2).max(160),
  observations: z.string().max(5000).optional().default(""),
  payload: visualAcuityPayloadSchema,
  professionalConclusion: z.string().min(5).max(5000),
  resultId: z.string().uuid(),
  tenantId: z.string().uuid(),
  testConditions: z.record(z.string(), z.unknown()).default({}),
});

export type SaveVisualAcuityResultInput = z.infer<typeof saveVisualAcuityResultSchema>;

export const examOrderListSchema = z.array(
  z.object({
    encounter_id: z.string(),
    exam_catalog: z.object({ name: z.string() }).nullable().optional(),
    id: z.string(),
    status: z.string(),
  }),
);

export const visualAcuityResultListSchema = z.array(
  z.object({
    current_version: z.number(),
    exam_order_id: z.string(),
    id: z.string(),
    status: z.string(),
  }),
);
