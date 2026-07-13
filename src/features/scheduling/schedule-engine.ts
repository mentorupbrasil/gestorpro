import { AppError } from "@/core/errors/app-error";

export type AppointmentStatus =
  "scheduled" | "confirmed" | "cancelled" | "rescheduled" | "no_show" | "completed";

export type AppointmentSlot = Readonly<{
  endsAt: string;
  id: string;
  resourceId: string;
  startsAt: string;
  status: AppointmentStatus;
}>;

export type AppointmentRequest = Readonly<{
  endsAt: string;
  resourceId: string;
  startsAt: string;
}>;

function overlaps(left: AppointmentRequest, right: AppointmentSlot) {
  return left.startsAt < right.endsAt && left.endsAt > right.startsAt;
}

export function assertNoScheduleConflict(
  request: AppointmentRequest,
  existingAppointments: readonly AppointmentSlot[],
) {
  if (request.endsAt <= request.startsAt) {
    throw new AppError("VALIDATION_FAILED", "Horário de agenda inválido.", { status: 422 });
  }

  const conflict = existingAppointments.find(
    (appointment) =>
      appointment.resourceId === request.resourceId &&
      ["scheduled", "confirmed", "rescheduled"].includes(appointment.status) &&
      overlaps(request, appointment),
  );

  if (conflict) {
    throw new AppError("PROTOCOL_CONFLICT", "Conflito de agenda para o recurso.", {
      details: { appointmentId: conflict.id, resourceId: request.resourceId },
      status: 409,
    });
  }
}

export function cancelAppointment(status: AppointmentStatus) {
  if (!["scheduled", "confirmed", "rescheduled"].includes(status)) {
    throw new AppError("VALIDATION_FAILED", "Agendamento não pode ser cancelado neste estado.", {
      status: 409,
    });
  }

  return "cancelled" as const;
}

export function confirmAppointment(status: AppointmentStatus) {
  if (status !== "scheduled" && status !== "rescheduled") {
    throw new AppError("VALIDATION_FAILED", "Agendamento não pode ser confirmado neste estado.", {
      status: 409,
    });
  }

  return "confirmed" as const;
}

export function rescheduleAppointment(
  request: AppointmentRequest,
  existingAppointments: readonly AppointmentSlot[],
) {
  assertNoScheduleConflict(request, existingAppointments);
  return "rescheduled" as const;
}
