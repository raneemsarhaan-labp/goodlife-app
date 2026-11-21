"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { localDate } from "@/lib/journey";

/** Refreshes «يومك» at midnight in the user's time zone (and when the app comes back to the foreground). */
export function useDayRollover(timeZone: string, shownDate: string) {
  const router = useRouter();
  useEffect(() => {
    const check = () => {
      if (localDate(timeZone) !== shownDate) router.refresh();
    };
    const id = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router, timeZone, shownDate]);
}

export function DayRollover({ timeZone, shownDate }: { timeZone: string; shownDate: string }) {
  useDayRollover(timeZone, shownDate);
  return null;
}
