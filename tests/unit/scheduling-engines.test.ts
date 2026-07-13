import { describe, expect, it } from "vitest";
import { AppError } from "@/core/errors/app-error";
import {
  previewReferralImport,
  summarizeImportPreview,
  transitionReferralStatus,
} from "@/features/scheduling/referral-workflow";
import {
  assertNoScheduleConflict,
  cancelAppointment,
  confirmAppointment,
  rescheduleAppointment,
} from "@/features/scheduling/schedule-engine";

describe("referral workflow", () => {
  it("allows valid state transitions and rejects invalid jumps", () => {
    expect(transitionReferralStatus("draft", "ready_to_schedule")).toBe("ready_to_schedule");
    expect(() => transitionReferralStatus("cancelled", "scheduled")).toThrow(AppError);
  });

  it("previews valid and invalid import rows without silent failure", () => {
    const preview = previewReferralImport([
      {
        companyTaxId: "12.345.678/0001-90",
        occupationalExamType: "admission",
        workerCpf: "123.456.789-09",
        workerName: "Pessoa Fictícia",
      },
      { companyTaxId: "x", occupationalExamType: "unknown", workerCpf: "", workerName: "" },
    ]);

    expect(preview[0]?.status).toBe("valid");
    expect(preview[1]?.status).toBe("invalid");
    expect(summarizeImportPreview(preview)).toEqual({
      invalidCount: 1,
      rowCount: 2,
      validCount: 1,
    });
  });
});

describe("schedule engine", () => {
  const existing = [
    {
      endsAt: "2026-07-12T09:30:00.000Z",
      id: "appointment-1",
      resourceId: "room-1",
      startsAt: "2026-07-12T09:00:00.000Z",
      status: "scheduled" as const,
    },
  ];

  it("blocks resource conflicts", () => {
    expect(() =>
      assertNoScheduleConflict(
        {
          endsAt: "2026-07-12T09:45:00.000Z",
          resourceId: "room-1",
          startsAt: "2026-07-12T09:15:00.000Z",
        },
        existing,
      ),
    ).toThrow(/Conflito/);
  });

  it("allows confirmation, cancellation and reschedule transitions", () => {
    expect(confirmAppointment("scheduled")).toBe("confirmed");
    expect(cancelAppointment("confirmed")).toBe("cancelled");
    expect(
      rescheduleAppointment(
        {
          endsAt: "2026-07-12T10:30:00.000Z",
          resourceId: "room-1",
          startsAt: "2026-07-12T10:00:00.000Z",
        },
        existing,
      ),
    ).toBe("rescheduled");
  });
});
