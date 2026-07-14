/**
 * Converte datetime-local (sem offset) no timezone da unidade para ISO UTC.
 * Não use `new Date(datetimeLocal).toISOString()` — isso interpreta o valor
 * como horário do browser/servidor, não da unidade.
 */
export function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - instant.getTime();
}

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

export function unitLocalDateTimeToUtcIso(localDateTime: string, timeZone: string): string {
  const match = LOCAL_DATE_TIME.exec(localDateTime.trim());
  if (!match) {
    throw new Error("invalid local datetime; expected YYYY-MM-DDTHH:mm");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  let instant = new Date(utcGuess);
  const offset = getTimeZoneOffsetMs(instant, timeZone);
  instant = new Date(utcGuess - offset);

  const offsetAfter = getTimeZoneOffsetMs(instant, timeZone);
  if (offsetAfter !== offset) {
    instant = new Date(utcGuess - offsetAfter);
  }

  return instant.toISOString();
}

export function formatUtcInTimeZone(isoUtc: string, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const formatted = formatter.format(new Date(isoUtc));
  return formatted.replace(" ", "T");
}

export function assertValidAppointmentWindow(startsAtIso: string, endsAtIso: string) {
  const starts = Date.parse(startsAtIso);
  const ends = Date.parse(endsAtIso);
  if (!Number.isFinite(starts) || !Number.isFinite(ends) || ends <= starts) {
    throw new Error("appointment end must be after start");
  }
}
