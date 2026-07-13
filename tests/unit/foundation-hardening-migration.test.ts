import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/202607130006_phase_a_foundation_hardening.sql",
  "utf8",
);

describe("phase A foundation hardening migration", () => {
  it("does not promote unit-scoped roles to tenant-wide permissions", () => {
    expect(migration).toContain("membership_role.clinic_unit_id is null");
    expect(migration).toContain("create or replace function public.has_unit_permission");
  });

  it("requires aal2 inside hardened administrative RPCs", () => {
    expect(migration.match(/if not public\.is_aal2\(\)/g)).toHaveLength(2);
    expect(migration).toContain("raise exception 'aal2 required'");
  });

  it("blocks direct authenticated DML and freezes unaudited mutating RPCs", () => {
    expect(migration).toContain(
      "revoke insert, update, delete on all tables in schema public from anon, authenticated",
    );
    expect(migration).toContain("revoke execute on function %I.%I(%s) from authenticated");
  });

  it("protects the last active tenant administrator", () => {
    expect(migration).toContain("active_tenant_admins <= 1");
    expect(migration).toContain("cannot block or remove the last active tenant administrator");
  });

  it("keeps before and after status in redacted audit metadata", () => {
    expect(migration).toContain("'after', jsonb_build_object('status', new_status)");
    expect(migration).toContain("'before', jsonb_build_object('status', previous_status)");
  });
});
