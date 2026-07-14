export function stableCheckInIdempotencyKey(appointmentId: string) {
  return `checkin:appointment:${appointmentId}`;
}
