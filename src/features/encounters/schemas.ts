import { z } from "zod";
import { embeddedOneSchema } from "@/lib/supabase/relations";

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
    workers: embeddedOneSchema(z.object({ full_name: z.string() })),
  }),
);

export const queueTicketListSchema = z.array(
  z.object({
    created_at: z.string(),
    encounters: embeddedOneSchema(
      z.object({
        workers: embeddedOneSchema(z.object({ full_name: z.string() })),
      }),
    ),
    id: z.uuid(),
    priority: z.number(),
    queue_definitions: embeddedOneSchema(z.object({ name: z.string() })),
    status: z.string(),
  }),
);

export type CheckInInput = z.infer<typeof checkInSchema>;
