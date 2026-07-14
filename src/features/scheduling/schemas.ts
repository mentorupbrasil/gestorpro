import { z } from "zod";

export const createScheduleResourceSchema = z.object({
  clinicUnitId: z.uuid(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/),
  name: z.string().trim().min(2).max(160),
  resourceType: z.enum(["room", "professional", "equipment", "procedure"]),
  tenantId: z.uuid(),
});

export const createReferralSchema = z.object({
  asOf: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
    .optional(),
  companyId: z.uuid(),
  occupationalExamType: z.enum([
    "admission",
    "periodic",
    "dismissal",
    "return_to_work",
    "change_of_risk",
  ]),
  riskCodes: z.array(z.string().trim().min(1).max(32)).default([]),
  tenantId: z.uuid(),
  validUntil: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
    .optional()
    .or(z.literal("")),
  workerId: z.uuid(),
});

export const createAppointmentSchema = z.object({
  clinicUnitId: z.uuid(),
  endsAt: z.string().datetime(),
  preparationInstructions: z.string().trim().max(1000).optional(),
  referralId: z.uuid().nullable(),
  resourceId: z.uuid(),
  startsAt: z.string().datetime(),
  tenantId: z.uuid(),
});

export const scheduleResourceListSchema = z.array(
  z.object({
    code: z.string(),
    id: z.uuid(),
    name: z.string(),
    resource_type: z.string(),
    status: z.enum(["active", "blocked", "inactive"]),
  }),
);

export const referralListSchema = z.array(
  z.object({
    companies: z.object({ legal_name: z.string() }).nullable(),
    id: z.uuid(),
    occupational_exam_type: z.string(),
    status: z.string(),
    workers: z.object({ full_name: z.string() }).nullable(),
  }),
);

export const appointmentListSchema = z.array(
  z.object({
    ends_at: z.string(),
    id: z.uuid(),
    schedule_resources: z.object({ name: z.string() }).nullable(),
    starts_at: z.string(),
    status: z.string(),
  }),
);

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CreateReferralInput = z.infer<typeof createReferralSchema>;
export type CreateScheduleResourceInput = z.infer<typeof createScheduleResourceSchema>;
