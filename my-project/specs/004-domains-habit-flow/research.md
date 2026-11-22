# Research: Life Domains, Habit Shape and the Add-Habit Flow

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-22

## 1. Domains are data, plan domains are focus areas

- **Decision**: table `life_domains` (seeded with seven); `focus_areas.domain_id` (nullable, unique per
  plan) marks a plan domain; a trigger caps domain-linked areas at three per plan. Free-text areas from
  spec 001 remain valid and uncounted.
- **Rationale**: reuses «خطتي»'s focus areas (ordering, habits grouping, «عادات بلا مجال») instead of a
  parallel structure; spec 005 adds per-domain texts to the same rows.
- **Alternatives**: a separate `plan_domains` table (two concepts for one thing on screen); converting all
  free-text areas (would rewrite members' words).

## 2. Repeat days as a 7-bit mask

- **Decision**: `habits.days smallint` bit *d* = weekday *d* (`extract(dow)`: 0 Sunday … 6 Saturday),
  default 127; check `days between 1 and 127`. Helper `habit_on(days, date)`.
- **Rationale**: one column, cheap to test in SQL; the UI shows Saturday first.

## 3. Counting scheduled days

- **Decision**: helper `scheduled_ord(days, date)` = number of scheduled days from a fixed Sunday epoch
  through `date` (weeks × popcount + popcount of the partial week). Then:
  - possible days in [a, b] = `scheduled_ord(b) − scheduled_ord(a − 1)`;
  - done days count only completions on scheduled days;
  - streak runs group scheduled completions by `scheduled_ord(date) − row_number()`; the current run must
    reach the last scheduled day up to yesterday (`scheduled_ord(yesterday)`), so unscheduled days never
    break it.
- **Applies to**: `habit_rates` (feeds period/month figures, member stats, group stats and member
  signals), `habit_streaks`, `my_habit_details`, `get_today`, `set_habit_done`, `close_day`.
- **Rationale**: closed-form, no per-day series; FR-036 (figures from records) holds.
- **Known limit**: history uses the current days (spec assumption).

## 4. Time of day

- **Decision**: enum `habit_time` (`morning`, `noon`, `evening`, `any`), default `any`. «يومك» groups in
  that order; within a group, `sort_order`.

## 5. Habit library

- **Decision**: table `habit_library` (domain, name, amount, hint, icon, sort_order, active), admin-only
  writes, signed-in read of active rows; `habits.library_habit_id` (on delete set null) records the
  source (used by spec 007 to match "the same habit" between peers).

## 6. Add flow UI

- **Decision**: a client component `AddHabitFlow` on `/habits/new` (server page loads domains, plan
  domains, library, and the «اجعلها عادة» prefill). Three steps in one form; steps change in place with
  a heading per step and focus moved to it; Back keeps state. No Ionic (keeps «يومك»'s budget; the page
  is separate anyway). `createHabit` gains domain, amount, time, days, library id. Plan-domain + / − are
  separate actions (`addPlanDomain`, `removePlanDomain`).
- **Rationale**: one round trip on save; works with the existing server action and error handling.

## 7. Habit detail week

- **Decision**: `get_today` returns per habit `amount`, `time_of_day`, `week` (7 entries Saturday→Friday of
  the current week: date, scheduled, done) and `week_scheduled`. HabitRow renders circles and «سجّل اليوم»
  calls the same outbox toggle.
