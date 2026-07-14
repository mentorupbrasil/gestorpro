import { z } from "zod";

export const checkInSchema = z.object({
  appointmentId: z.uuid(),
  idempotencyKey: z.string().trim().min(8).max(128),
  tenantId: z.uuid(),
});

export const encounterListSchema = z.array(
  z.object({
    checked_in_at: z.string(),
    exam_orders: z
      .array(z.object({ id: z.uuid() }))
      .nullable()
      .optional(),
    id: z.uuid(),
    status: z.string(),
    workers: z.object({ full_name: z.string() }).nullable(),
  }),
);

export const queueTicketListSchema = z.array(
  z.object({
    created_at: z.string(),
    encounters: z.object({ workers: z.object({ full_name: z.string() }).nullable() }).nullable(),
    id: z.uuid(),
    priority: z.number(),
    queue_definitions: z.object({ name: z.string() }).nullable(),
    status: z.string(),
  }),
);

export type CheckInInput = z.infer<typeof checkInSchema>;
