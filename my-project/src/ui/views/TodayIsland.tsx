"use client";

import { useState } from "react";
import { ChallengeCards } from "@/components/features/today/ChallengeCards";
import type { TodayData } from "@/server/queries/today";
import { ActivitiesCard } from "@/ui/components/ActivitiesCard";
import { HabitRow, type RowHabit } from "@/ui/components/HabitRow";
import { ProgressCard } from "@/ui/components/ProgressCard";
import { QuickActions } from "@/ui/components/QuickActions";
import { QuoteModal } from "@/ui/components/QuoteModal";

export type TodayIslandProps = {
  data: TodayData;
  isToday: boolean;
  ritual: { show: boolean; quote: { text: string; source: string | null } | null };
};

/** The interactive «يومك» cards (spec 002 US2), drawn as designed; Ionic for the quote modal and the + button. Browser-only. */
export function TodayIsland({ data, isToday, ritual }: TodayIslandProps) {
  const habits: RowHabit[] = data.habits ?? [];
  const [progress, setProgress] = useState({ done: habits.filter((h) => h.done).length, total: habits.length });
  const closed = Boolean(data.day?.closed_at);
  return (
    <div className="flex flex-col gap-[14px]">
      {habits.length > 0 && (
        <HabitRow key={data.local_date} habits={habits} localDate={data.local_date} isToday={isToday} onProgress={(done, total) => setProgress({ done, total })} />
      )}
      {habits.length > 0 && <ProgressCard done={progress.done} total={progress.total} />}
      {isToday && (
        <>
          <ChallengeCards journey={data.journey_challenge ?? null} own={data.own_challenge ?? null} library={data.library_challenge ?? null} localDate={data.local_date} />
          <ActivitiesCard activities={data.activities ?? []} timeZone={data.time_zone} />
          <QuickActions closed={closed} />
          {ritual.show && ritual.quote && <QuoteModal quote={ritual.quote} />}
        </>
      )}
    </div>
  );
}
