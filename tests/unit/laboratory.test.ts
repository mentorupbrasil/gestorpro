import { describe, expect, it } from "vitest";
import {
  assertLaboratoryRelease,
  assertReferenceRangeConfig,
  buildSampleBarcodePayload,
} from "@/features/exams/laboratory";

describe("laboratory workflow", () => {
  it("blocks critical result release without confirmation", () => {
    expect(() =>
      assertLaboratoryRelease({ criticalConfirmed: false, criticalFlag: true, status: "released" }),
    ).toThrow("Resultado crítico");
  });

  it("builds optional barcode payload without clinical content", () => {
    expect(
      buildSampleBarcodePayload({ orderId: "order", sampleCode: "S001", tenantId: "tenant" }),
    ).toEqual({
      kind: "laboratory-sample",
      orderId: "order",
      sampleCode: "S001",
      tenantId: "tenant",
    });
  });

  it("requires configurable reference ranges", () => {
    expect(() => assertReferenceRangeConfig({})).toThrow("Referência");
  });
});
