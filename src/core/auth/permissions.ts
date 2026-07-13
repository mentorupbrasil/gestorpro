export const permissions = [
  "tenant.read",
  "tenant.manage",
  "units.read",
  "units.manage",
  "memberships.read",
  "memberships.manage",
  "roles.read",
  "roles.manage",
  "audit.read",
  "occupational.read",
  "occupational.manage",
  "protocols.read",
  "protocols.manage",
  "pricing.read",
  "pricing.manage",
] as const;

export type Permission = (typeof permissions)[number];

export function isPermission(value: string): value is Permission {
  return permissions.some((permission) => permission === value);
}
