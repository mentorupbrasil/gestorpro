import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { stableCheckInIdempotencyKey } from "@/features/encounters/idempotency";
import {
  filterWorkspaceNavigation,
  workspaceNavigation,
} from "@/app/(protected)/app/_components/workspace-nav";
import {
  assertValidAppointmentWindow,
  formatUtcInTimeZone,
  unitLocalDateTimeToUtcIso,
} from "@/lib/datetime/unit-timezone";

const allowlistMigration = readFileSync(
  "supabase/migrations/202607140028_p0_rpc_execute_allowlist.sql",
  "utf8",
);
const checkInMigration = readFileSync(
  "supabase/migrations/202607140029_p0_check_in_transactional_rewrite.sql",
  "utf8",
);
const rolesMigration = readFileSync(
  "supabase/migrations/202607140030_p0_role_separation.sql",
  "utf8",
);
const legacyGrant = readFileSync(
  "supabase/migrations/202607140004_grant_operational_rpcs.sql",
  "utf8",
);

describe("P0 RPC execute allowlist", () => {
  it("revokes blanket grants and uses an explicit allowlist", () => {
    expect(allowlistMigration).toContain("revoke all on function");
    expect(allowlistMigration).toContain("allowed_names text[]");
    expect(allowlistMigration).toContain("'check_in_appointment'");
    expect(allowlistMigration).not.toContain("and proc.prosecdef");
  });

  it("neutralizes the legacy indiscriminate grant migration", () => {
    expect(legacyGrant).toContain("SUPERSEDED");
    expect(legacyGrant).not.toContain("and proc.prosecdef");
  });
});

describe("P0 check-in rewrite", () => {
  it("enforces stable idempotency key and occupational prerequisites", () => {
    expect(checkInMigration).toContain("checkin:appointment:");
    expect(checkInMigration).toContain("approved PCMSO version missing");
    expect(checkInMigration).toContain("ambiguous approved exam protocols");
    expect(checkInMigration).toContain("active employment contract missing");
    expect(checkInMigration).toContain("'reception'");
    expect(checkInMigration).toContain("'audiometry'");
    expect(checkInMigration).toContain("Apenas o primeiro ticket");
    expect(stableCheckInIdempotencyKey("11111111-1111-4111-8111-111111111111")).toBe(
      "checkin:appointment:11111111-1111-4111-8111-111111111111",
    );
  });
});

describe("P0 role separation", () => {
  it("strips clinical permissions from tenant_admin and seeds operational roles", () => {
    expect(rolesMigration).toContain("occupational_physician");
    expect(rolesMigration).toContain("receptionist");
    expect(rolesMigration).toContain("delete from public.role_permissions");
    expect(rolesMigration).toContain("'clinical.read'");
    expect(rolesMigration).toContain("role.code = 'tenant_admin'");
  });
});

describe("unit timezone conversion", () => {
  it("converts America/Fortaleza local wall time to UTC without blind Date parsing", () => {
    const iso = unitLocalDateTimeToUtcIso("2026-07-14T09:00", "America/Fortaleza");
    expect(iso).toBe("2026-07-14T12:00:00.000Z");
    expect(formatUtcInTimeZone(iso, "America/Fortaleza")).toBe("2026-07-14T09:00");
  });

  it("converts UTC wall time as identity", () => {
    expect(unitLocalDateTimeToUtcIso("2026-07-14T09:00", "UTC")).toBe("2026-07-14T09:00:00.000Z");
  });

  it("converts America/Sao_Paulo standard offset", () => {
    const iso = unitLocalDateTimeToUtcIso("2026-07-14T09:00", "America/Sao_Paulo");
    expect(iso).toBe("2026-07-14T12:00:00.000Z");
  });

  it("rejects inverted appointment windows", () => {
    expect(() =>
      assertValidAppointmentWindow("2026-07-14T13:00:00.000Z", "2026-07-14T12:00:00.000Z"),
    ).toThrow(/end must be after start/);
  });
});

describe("permission-filtered navigation", () => {
  it("hides clinical modules when permission is absent", () => {
    const filtered = filterWorkspaceNavigation(
      workspaceNavigation,
      new Set(["tenant.read", "units.read"]),
    );
    const labels = filtered.flatMap((group) =>
      group.items.map((item) => ("kind" in item ? item.label : item.label)),
    );
    expect(labels).toContain("Unidades");
    expect(labels).not.toContain("Clínica");
    expect(labels).not.toContain("Exames");
  });

  it("keeps clinical entries for physicians", () => {
    const filtered = filterWorkspaceNavigation(
      workspaceNavigation,
      new Set(["clinical.read", "consultations.manage", "exams.read"]),
    );
    const labels = filtered.flatMap((group) => group.items.map((item) => item.label));
    expect(labels).toContain("Clínica");
    expect(labels).toContain("Exames");
  });
});
