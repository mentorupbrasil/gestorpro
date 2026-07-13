import { z } from "zod";

export const occupationalExamTypeSchema = z.enum([
  "admission",
  "periodic",
  "dismissal",
  "return_to_work",
  "change_of_risk",
]);

export const riskTypeSchema = z.enum([
  "physical",
  "chemical",
  "biological",
  "ergonomic",
  "accident",
]);

export const createCompanySchema = z.object({
  legalName: z.string().trim().min(2).max(180),
  taxId: z
    .string()
    .trim()
    .regex(/^[0-9.\-/]{14,18}$/),
  tenantId: z.uuid(),
  tradeName: z.string().trim().max(180).optional(),
});

export const createWorkerSchema = z.object({
  cpf: z
    .string()
    .trim()
    .regex(/^[0-9.\-]{11,14}$/),
  fullName: z.string().trim().min(2).max(180),
  tenantId: z.uuid(),
});

export const createExamCatalogItemSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9_.-]{1,63}$/),
  name: z.string().trim().min(2).max(180),
  resultType: z.enum(["clinical", "laboratory", "imaging", "audiometry", "spirometry", "other"]),
  tenantId: z.uuid(),
});

export const createPcmsoVersionSchema = z.object({
  companyId: z.uuid(),
  name: z.string().trim().min(2).max(180),
  programCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/),
  tenantId: z.uuid(),
  validFrom: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  validUntil: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
    .optional()
    .or(z.literal("")),
  versionNumber: z.coerce.number().int().positive(),
});

export const createOccupationalStructureSchema = z.object({
  companyId: z.uuid(),
  establishmentCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/),
  establishmentName: z.string().trim().min(2).max(160),
  exposureGroupCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/),
  exposureGroupName: z.string().trim().min(2).max(160),
  jobCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/),
  jobName: z.string().trim().min(2).max(160),
  riskCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/),
  riskName: z.string().trim().min(2).max(160),
  riskType: riskTypeSchema,
  sectorCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/),
  sectorName: z.string().trim().min(2).max(160),
  startsOn: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  tenantId: z.uuid(),
  workerId: z.uuid(),
});

export const createManualExamOverrideSchema = z.object({
  action: z.enum(["add", "remove"]),
  employmentContractId: z.uuid().nullable(),
  examCatalogId: z.uuid(),
  examProtocolId: z.uuid().nullable(),
  justification: z.string().trim().min(10).max(500),
  tenantId: z.uuid(),
  workerId: z.uuid().nullable(),
});

export const companyListSchema = z.array(
  z.object({
    id: z.uuid(),
    legal_name: z.string(),
    status: z.enum(["active", "inactive"]),
    tax_id_normalized: z.string(),
    trade_name: z.string().nullable(),
  }),
);

export const workerListSchema = z.array(
  z.object({
    full_name: z.string(),
    id: z.uuid(),
    status: z.enum(["active", "inactive"]),
  }),
);

export const examCatalogListSchema = z.array(
  z.object({
    active: z.boolean(),
    code: z.string(),
    id: z.uuid(),
    name: z.string(),
    result_type: z.string(),
  }),
);

export const pcmsoVersionListSchema = z.array(
  z.object({
    companies: z.object({ legal_name: z.string() }).nullable(),
    id: z.uuid(),
    status: z.enum(["draft", "approved", "expired"]),
    valid_from: z.string(),
    valid_until: z.string().nullable(),
    version_number: z.number(),
  }),
);

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type CreateExamCatalogItemInput = z.infer<typeof createExamCatalogItemSchema>;
export type CreateManualExamOverrideInput = z.infer<typeof createManualExamOverrideSchema>;
export type CreateOccupationalStructureInput = z.infer<typeof createOccupationalStructureSchema>;
export type CreatePcmsoVersionInput = z.infer<typeof createPcmsoVersionSchema>;
export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type OccupationalExamType = z.infer<typeof occupationalExamTypeSchema>;
