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

export const assignMembershipRoleSchema = z.object({
  clinicUnitId: z.uuid().nullable().optional(),
  membershipId: z.uuid(),
  roleId: z.uuid(),
  tenantId: z.uuid(),
});

export const revokeMembershipRoleSchema = z.object({
  membershipRoleId: z.uuid(),
  tenantId: z.uuid(),
});

export const provisionTenantSchema = z.object({
  legalName: z.string().trim().min(2).max(200),
  tradeName: z.string().trim().min(2).max(120).optional(),
});

export const signUpSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  email: z.email(),
  legalName: z.string().trim().min(2).max(200),
  password: z.string().min(8).max(128),
  tradeName: z.string().trim().min(2).max(120).optional(),
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
    membership_roles: z.array(
      z.object({
        id: z.uuid(),
        roles: z
          .object({
            code: z.string(),
            id: z.uuid(),
            name: z.string(),
          })
          .nullable(),
      }),
    ),
    status: z.enum(["active", "blocked", "inactive"]),
    user_id: z.uuid(),
    user_profiles: z.object({ display_name: z.string() }).nullable(),
  }),
);

export const assignableRoleListSchema = z.array(
  z.object({
    code: z.string(),
    id: z.uuid(),
    name: z.string(),
    tenant_id: z.uuid().nullable(),
  }),
);

export type CreateClinicUnitInput = z.infer<typeof createClinicUnitSchema>;
export type SetMembershipStatusInput = z.infer<typeof setMembershipStatusSchema>;
export type AssignMembershipRoleInput = z.infer<typeof assignMembershipRoleSchema>;
export type RevokeMembershipRoleInput = z.infer<typeof revokeMembershipRoleSchema>;
export type ProvisionTenantInput = z.infer<typeof provisionTenantSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
