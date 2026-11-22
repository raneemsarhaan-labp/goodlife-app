# Implementation Plan: Life Domains, Habit Shape and the Add-Habit Flow

**Branch**: `claude/brave-rubin-kfvfjs` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

## Summary

Seven admin-managed life domains; plan domains as domain-linked focus areas (≤ 3); habits gain domain,
amount, time of day, repeat days and a library source. A 3-step add flow replaces the habit form, fed by
the admin «مكتبة العادات». All "possible days" figures switch to scheduled days through two SQL helpers
(research §3). «يومك» groups habits by time of day; the habit detail shows the week and «سجّل اليوم».

## Technical Context

**Language/Version**: TypeScript (strict), Node 22; SQL (PostgreSQL 17) — unchanged
**Primary Dependencies**: unchanged; no new packages
**Storage**: migration `0017_domains_habits.sql` ([data-model.md](./data-model.md))
**Testing**: pgTAP `domains_habits.test.sql` (schedule math, cap, RLS, figures); Vitest (days mask,
validation); Playwright `us-add-habit-flow.spec.ts` per visual version
**Target Platform / Project Type**: unchanged (PWA, single Next.js project)
**Performance Goals**: «يومك» ≤ 3 s; first-load JS ≤ 200 KB (168 KB now); `get_today` stays one call
**Constraints**: Arabic RTL; WCAG 2.1 AA in three versions; figures derived from records (FR-036)
**Scale/Scope**: 1 migration (3 tables/columns groups, 9 functions changed or added), 1 flow, 2 admin tabs

## Constitution Check

| Principle | Gate | Pre | Post | Evidence |
|-----------|------|-----|------|----------|
| I. Arabic first, RTL | strings in messages, RTL | PASS | PASS | new keys `addFlow`, `domains`, `library`; Saturday-first week |
| II. Journey is the centre | serves the year → day rhythm; derived stats | PASS | PASS | domains connect habits to the yearly plan; figures computed from completions and schedule |
| III. Roles on server, tested | RLS + tests | PASS | PASS | admin-only domain/library writes; plan-domain functions on the caller's current plan; pgTAP per rule |
| IV. Privacy | no new exposure | PASS | PASS | group aggregates still numbers only; habit names never leave the member |
| V. Mobile, ≤ 3 s, offline «يومك» | budget, offline toggles | PASS | PASS | «سجّل اليوم» uses the outbox; flow is a separate route |
| VI. Simplicity, accessibility | simplest; AA | PASS | PASS | reuses focus areas and the habit action; one flow component |
| Constraints: data | forward-only migration | PASS | PASS | additive columns with defaults; existing habits stay daily |

**Result**: no violations. Spec 001's "habits are daily only" assumption is superseded by this spec's
clarification (recorded in spec.md).

## Project Structure

```text
supabase/migrations/0017_domains_habits.sql   supabase/tests/domains_habits.test.sql   supabase/seed.sql
src/lib/days.ts                                # days mask helpers (shared, no Zod)
src/lib/validation/habits.ts                   # habit shape schema
src/server/actions/habits.ts                   # createHabit/updateHabit extended; addPlanDomain/removePlanDomain
src/server/actions/admin/content.ts            # saveLifeDomain, upsertLibraryHabit
src/server/queries/domains.ts                  # domains, plan domains, library
src/components/features/habits/AddHabitFlow.tsx  DaysPicker.tsx  TimeOfDayPicker.tsx
src/components/features/habits/HabitEditForm.tsx   # + shape fields
src/components/features/admin/content/DomainsTab.tsx  LibraryTab.tsx
src/app/(member)/habits/new/page.tsx           # flow
src/ui/components/HabitRow.tsx                  # groups, week circles, «سجّل اليوم»
tests/unit/days.test.ts  tests/e2e/us-add-habit-flow.spec.ts
```

**Structure Decision**: unchanged single project; follows spec 001/003 folders.

## Complexity Tracking

None.
