import { describe, expect, it } from "vitest";
import {
  assertEsocialEnvironment,
  assertEsocialPayloadShape,
  buildEsocialIdempotencyKey,
  classifyEsocialBatchStatus,
  esocialReference,
  hashEsocialPayload,
} from "@/features/integrations/esocial";

describe("esocial workflow", () => {
  it("records the official consulted layout reference", () => {
    expect(esocialReference.layoutVersion).toBe("S-1.3");
    expect(esocialReference.technicalNote).toContain("NT 06/2026");
  });

  it("blocks production without separate authorization", () => {
    expect(() => assertEsocialEnvironment("production", false)).toThrow("Produção eSocial");
  });

  it("hashes versioned payloads", () => {
    expect(hashEsocialPayload({ evt: { id: "1" } })).toHaveLength(64);
  });

  it("validates minimal internal payload shape without inventing official fields", () => {
    expect(assertEsocialPayloadShape({ evt: { ficticio: true } })).toEqual({
      evt: { ficticio: true },
    });
  });

  it("builds stable idempotency keys and classifies batch status", () => {
    expect(
      buildEsocialIdempotencyKey({
        businessKey: "worker/1",
        eventType: "S-2240",
        operation: "original",
      }),
    ).toBe("S-2240:original:worker_1");
    expect(classifyEsocialBatchStatus({ accepted: 1, rejected: 1 })).toBe("partially_rejected");
  });
});
