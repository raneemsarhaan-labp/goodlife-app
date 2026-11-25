import { pageTitle } from "@/i18n/metadata";
import { ReflectionsView, type ReflectionRow } from "@/components/features/plan/ReflectionsView";
import { localDate } from "@/lib/journey";
import { createClient } from "@/lib/supabase/server";
import { localDateSchema } from "@/lib/validation/common";
import { requireUser } from "@/server/auth";

export const generateMetadata = pageTitle("reflections");

const DAYS = 30;

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** «تأمّلاتي»: «وقفة تأمل» notes and «ختام اليوم» reflections by date, private (spec 003 FR-004–FR-006). */
export default async function ReflectionsPage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const user = await requireUser();
  const today = localDate(user.timeZone);
  const before = localDateSchema.safeParse((await searchParams).before);
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_reflections", { p_before: before.success ? before.data : undefined, p_days: DAYS });
  const top = before.success ? before.data : null;
  const olderBefore = shiftDate(top ?? today, -DAYS);
  const newerHref = top ? `/plan/reflections${shiftDate(top, DAYS) < today ? `?before=${shiftDate(top, DAYS)}` : ""}` : null;
  return <ReflectionsView rows={(data ?? []) as ReflectionRow[]} olderHref={`/plan/reflections?before=${olderBefore}`} newerHref={newerHref} />;
}
