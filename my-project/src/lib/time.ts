/**
 * Converts a wall-clock date-time in a time zone (e.g. from <input type="datetime-local">,
 * "2026-11-24T19:30") to a UTC Date.
 */
export function zonedLocalToUtc(localDateTime: string, timeZone: string): Date {
  const m = localDateTime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) throw new Error("invalid local date-time");
  const [, y, mo, d, h, mi] = m.map(Number) as [number, number, number, number, number, number];
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Offset of the zone at that instant; refine once for DST edges.
  let utc = asUtc - offsetMs(new Date(asUtc), timeZone);
  utc = asUtc - offsetMs(new Date(utc), timeZone);
  return new Date(utc);
}

/** The wall-clock "YYYY-MM-DDTHH:mm" of an instant in a time zone (for datetime-local inputs). */
export function utcToZonedLocal(at: Date | string, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(typeof at === "string" ? new Date(at) : at)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function offsetMs(at: Date, timeZone: string): number {
  const local = utcToZonedLocal(at, timeZone);
  const [date, time] = local.split("T") as [string, string];
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  const [h, mi] = time.split(":").map(Number) as [number, number];
  return Date.UTC(y, mo - 1, d, h, mi) - Math.floor(at.getTime() / 60_000) * 60_000;
}
