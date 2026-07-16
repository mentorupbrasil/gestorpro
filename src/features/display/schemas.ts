import { z } from "zod";

export const createDisplayPanelSchema = z.object({
  channelName: z.string().trim().min(3).max(120),
  clinicUnitId: z.uuid(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/),
  name: z.string().trim().min(2).max(160),
  tenantId: z.uuid(),
});

export const createCallEventSchema = z
  .object({
    action: z.enum(["call", "recall", "arrived", "start", "return", "no_show", "redirect"]),
    displayPanelId: z.uuid(),
    expectedVersion: z.number().int().positive().optional(),
    queueTicketId: z.uuid(),
    redirectPanelId: z.uuid().optional(),
    tenantId: z.uuid(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "redirect" && !value.redirectPanelId) {
      ctx.addIssue({
        code: "custom",
        message: "Redirect exige painel de destino.",
        path: ["redirectPanelId"],
      });
    }
    if (["start", "return", "no_show"].includes(value.action) && value.expectedVersion == null) {
      ctx.addIssue({
        code: "custom",
        message: "Ação exige versão esperada da etapa.",
        path: ["expectedVersion"],
      });
    }
  });

export const displayPanelListSchema = z.array(
  z.object({
    channel_name: z.string(),
    code: z.string(),
    id: z.uuid(),
    name: z.string(),
    status: z.enum(["active", "revoked", "inactive"]),
  }),
);

export const callEventListSchema = z.array(
  z.object({
    action: z.string(),
    created_at: z.string(),
    id: z.uuid(),
    payload_public: z.record(z.string(), z.unknown()),
    status: z.string(),
  }),
);

export type CreateCallEventInput = z.infer<typeof createCallEventSchema>;
export type CreateDisplayPanelInput = z.infer<typeof createDisplayPanelSchema>;
