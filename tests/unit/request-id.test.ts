import { describe, expect, it } from "vitest";
import { getRequestId } from "@/lib/http/request-id";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("request id", () => {
  it("keeps a bounded upstream request id", () => {
    expect(getRequestId(new Headers({ "x-request-id": "upstream-123" }))).toBe("upstream-123");
  });

  it("generates an id when the upstream value is missing", () => {
    expect(getRequestId(new Headers())).toMatch(uuidPattern);
  });

  it("replaces an oversized upstream value", () => {
    expect(getRequestId(new Headers({ "x-request-id": "x".repeat(129) }))).toMatch(uuidPattern);
  });
});
