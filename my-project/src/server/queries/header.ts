import "server-only";
import { cache } from "react";
import { journeyDay, journeyStatus, localDate } from "@/lib/journey";
import { createClient } from "@/lib/supabase/server";

export type ScreenDay = { localDate: string; journeyDay?: number; cohortName: string | null };

/**
 * The header line of «أثرك»، «المجتمع» and «المزيد» (date · journey day) and the member's cohort name,
 * from the member's current group. Cached per request.
 */
export const getScreenDay = cache(async (userId: string, timeZone: string): Promise<ScreenDay> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_memberships")
    .select("groups(cohorts(name, start_date))")
    .eq("user_id", userId)
    .eq("role", "member")
    .is("ended_on", null)
    .maybeSingle();
  const date = localDate(timeZone);
  const cohort = data?.groups?.cohorts ?? null;
  const active = cohort ? journeyStatus(cohort.start_date, date) === "active" : false;
  return { localDate: date, journeyDay: active && cohort ? journeyDay(cohort.start_date, date) : undefined, cohortName: cohort?.name ?? null };
});
