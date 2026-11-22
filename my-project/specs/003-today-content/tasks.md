---

description: "Task list for «يومك» content: desired state, activity registration, «اجعلها عادة»"
---

# Tasks: «يومك» Content — Desired State, Activity Registration, «اجعلها عادة»

**Input**: Design documents from `/specs/003-today-content/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included — constitution v1.2.0 requires an automated test for every permission rule, axe
checks and e2e before merge; the spec adds privacy (SC-002) and capacity under concurrency (SC-004).

**Organization**: by user story (US1 desired state and reflections, US2 activity registration, US3
«اجعلها عادة»). Each story can ship alone after Phase 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: US1–US3 from spec.md
- Paths are relative to `my-project/`; field rules are canonical in `data-model.md` (`Entity.field`).

---

## Phase 1: Setup

**Purpose**: Seed data and message keys every story uses.

- [ ] T001 Add Arabic strings under `desiredState`, `reflections`, `activityRegistration`, `makeHabit` (card titles, empty states, «تمّ حفظ تأمّلك», «سجّلني», «ألغِ تسجيلي», «مكتمل العدد», «نشاط سجّلت فيه», «أونلاين»/«حضوري», «اجعلها عادة», «من تحدّي اليوم», errors) and `meta` page titles in `messages/ar.json`
- [ ] T002 [P] Extend `supabase/seed.sql`: desired state for member1; one registration-open online activity for the seed cohort with four weekly sessions, capacity 2 and a meeting link (data-model.md `activities.registration_open`, `activities.capacity`, `activities.mode`, `activity_links.meeting_url`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migration, permission tests and generated types that all stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Write pgTAP tests first in `supabase/tests/today_content.test.sql`: `plans.desired_state` self-only; reflections self-only (facilitator, group member, admin denied), insert only via function, idempotent on `client_mutation_id`; sessions/links/registrations RLS per role; meeting link hidden from non-registered audience members; register/cancel window, closed and cancelled activities, capacity reached; `activity_registrations()` facilitator sees own groups only; existing activities back-filled with one session; export contains the new keys
- [ ] T004 Create `supabase/migrations/0016_today_content.sql` per data-model.md: column `plans.desired_state` (+ self-update grant); tables `reflections` (`reflections.text`, `reflections.local_date`, `reflections.desired_state_snapshot`, `reflections.client_mutation_id`), `activity_sessions` (`activity_sessions.starts_at`, `activity_sessions.ends_at`), `activity_links` (`activity_links.meeting_url`), `activity_registrations` (`activity_registrations.cancelled_at`), `activity_card_dismissals` (`activity_card_dismissals.dismissed_on`); enum `activity_mode` and columns `activities.registration_open`, `activities.capacity`, `activities.mode`; trigger keeping `activities.starts_at`/`ends_at` equal to first/last session; back-fill one session per existing activity; RLS and grants as data-model.md
- [ ] T005 In the same migration, SQL functions from data-model.md › SQL functions: `add_reflection`, `my_reflections`, `register_for_activity` (row lock, research §7), `cancel_activity_registration`, `activity_details`, `activity_registrations`, `dismiss_activity_card`; `save_activity` extended with sessions and registration settings; `get_today` + `registered_activities` (research §9); `export_my_data` + `desired_state`, `reflections`, `activity_registrations`
- [ ] T006 Run `npm run db:test:local` until T003 passes (seeded and no-seed); regenerate `src/lib/supabase/database.types.ts` with `npm run gen:types:local`
- [ ] T007 [P] Capacity check under parallel sessions in `scripts/db-concurrency-check.sh`: 25 concurrent `register_for_activity` calls for 2 places → exactly 2 active registrations (SC-004)

**Checkpoint**: data layer complete and tested; stories can start.

---

## Phase 3: User Story 1 — Desired state and «وقفة تأمل» (Priority: P1) 🎯 MVP

**Goal**: «حالي المنشود» written in «خطتي», shown on «يومك», with private quick reflections (offline-capable)
and a history that also lists «ختام اليوم» reflections.

**Independent Test**: write a desired state, see it on «يومك», save a reflection (also offline), find it
in the history, and confirm a facilitator cannot see it.

### Tests for User Story 1

- [ ] T008 [P] [US1] Unit tests for the reflection schema (trim, 1–500 per data-model.md `reflections.text`) and the outbox `reflection` kind replay in `tests/unit/reflections.test.ts`
- [ ] T009 [P] [US1] e2e in `tests/e2e/us-desired-state.spec.ts`: write desired state → «يومك» card → save reflection → status message → history shows it labelled «وقفة تأمل» next to a «ختام اليوم» entry → delete it; empty state for a member without a desired state; offline save is replayed once; facilitator sees nothing; axe on `/plan` and `/plan/reflections`

### Implementation for User Story 1

- [ ] T010 [P] [US1] Zod schemas for desired state (data-model.md `plans.desired_state`) and reflections (data-model.md `reflections.text`, `reflections.local_date`, `reflections.client_mutation_id`) in `src/lib/validation/reflections.ts`
- [ ] T011 [US1] `saveDesiredState` in `src/server/actions/plan.ts`; `saveReflection` and `deleteReflection` in `src/server/actions/reflections.ts` (contracts/server-actions.md)
- [ ] T012 [US1] Add `kind: "reflection"` to `src/lib/offline/outbox.ts` and its replay in `src/components/features/today/useOutbox.ts`
- [ ] T013 [P] [US1] `src/components/features/plan/DesiredStateForm.tsx` and the «حالي المنشود» section above «واقعي الآن» in `src/app/(member)/plan/page.tsx`, with a link to the history
- [ ] T014 [US1] `src/components/features/today/DesiredStateCard.tsx`: `.gl-surface` card with the text (first lines + «اقرأ المزيد»), arrow to `/plan#desired-state`, empty-state invitation, and the «وقفة تأمل» form through the outbox; rendered near the top of `src/app/(member)/page.tsx` from `plans.desired_state`
- [ ] T015 [US1] Reflection history route `src/app/(member)/plan/reflections/page.tsx` using `my_reflections` (30 days per page, newest first, kind labels, delete for «وقفة تأمل»)

