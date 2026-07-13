import { describe, expect, it } from "vitest";
import {
  assertCommercialDoesNotChangeClinicalProtocol,
  buildPriceSnapshotHash,
  computeInvoiceTotal,
  requireAdjustmentJustification,
  toSafeCompanyPortalStatus,
} from "@/features/finance/finance-workflow";

describe("finance workflow", () => {
  it("keeps price snapshot stable", () => {
    expect(buildPriceSnapshotHash({ item: "ASO", cents: 1000 })).toHaveLength(64);
  });

  it("does not allow commercial price to change clinical protocol", () => {
    expect(() =>
      assertCommercialDoesNotChangeClinicalProtocol({ clinicalProtocolChanged: true }),
    ).toThrow("Preço comercial");
  });

  it("ignores non-billable technical repeats", () => {
    expect(
      computeInvoiceTotal([
        { amountCents: 1000, billable: true },
        { amountCents: 500, billable: true, technicalRepeat: true },
        { amountCents: 300, billable: false },
      ]),
    ).toBe(1000);
  });

  it("requires adjustment justification", () => {
    expect(() => requireAdjustmentJustification("curto")).toThrow("Ajuste");
  });

  it("maps clinical statuses to safe company portal labels", () => {
    expect(toSafeCompanyPortalStatus("inconclusive")).toBe("Em processamento");
  });
});
