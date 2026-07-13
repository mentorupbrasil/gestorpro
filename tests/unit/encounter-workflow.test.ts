import { describe, expect, it } from "vitest";
import { AppError } from "@/core/errors/app-error";
import {
  orderQueueTickets,
  releaseDependentStep,
  transitionEncounter,
  transitionEncounterStep,
} from "@/features/encounters/workflow";

describe("encounter workflow", () => {
  it("allows valid encounter transitions and rejects frontend-only jumps", () => {
    expect(transitionEncounter("checked_in", "in_progress")).toBe("in_progress");
    expect(() => transitionEncounter("completed", "in_progress")).toThrow(AppError);
  });

  it("releases dependent steps only after completion", () => {
    expect(releaseDependentStep("completed")).toBe("available");
    expect(() => releaseDependentStep("in_progress")).toThrow(/Dependência/);
  });

  it("moves steps through controlled states", () => {
    expect(transitionEncounterStep("available", "in_progress")).toBe("in_progress");
    expect(transitionEncounterStep("in_progress", "completed")).toBe("completed");
    expect(() => transitionEncounterStep("completed", "in_progress")).toThrow(AppError);
  });

  it("orders queue by priority then arrival", () => {
    const ordered = orderQueueTickets([
      { createdAt: "2026-07-12T10:00:00.000Z", priority: 100 },
      { createdAt: "2026-07-12T10:01:00.000Z", priority: 10 },
      { createdAt: "2026-07-12T09:59:00.000Z", priority: 100 },
    ]);

    expect(ordered.map((ticket) => `${ticket.priority}-${ticket.createdAt}`)).toEqual([
      "10-2026-07-12T10:01:00.000Z",
      "100-2026-07-12T09:59:00.000Z",
      "100-2026-07-12T10:00:00.000Z",
    ]);
  });
});
