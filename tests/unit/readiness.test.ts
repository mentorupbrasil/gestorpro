import { describe, expect, it } from "vitest";
import {
  assertNoRealDataInPilot,
  evaluateGoNoGo,
  requireHumanValidation,
} from "@/features/operations/readiness";

describe("production readiness", () => {
  it("returns NO-GO while critical items are pending", () => {
    expect(
      evaluateGoNoGo([
        { area: "pentest", severity: "critical", status: "pending" },
        { area: "docs", severity: "low", status: "passed" },
      ]).decision,
    ).toBe("NO-GO");
  });

  it("blocks real data in pilot fixtures", () => {
    expect(() => assertNoRealDataInPilot("paciente real")).toThrow("dados reais");
  });

  it("requires all human validations", () => {
    expect(() =>
      requireHumanValidation({ juridico: true, medico: false, seguranca: true }),
    ).toThrow("pendentes");
  });
});