**Checkpoint**: US1 is usable on its own in all three visual versions.

---

## Phase 4: User Story 2 — Activity registration (Priority: P2)

**Goal**: organizers open registration on multi-session activities; members register or cancel until the
last session starts; «يومك» shows a closable card; organizers see registrations within their scope.

**Independent Test**: quickstart.md scenarios 4–5 (capacity 2, three members, cancel frees a place,
link only after registering, facilitator scope).

### Tests for User Story 2

- [ ] T016 [P] [US2] Unit tests for the card visibility rule (research §9: dismissed today, next session day, cancelled-today) and session validation in `tests/unit/activity-card.test.ts`
- [ ] T017 [P] [US2] e2e in `tests/e2e/us-activity-registration.spec.ts`: member registers from upcoming activities → link shown → «يومك» card «نشاط سجّلت فيه · أونلاين» → close hides it; second member fills capacity; third sees «مكتمل العدد»; cancel frees a place; admin list shows 2; facilitator sees only own members; cancelled activity shows as cancelled; axe on `/activities/[id]` and `/admin/activities/[id]`

### Implementation for User Story 2

- [ ] T018 [P] [US2] Zod schemas for activity settings and sessions (data-model.md `activities.registration_open`, `activities.capacity`, `activities.mode`, `activity_sessions.starts_at`, `activity_sessions.ends_at`, `activity_links.meeting_url`) in `src/lib/validation/activities.ts`; extend the existing activity schema in `src/lib/validation/admin.ts`
- [ ] T019 [US2] Extend the admin/facilitator activity form `src/components/features/admin/ActivityForm.tsx` and its action (`saveActivity` in `src/server/actions/admin/*`): sessions editor (add/remove, 1–52), registration toggle, capacity, mode, meeting link; `ActivityList.tsx` shows registered count
- [ ] T020 [US2] `registerForActivity`, `cancelRegistration`, `dismissActivityCard` in `src/server/actions/activities.ts` (contracts/server-actions.md, errors mapped to Arabic messages)
- [ ] T021 [US2] Activity details route `src/app/(member)/activities/[id]/page.tsx` via `activity_details` (sessions with past ones marked, place or link, places left) with `src/components/features/activities/RegistrationButton.tsx`; upcoming-activity items on «يومك» (`src/ui/components/ActivitiesCard.tsx`) link to it
- [ ] T022 [US2] `src/components/features/today/RegisteredActivityCard.tsx` (closable, cancelled state) and `registered_activities` in `src/server/queries/today.ts`; render under the «حالي المنشود» card in `src/app/(member)/page.tsx`
- [ ] T023 [P] [US2] Admin registrations route `src/app/admin/activities/[id]/page.tsx` via `activity_registrations` (solid surfaces, FR-007 of spec 002)
- [ ] T024 [P] [US2] Facilitator view: in `src/app/(member)/groups/[id]/page.tsx`, the group's activities with which of its members registered (via `activity_registrations`)

