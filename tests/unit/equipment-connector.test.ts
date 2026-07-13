import { describe, expect, it } from "vitest";
import {
  assertConnectorScope,
  assertEquipmentCanRun,
  assertNoUniversalIntegrationPromise,
  redactConnectorPayload,
} from "@/features/integrations/equipment-connector";

describe("equipment connector workflow", () => {
  it("blocks equipment without valid calibration", () => {
    expect(() =>
      assertEquipmentCanRun({
        calibrationValid: false,
        maintenanceBlocked: false,
        status: "active",
      }),
    ).toThrow("bloqueado");
  });

  it("requires connector minimum scope", () => {
    expect(() => assertConnectorScope(["read"], "write")).toThrow("escopo");
  });

  it("redacts unnecessary clinical payload fields", () => {
    expect(redactConnectorPayload({ cpf: "x", leitura: 1, resultado: "x" })).toEqual({
      leitura: 1,
    });
  });

  it("does not allow universal integration claims", () => {
    expect(() => assertNoUniversalIntegrationPromise(["universal"])).toThrow("universal");
  });
});
