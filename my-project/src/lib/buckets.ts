import { formatDate } from "@/lib/format";

export type Bucket = { from: string; to: string; done: number; possible: number };

/** Kind of buckets returned for a period (spec 006 FR-002): days, Saturday-start weeks, or months. */
export function bucketKind(buckets: Bucket[]): "day" | "week" | "month" {
  if (buckets.length === 0 || buckets.every((b) => b.from === b.to)) return "day";
  const span = (b: Bucket) => (Date.parse(b.to) - Date.parse(b.from)) / 86_400_000 + 1;
  return buckets.some((b) => span(b) > 7) ? "month" : "week";
}

/** Short Arabic label for a bucket: weekday, «أسبوع ٢٢ نوفمبر», or the month name. */
export function bucketLabel(b: Bucket, kind: "day" | "week" | "month", weekOf: (date: string) => string): string {
  if (kind === "day") return new Intl.DateTimeFormat("ar-u-nu-arab", { weekday: "short", timeZone: "UTC" }).format(new Date(`${b.from}T12:00:00Z`));
  if (kind === "week") return weekOf(formatDate(b.from, { withWeekday: false }));
  return new Intl.DateTimeFormat("ar-u-nu-arab", { month: "long", timeZone: "UTC" }).format(new Date(`${b.from}T12:00:00Z`));
}

export const rateOf = (done: number, possible: number) => (possible > 0 ? done / possible : 0);
