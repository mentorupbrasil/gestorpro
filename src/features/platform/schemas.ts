import { z } from "zod";

export const createClinicUnitSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/),
  name: z.string().trim().min(2).max(160),
  tenantId: z.uuid(),
});

export const setMembershipStatusSchema = z.object({
  membershipId: z.uuid(),
  status: z.enum(["active", "blocked", "inactive"]),
  tenantId: z.uuid(),
});

export const tenantOptionListSchema = z.array(
  z.object({
    tenant_id: z.uuid(),
    tenants: z.object({ legal_name: z.string(), trade_name: z.string().nullable() }).nullable(),
  }),
);

export const clinicUnitListSchema = z.array(
  z.object({
    code: z.string(),
    id: z.uuid(),
    name: z.string(),
    status: z.enum(["active", "inactive"]),
  }),
);

export const accessMembershipListSchema = z.array(
  z.object({
    id: z.uuid(),
    membership_roles: z.array(z.object({ roles: z.object({ name: z.string() }).nullable() })),
    status: z.enum(["active", "blocked", "inactive"]),
    user_id: z.uuid(),
    user_profiles: z.object({ display_name: z.string() }).nullable(),
  }),
);

export type CreateClinicUnitInput = z.infer<typeof createClinicUnitSchema>;
export type SetMembershipStatusInput = z.infer<typeof setMembershipStatusSchema>;
