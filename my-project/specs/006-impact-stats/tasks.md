---

description: "Task list for «أثرك ← أنا» stats"
---

# Tasks: «أثرك ← أنا» Stats

## Phase 1: Setup
- [X] T001 Arabic strings under `impact` and the `--chart-mark` token (`messages/ar.json`, `src/ui/theme/tokens.css`)

## Phase 2: Foundational
- [X] T002 pgTAP first `supabase/tests/impact_stats.test.sql`: grace keeps a streak over one miss a week, second miss breaks, flag this week; consecutive days; buckets for week/month/journey; plan vs others; domains with empty ones; member-only
- [X] T003 Migration `supabase/migrations/0019_impact_stats.sql` (`habit_streak_details`, `habit_streaks`, `member_stats`, `member_insights`); green both modes; types

## Phase 3: US1 tiles (P1)
- [X] T004 [US1] `getMemberInsights` + `StatTiles.tsx` (ring) on `src/app/(member)/stats/page.tsx`

## Phase 4: US2 over time, plan vs others (P1)
- [X] T005 [P] [US2] Bucket labels in `src/lib/buckets.ts` + `tests/unit/buckets.test.ts`
- [X] T006 [US2] `CompletionBars.tsx` (hover/focus values, table view) and `PlanVsOther.tsx`

## Phase 5: US3 streaks and life areas (P2)
- [X] T007 [US3] «استُعمل الغفران» in `StreakCard.tsx`/`HabitRateList.tsx`; `LifeAreas.tsx` («التوزيع» / «الالتزام»)

## Phase 6: Polish
- [X] T008 e2e `tests/e2e/us-impact-stats.spec.ts`; axe/contrast of charts in three versions; checks; `checklists/quickstart-run.md`
