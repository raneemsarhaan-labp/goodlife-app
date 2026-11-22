---

description: "Task list for life domains, habit shape and the add-habit flow"
---

# Tasks: Life Domains, Habit Shape and the Add-Habit Flow

**Input**: Design documents from `/specs/004-domains-habit-flow/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included (constitution: a test per permission rule; spec SC-002 schedule math).

## Format: `[ID] [P?] [Story] Description`

Paths are relative to `my-project/`; field rules are canonical in `data-model.md` (`Entity.field`).

---

## Phase 1: Setup

- [ ] T001 Arabic strings for the add flow, domains, library, time of day, weekdays, week circles, admin tabs in `messages/ar.json`
- [ ] T002 [P] Days-mask helpers (Saturday-first order, mask ↔ weekday list, label) in `src/lib/days.ts` with unit tests in `tests/unit/days.test.ts`

## Phase 2: Foundational

- [ ] T003 pgTAP first in `supabase/tests/domains_habits.test.sql`: domains/library read for members and admin-only writes; plan-domain cap of three; habit domain follows its focus area; `habit_on` and `scheduled_ord`; `get_today` lists only scheduled habits with totals; `habit_rates` possible/done on scheduled days; streak across unscheduled days; `my_habit_details` week
- [ ] T004 Migration `supabase/migrations/0017_domains_habits.sql`: `life_domains` (data-model.md `life_domains.key`, `life_domains.name`, `life_domains.icon`, `life_domains.color`), `habit_library` (`habit_library.name`, `habit_library.amount`, `habit_library.hint`, `habit_library.icon`), `focus_areas.domain_id` with cap trigger, habit columns (`habits.domain_id`, `habits.amount`, `habits.time_of_day`, `habits.days`, `habits.library_habit_id`), RLS and grants, seed of the seven domains
- [ ] T005 Same migration: helpers `habit_on`, `scheduled_ord`; schedule-aware `habit_rates`, `habit_streaks`, `my_habit_details`, `get_today`, `set_habit_done`, `close_day`; `add_plan_domain`, `remove_plan_domain`
- [ ] T006 Seed library and member1 domain links in `supabase/seed.sql`; run `npm run db:test:local` (both modes) until green; regenerate types

## Phase 3: US1 — Add a habit through domains and suggestions (P1) 🎯 MVP

- [ ] T007 [P] [US1] Habit shape schema (data-model.md `habits.amount`, `habits.time_of_day`, `habits.days`) in `src/lib/validation/habits.ts`; unit tests in `tests/unit/days.test.ts`
- [ ] T008 [US1] `createHabit` accepts domain, library id, amount, time, days; `addPlanDomain` / `removePlanDomain` in `src/server/actions/habits.ts`
- [ ] T009 [P] [US1] Queries `src/server/queries/domains.ts` (active domains, plan domains with description flag, active library by domain)
- [ ] T010 [US1] `src/components/features/habits/AddHabitFlow.tsx` (+ `DaysPicker.tsx`, `TimeOfDayPicker.tsx`): step 1 domains with + / −, step 2 suggestions / «عادة من عندي», step 3 customise; Back keeps state; focus moves to each step heading
- [ ] T011 [US1] `src/app/(member)/habits/new/page.tsx` renders the flow; `?from=` opens step 2 prefilled; `?returnTo=plan&area=` preselects the domain
- [ ] T012 [P] [US1] e2e `tests/e2e/us-add-habit-flow.spec.ts`: suggestion path, own-habit path, plan-domain + / − with the cap, five-day habit absent on an unscheduled day, axe on each step

## Phase 4: US2 — «يومك» and figures follow the schedule (P1)

- [ ] T013 [US2] `get_today` types (`amount`, `time_of_day`, `week`, `week_scheduled`) in `src/server/queries/today.ts`
- [ ] T014 [US2] `src/ui/components/HabitRow.tsx`: time-of-day groups, week circles (Saturday first; done / missed / not scheduled / upcoming; today marked), weekly «done/scheduled», amount, «سجّل اليوم» through the outbox
- [ ] T015 [P] [US2] e2e additions in `tests/e2e/us-add-habit-flow.spec.ts`: groups order, week circles, «سجّل اليوم» toggles; existing spec 001 stats specs stay green

## Phase 5: US3 — Admins manage domains and the library (P2)

- [ ] T016 [P] [US3] Schemas (data-model.md `life_domains.name`, `life_domains.icon`, `life_domains.color`, `habit_library.name`, `habit_library.amount`, `habit_library.hint`) and actions `saveLifeDomain`, `upsertLibraryHabit` in `src/lib/validation/admin.ts`, `src/server/actions/admin/content.ts`
- [ ] T017 [US3] Tabs `src/components/features/admin/content/DomainsTab.tsx` and `LibraryTab.tsx`, registered in `src/app/admin/content/page.tsx`

## Phase 6: US4 — Edit a habit's shape (P3)

- [ ] T018 [US4] `updateHabit` and `src/components/features/habits/HabitEditForm.tsx` gain domain, amount, time of day, days; `src/app/(member)/habits/[id]/page.tsx` loads them

## Phase 7: Polish

- [ ] T019 [P] Add `/habits/new` steps and admin tabs to `tests/e2e/a11y-all-routes.spec.ts` and screenshots
- [ ] T020 Run lint, typecheck, unit, DB (both modes), build, bundle budget; record in `specs/004-domains-habit-flow/checklists/quickstart-run.md`; screenshot the flow in three versions

## Dependencies

Setup → Foundational (T003 before T004–T005; green at T006) → US1 → US2 (shares HabitRow/get_today types) →
US3, US4 (independent) → Polish. Parallel: T002; T007/T009/T012; T016; T019.
