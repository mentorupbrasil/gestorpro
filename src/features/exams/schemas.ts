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

export const audiometryThresholdsSchema = z.object({
  left: z.record(z.string(), z.coerce.number()),
  right: z.record(z.string(), z.coerce.number()),
});

export const startAudiometryExamSchema = z.object({
  examOrderId: z.string().uuid(),
  tenantId: z.string().uuid(),
});

export type StartAudiometryExamInput = z.infer<typeof startAudiometryExamSchema>;

export const saveAudiometryResultSchema = z.object({
  booth: z.record(z.string(), z.unknown()).default({}),
  calibrationId: z.string().uuid(),
  comparison: z.record(z.string(), z.unknown()).default({}),
  complaints: z.array(z.string()).default([]),
  completeResult: z.boolean().default(false),
  correctionReason: z.string().min(3).max(500),
  equipment: z.record(z.string(), z.unknown()),
  inconclusiveResult: z.boolean().default(false),
  masking: z.record(z.string(), z.unknown()).default({}),
  normalizedPayload: z.record(z.string(), z.unknown()).default({}),
  occupationalData: z.record(z.string(), z.unknown()),
  originalImportPayload: z.record(z.string(), z.unknown()).nullable().default(null),
  otoscopy: z.record(z.string(), z.unknown()).default({}),
  professionalConclusion: z.string().min(5).max(5000),
  report: z.string().max(10000).optional().default(""),
  restReported: z.object({
    hours: z.coerce.number(),
    informedAt: z.string().optional(),
  }),
  resultId: z.string().uuid(),
  tenantId: z.string().uuid(),
  thresholds: audiometryThresholdsSchema,
});

export type SaveAudiometryResultInput = z.infer<typeof saveAudiometryResultSchema>;

export const audiometryCalibrationListSchema = z.array(
  z.object({
    equipment_name: z.string(),
    equipment_serial: z.string(),
    id: z.string(),
    status: z.string(),
    valid_until: z.string(),
  }),
);

export const audiometryResultListSchema = z.array(
  z.object({
    current_version: z.number(),
    exam_order_id: z.string(),
    id: z.string(),
    status: z.string(),
  }),
);
