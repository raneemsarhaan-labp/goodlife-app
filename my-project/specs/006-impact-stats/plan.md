# Implementation Plan: «أثرك ← أنا» Stats

**Branch**: `claude/brave-rubin-kfvfjs` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

## Summary
One SQL function `member_insights(from, to)` returns the tiles, buckets, plan-vs-others and per-domain
figures; `habit_streak_details` replaces the streak rule with the weekly grace and feeds `habit_streaks`
(so «يومك» follows) and `member_stats`. UI: tiles + ring, accessible bar chart with table, plan-vs-others
bars, streak list with «استُعمل الغفران», «أين تعيش حياتك» labelled bars with a two-tab switch.

## Technical Context
Stack unchanged; migration `0019_impact_stats.sql`; pgTAP `impact_stats.test.sql`; Vitest for bucket
labels; e2e `us-impact-stats.spec.ts`. Charts: plain HTML/SVG, single validated colour `#2f8a57`
(`--chart-mark`), hover/focus tooltips, `<table>` view (dataviz skill).

## Constitution Check
| Principle | Result | Evidence |
|-----------|--------|----------|
| I Arabic/RTL | PASS | keys under `impact`; bars laid out RTL |
| II Journey; derived stats | PASS | everything computed from completions and schedules |
| III Server roles | PASS | `member_insights` uses `auth.uid()` only |
| IV Privacy | PASS | member-only; group functions unchanged except the grace-free group aggregates |
| V ≤ 3 s | PASS | one RPC; ≤ 13 buckets |
| VI Simplicity, a11y | PASS | tables for charts; colour never alone |

## Research
- **Grace loop**: a plpgsql loop over each habit's scheduled days from its start (same start rule as
  `habit_rates`) to today, tracking the run, the longest run, and the week whose grace was used; today
  never counts as missed. ≤ 365 iterations per habit.
- **Buckets**: generated in SQL by period length; each bucket sums `habit_rates` over its dates.

## Data model
No new tables. New functions: `habit_streak_details(user, cohort)` → (habit_id, current_streak,
longest_streak, grace_this_week); `habit_streaks` delegates to it; `member_stats` adds `grace_this_week`;
`member_insights(from, to)` → {consecutive_days, active_habits, plan_vs_other {plan_done, plan_possible,
other_done, other_possible}, buckets [{from, to, done, possible}], domains [{id, name, icon, color,
habits, done, possible}]}.

## Structure
```text
supabase/migrations/0019_impact_stats.sql  supabase/tests/impact_stats.test.sql
src/server/queries/stats.ts (getMemberInsights)   src/lib/buckets.ts
src/components/features/stats/{StatTiles,CompletionBars,PlanVsOther,LifeAreas}.tsx  StreakCard/HabitRateList (+ grace)
src/app/(member)/stats/page.tsx   tests/e2e/us-impact-stats.spec.ts   tests/unit/buckets.test.ts
```
