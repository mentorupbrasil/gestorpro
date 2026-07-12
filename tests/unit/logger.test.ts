import { describe, expect, it } from "vitest";
import { createOperationalLogger } from "@/lib/observability/logger";

describe("operational logger", () => {
  it("serializes only the bounded operational contract", () => {
    const output: string[] = [];
    const logger = createOperationalLogger((line) => output.push(line));

    logger.error({
      errorCode: "PERMISSION_DENIED",
      event: "authorization.denied",
      requestId: "request-1",
      route: "/app",
      status: 403,
    });

    const serialized = output.at(0);
    expect(serialized).toBeDefined();
    expect(JSON.parse(serialized ?? "{}")).toMatchObject({
      errorCode: "PERMISSION_DENIED",
      event: "authorization.denied",
      level: "error",
      requestId: "request-1",
      route: "/app",
      status: 403,
    });
    expect(serialized).not.toContain("cpf");
    expect(serialized).not.toContain("diagnosis");
  });
});