**Checkpoint**: US1 and US2 work independently.

---

## Phase 5: User Story 3 — «اجعلها عادة» (Priority: P3)

**Goal**: turn today's journey or own challenge into a habit through the prefilled add-habit form.

**Independent Test**: tap «اجعلها عادة» on today's journey challenge, save, find the habit on «يومك» and in
«خطتي»; the challenge's done state is unchanged.

### Tests for User Story 3

- [ ] T025 [P] [US3] Unit tests for shortening challenge text to the habit-name limit at a word boundary and for the duplicate-name check in `tests/unit/make-habit.test.ts`
- [ ] T026 [P] [US3] e2e in `tests/e2e/us-make-habit.spec.ts`: journey and own challenge → prefilled form with «من تحدّي اليوم» → save → habit on «يومك» and «خطتي»; duplicate warning; cancel creates nothing

### Implementation for User Story 3

- [ ] T027 [P] [US3] Helper `src/lib/make-habit.ts` (shorten to 80 at a word boundary; normalise for duplicate check)
- [ ] T028 [US3] `src/app/(member)/habits/new/page.tsx` reads `?from=journey|own`, loads today's challenge server-side, passes the default name, note and duplicate warning to `src/components/features/today/NewHabitForm.tsx`
- [ ] T029 [US3] «اجعلها عادة» link next to «أنجزت التحدّي» for each present challenge in `src/components/features/today/ChallengeCards.tsx`

**Checkpoint**: all three stories work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T030 [P] Add `/plan/reflections`, `/activities/<seed id>`, `/admin/activities/<seed id>` to `tests/e2e/a11y-all-routes.spec.ts` and `tests/e2e/screenshots.spec.ts`
- [ ] T031 [P] Contrast check of the new cards in the glass versions in `tests/e2e/ui-contrast.spec.ts`
- [ ] T032 Account export UI check: export JSON contains desired state, reflections and registrations (extend `tests/e2e/us8-account.spec.ts`)
- [ ] T033 Run quickstart.md checks (lint, typecheck, unit, DB, concurrency script, build + bundle budget); record results in `specs/003-today-content/checklists/quickstart-run.md`; screenshot the new cards in the three versions

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (T001–T002) → Foundational (T003–T007) → US1, US2, US3 (any order) → Polish.
- T003 is written before T004–T005 and must pass at T006.

### User Story Dependencies

- **US1**: needs Phase 2 only.
- **US2**: needs Phase 2 only. T022 and T014 both edit `src/app/(member)/page.tsx`; do them in sequence.
- **US3**: needs Phase 2 only (no new data; uses the existing habit creation).

### Within Each User Story

- Tests first (they fail), then schemas → actions → components → routes.

### Parallel Opportunities

- T002 with T001; T007 with T006.
- Within US1: T008, T009, T010, T013. Within US2: T016, T017, T018, T023, T024. Within US3: T025–T027.
- After Phase 2, the three stories can proceed in parallel apart from the shared «يومك» page file.

## Parallel Example: User Story 2

```text
Task: "Unit tests for the card visibility rule in tests/unit/activity-card.test.ts"        (T016)
Task: "e2e registration flow in tests/e2e/us-activity-registration.spec.ts"                (T017)
Task: "Zod schemas for activity settings in src/lib/validation/activities.ts"              (T018)
Task: "Admin registrations route in src/app/admin/activities/[id]/page.tsx"                (T023)
Task: "Facilitator registrations on src/app/(member)/groups/[id]/page.tsx"                 (T024)
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phases 1–2 (data and tests).
2. Phase 3 (US1) → validate quickstart scenarios 1–3 → shippable.

### Incremental Delivery

1. US1 → desired state and reflections.
2. US2 → registration (needs organizers to create registration-open activities).
3. US3 → «اجعلها عادة».
4. Polish → a11y, screenshots, export check, quickstart run.

## Notes

- [P] = different files, no dependencies on unfinished tasks.
- Commit after each phase; keep `npm run check:bundle` green (new «يومك» cards are server-rendered).
