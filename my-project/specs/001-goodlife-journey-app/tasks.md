---

description: "Task list for the الحياة الطيبة (The Good Life) journey app"
---

# Tasks: الحياة الطيبة (The Good Life) Journey App

**Input**: Design documents from `/specs/001-goodlife-journey-app/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. The constitution (v1.2.0, principle III and "Workflow and quality gates")
requires an automated test for every permission rule, tests of the core journey logic, automated
accessibility checks, and e2e validation before merge. Within each story, write the tests first
and confirm they fail.

**Organization**: Tasks are grouped by user story so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US8 from spec.md
- All paths are relative to `my-project/` (the Next.js project root, per plan.md), except the CI
  workflow, which lives at the git root.
- Field constraints are canonical in `data-model.md`; tasks cite them as `Entity.field`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and tooling

- [X] T001 Scaffold a Next.js 16 App Router project with TypeScript strict mode and `src/` directory in `my-project/` (`package.json`, `tsconfig.json`, `next.config.ts`), keeping the existing `.specify/`, `.claude/`, and `specs/` folders untouched
- [X] T002 Add dependencies from plan.md Technical Context to `package.json`: `@supabase/supabase-js`, `@supabase/ssr`, `next-intl`, `tailwindcss@4`, `@serwist/next`, `serwist`, `idb`, `zod`; dev: `supabase`, `vitest`, `@playwright/test`, `@axe-core/playwright`, `eslint`, `prettier`
- [X] T003 [P] Configure ESLint + Prettier in `eslint.config.mjs` and `.prettierrc`, including a rule that forbids physical-direction Tailwind classes (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right`, `rounded-l*`, `rounded-r*`) per constitution I
- [X] T004 [P] Set up Tailwind CSS 4 with color, spacing, and type tokens (calm palette, AA contrast) in `src/app/globals.css`
- [X] T005 [P] Configure Vitest in `vitest.config.ts` with tests under `tests/unit/`
- [X] T006 [P] Configure Playwright in `playwright.config.ts` (mobile project "Pixel 7", locale `ar`, trace off) and an axe helper `checkA11y(page)` asserting WCAG 2.1 AA in `tests/e2e/helpers/axe.ts`
- [X] T007 Initialize Supabase in `supabase/config.toml`: email OTP sign-in enabled (6-digit code, no magic link), signups disabled except through invitation redemption, Inbucket enabled, private storage bucket `resources`
- [X] T008 [P] Create `.env.example` and a Zod-validated env loader in `src/lib/env.ts` (Supabase URL, anon key, service role key server-only, site URL)
- [X] T009 [P] Add npm scripts in `package.json`: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `db:reset`, `db:test` (`supabase test db`), `gen:types`
- [X] T010 [P] Add CI workflow at the git root `.github/workflows/ci.yml` with `working-directory: my-project`, running lint, typecheck, unit tests, `supabase test db`, and Playwright e2e
- [x] T011 Record the stack and offline decisions from research.md §1–4 and §7–9 in `.specify/memory/constitution.md` (resolves TODO(TECH_STACK) and TODO(OFFLINE_SCOPE); also adopts the forward-fix migration policy; version 1.2.0). Done 2026-11-21 during `/speckit-analyze` remediation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Identity, program structure, auth, i18n, shell, and PWA base that every story needs

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for the foundation

- [X] T012 [P] pgTAP allow/deny tests for `users`, `user_roles`, `cohorts`, `groups`, `group_memberships`, `journey_stages` for member, facilitator, admin, and anonymous in `supabase/tests/rls_foundation.test.sql`
- [X] T013 [P] Unit tests for local date in a time zone, journey day (incl. late joiner and day 365 end), and greeting key boundaries (12:00, 17:00) in `tests/unit/journey.test.ts`
- [X] T014 [P] Unit tests for Arabic Gregorian + Hijri (umalqura) date formatting and Arabic-Indic digit formatting in `tests/unit/format.test.ts`

### Implementation

- [X] T015 Create `supabase/migrations/0001_foundation.sql`: enums `app_role` and `membership_role` (data-model.md `user_roles.role`, `group_memberships.role`), `set_updated_at()` trigger function, and helpers `has_role(role)`, `is_group_member(group_id)`, `is_group_facilitator(group_id)`, `user_local_date(user_id)` (uses `users.time_zone`)
- [X] T016 Create `supabase/migrations/0002_identity.sql`: tables `users` and `user_roles` with constraints per data-model.md `users.id` (= `auth.users.id`, row created only by `redeem_invitation`), `users.full_name`, `users.email`, `users.phone`, `users.gender`, `users.city`, `users.time_zone`, `users.notification_prefs`, `users.active_role` (must be a role in `user_roles`), `users.deletion_requested_at`, `user_roles.user_id`, `user_roles.role` (unique per user), plus RLS policies from data-model.md
- [X] T017 Create `supabase/migrations/0003_structure.sql`: tables `cohorts`, `groups`, `group_memberships`, `journey_stages` with constraints per data-model.md `cohorts.name`, `cohorts.start_date`, `cohorts.end_date` (generated), `groups.cohort_id`, `groups.name` (unique within cohort), `group_memberships.group_id`, `group_memberships.user_id`, `group_memberships.role`, `group_memberships.started_on`, `group_memberships.ended_on` (partial unique index: one active member membership per user), `journey_stages.from_day`, `journey_stages.to_day` (1..365, non-overlapping), plus RLS
- [X] T018 Add SQL function `journey_day(user_id, local_date)` to `supabase/migrations/0003_structure.sql` (cohort of the active member membership; `local_date − start_date + 1`, capped 1..365)
- [X] T019 [P] Write base seed in `supabase/seed.sql`: cohort «الدفعة التجريبية» starting 11 days before seed date, groups «مجموعة النور» and «مجموعة الأمل», admin, facilitator, and two members as in quickstart.md
- [X] T020 [P] Create Supabase clients in `src/lib/supabase/server.ts` (user-scoped, cookies via `@supabase/ssr`), `src/lib/supabase/browser.ts`, and `src/lib/supabase/admin.ts` (service-role client, `import 'server-only'`, used only by `completeJoin` and admin storage uploads); generate `src/lib/supabase/database.types.ts` with `npm run gen:types`
- [X] T021 Add session refresh and auth redirect in `src/proxy.ts` (Next.js 16 renamed Middleware to Proxy) (public: `/join`, `/join/profile`, `/sign-in`; everything else → `/sign-in` when signed out)
- [X] T022 Implement `getCurrentUser()`, `requireRole(role)`, `requireGroupFacilitator(groupId)` in `src/server/auth.ts`; failures call `notFound()` per contracts/routes.md
- [X] T023 [P] Implement the `Result<T>` type and `ErrorCode` union from contracts/server-actions.md in `src/server/actions/result.ts`
- [X] T024 [P] Configure next-intl with a single `ar` locale in `src/i18n/request.ts` and create `messages/ar.json` with `common`, `nav`, and `errors` (one entry per `ErrorCode`) namespaces
- [X] T025 [P] Implement `src/lib/journey.ts` (`localDate(tz)`, `journeyDay(startDate, localDate)`, `greetingKey(hour)`) to pass T013
- [X] T026 [P] Implement `src/lib/format.ts` (`formatDate`, `formatHijri`, `formatNumber`, `formatFraction` with an Arabic-Indic/Latin digits switch defaulting to Arabic-Indic) to pass T014
- [X] T027 Create root layout `src/app/layout.tsx`: `<html lang="ar" dir="rtl">`, IBM Plex Sans Arabic via `next/font`, `NextIntlClientProvider`, skip-to-content link
- [X] T028 [P] Build accessible RTL UI primitives in `src/components/ui/` (`Button.tsx`, `Card.tsx`, `Sheet.tsx`, `Field.tsx`, `EmptyState.tsx`, `Toast.tsx`), with 44×44 px touch targets and Arabic screen-reader labels
- [X] T029 Build `src/components/ui/BottomNav.tsx` and member shell `src/app/(member)/layout.tsx` with the five tabs from contracts/routes.md (يومك، خطتي، الإحصاءات، المجتمع، المزيد), `aria-current` on the active tab
- [X] T030 [P] Create Arabic "not available" page in `src/app/not-found.tsx`
- [X] T031 [P] Create a logger that drops personal fields (names, emails, free text) in `src/lib/log.ts`
- [X] T032 Add PWA base: `src/app/manifest.ts` (fields from contracts/routes.md PWA section), icons in `public/icons/` (192, 512, maskable), Serwist service worker `src/app/sw.ts` precaching the app shell, `withSerwist` in `next.config.ts`

**Checkpoint**: Foundation ready; user stories can start.

---

## Phase 3: User Story 1 - Join the journey and live the day on «يومك» (Priority: P1) 🎯 MVP

**Goal**: A person joins with a code and lives a full day: intention, habits, journey and own challenges, upcoming activities, close-out; check-offs work offline.

**Independent Test**: With the seed cohort, group, code `TAYBAH26`, and journey challenges for days 1–30, run quickstart.md scenarios 1 and 2.

### Tests for User Story 1 ⚠️

- [X] T033 [P] [US1] pgTAP tests in `supabase/tests/rls_daily.test.sql`: `plans`, `habits`, `habit_completions`, `day_entries`, `own_challenges`, `challenge_completions` are self-only (facilitator, other members, and admin-as-member denied); `journey_challenges` readable only up to the caller's journey day; the date rules from data-model.md "Journey scoping and date rules" (online today/yesterday; offline `recorded_at` accepted within 7 days and refused at 8; refused before the cohort's `start_date` and after its `end_date`); a member in two cohorts sees only the current cohort's habits and entries, and writes to a past cohort are refused
- [X] T034 [P] [US1] pgTAP tests for `redeem_invitation(code, auth_user_id, profile)`: valid (creates profile, member role, membership, empty plan), expired, revoked, used up, and two concurrent redemptions of a 1-use code, in `supabase/tests/redeem_invitation.test.sql`; plus a Vitest test that `completeJoin` deletes the auth user when redemption fails, in `tests/unit/complete-join.test.ts`
- [X] T035 [P] [US1] Playwright e2e for quickstart scenario 1 (join → welcome → «يومك» "اليوم ١٢" → habits ٢/٣ → intention → journey + own challenge with distinct labels → switch to «أمس», check a habit, and confirm yesterday's progress changes while today's does not → close day) with `checkA11y` on each screen, in `tests/e2e/us1-join-today.spec.ts`
- [X] T036 [P] [US1] Playwright e2e for quickstart scenario 2 in `tests/e2e/us1-offline.spec.ts`: offline check-off saved once on reconnect; a queued entry with `recordedAt` 2 days old is saved for its tap day; one 8 days old is dropped with «لم نتمكن من حفظ هذا التسجيل»

### Implementation for User Story 1

- [X] T037 [US1] Create `supabase/migrations/0004_invitations.sql`: `invitation_codes` per data-model.md `invitation_codes.code`, `invitation_codes.cohort_id`, `invitation_codes.group_id` (must belong to cohort), `invitation_codes.expires_at`, `invitation_codes.max_uses`, `invitation_codes.uses`, `invitation_codes.revoked_at`, `invitation_codes.created_by`; admin-only RLS; security-definer `redeem_invitation(code, auth_user_id, profile)` that locks the code row, validates, increments `uses`, and creates the `users` row for the existing auth user, the `member` role, the active membership, and an empty `plans` row for the cohort (depends on T038 for `plans`)
- [X] T038 [P] [US1] Create `supabase/migrations/0005_daily.sql`: `plans` per data-model.md `plans.user_id`, `plans.cohort_id` (unique per user), `plans.current_state`; `habits` per `habits.plan_id`, `habits.name`, `habits.description`, `habits.sort_order`, `habits.archived_at` (`habits.focus_area_id` is added in T076); `habit_completions` per `habit_completions.habit_id`, `habit_completions.user_id`, `habit_completions.local_date`, `habit_completions.recorded_at`, `habit_completions.client_mutation_id` (unique), unique (habit_id, local_date); `day_entries` per `day_entries.user_id`, `day_entries.cohort_id`, `day_entries.local_date`, `day_entries.intention`, `day_entries.reflection`, `day_entries.closed_at`, `day_entries.closing_message_id`; `closing_messages` per `closing_messages.text`, `closing_messages.active`; self-only RLS; a shared trigger function `enforce_journey_dates()` implementing data-model.md "Journey scoping and date rules" (current cohort only, journey window, today/yesterday online, 7-day `recorded_at` replay) applied to `habit_completions` and `day_entries`
- [X] T039 [P] [US1] Create `supabase/migrations/0006_challenges.sql`: `journey_challenges` per data-model.md `journey_challenges.journey_day` (1..365, unique), `journey_challenges.text`; `own_challenges` per `own_challenges.user_id`, `own_challenges.cohort_id`, `own_challenges.local_date`, `own_challenges.text` (editable only when `local_date` is today); `challenge_completions` per `challenge_completions.user_id`, `challenge_completions.cohort_id`, `challenge_completions.local_date`, `challenge_completions.recorded_at`, `challenge_completions.kind`, `challenge_completions.journey_challenge_id`, `challenge_completions.own_challenge_id` (check: matches `kind`), `challenge_completions.client_mutation_id` (unique); RLS per data-model.md; apply `enforce_journey_dates()` from T038 to `own_challenges` and `challenge_completions`
- [X] T040 [P] [US1] Create `supabase/migrations/0007_activities.sql`: `activities` per data-model.md `activities.title`, `activities.description`, `activities.starts_at`, `activities.ends_at` (> starts_at), `activities.location`, `activities.created_by`, `activities.cancelled_at`; `activity_audiences` per `activity_audiences.cohort_id` / `activity_audiences.group_id` (exactly one set); read RLS for members/facilitators of the audience, admin all
- [X] T041 [US1] Extend `supabase/seed.sql`: invitation code `TAYBAH26`, journey challenges for days 1–30, 6 closing messages including «ما نويته اليوم تمّ. وغدًا يبدأ من حيث توقفت.», one cohort-wide activity in 3 days; then regenerate types (`npm run gen:types`)
- [X] T042 [P] [US1] Zod schemas in `src/lib/validation/onboarding.ts` (data-model.md `users.full_name`, `users.email`, `users.phone`, `users.gender`, `users.city`, `users.time_zone`, `invitation_codes.code`) and `src/lib/validation/today.ts` (`day_entries.intention`, `day_entries.reflection`, `own_challenges.text`, `habits.name`, `habits.description`, `habit_completions.local_date`, `habit_completions.client_mutation_id`, `challenge_completions.kind`)
- [X] T043 [US1] Implement `checkInvitation`, `completeJoin` (the five steps in contracts/server-actions.md: re-check code → create auth user with `src/lib/supabase/admin.ts` → `redeem_invitation` → delete the auth user if redemption fails → send the one-time code), `requestSignInCode` (no account enumeration), `verifySignInCode` in `src/server/actions/onboarding.ts`
- [X] T044 [US1] Build join flow screens `src/app/(auth)/join/page.tsx` (code), `src/app/(auth)/join/profile/page.tsx` (personal data, time zone auto-detected), `src/app/(auth)/welcome/page.tsx`
- [X] T045 [US1] Build sign-in screen (email → 6-digit code) in `src/app/(auth)/sign-in/page.tsx`
- [X] T046 [US1] Implement `getToday(day: 'today' | 'yesterday')` read model for the current cohort (greeting key, Gregorian + Hijri date, journey day, active habits of the current plan with that day's state, journey challenge, own challenge, upcoming 7-day non-cancelled activities, day entry state, and a `journeyEnded` flag after the cohort's `end_date`) in `src/server/queries/today.ts`
- [X] T047 [US1] Implement `setHabitDone`, `setIntention`, `setOwnChallenge`, `setChallengeDone`, `closeDay` in `src/server/actions/today.ts`: idempotent on `client_mutation_id`, accept optional `recordedAt`, write to the current cohort, return `date_not_editable` when data-model.md "Journey scoping and date rules" refuse the date, closing message picked from active `closing_messages`
- [X] T048 [US1] Implement `createHabit` in `src/server/actions/habits.ts` and the create-habit screen `src/app/(member)/habits/new/page.tsx` (name, description)
- [X] T049 [P] [US1] Build Today components in `src/components/features/today/`: `Greeting.tsx`, `HabitList.tsx` (optimistic check/uncheck, progress like ٢/٦, a quiet «اليوم / أمس» switch that shows yesterday's habits for late logging with no challenges or intention), `ChallengeCards.tsx` (journey «تحدّي الرحلة» and own «تحدّي ذاتي» with distinct label, icon, and style; journey card hidden when none; add/edit/remove own challenge), `UpcomingActivities.tsx`, `EmptyHabits.tsx`, `JourneyEnded.tsx` (calm closing state with links to stats and reviews, shown when `journeyEnded`)
- [X] T050 [US1] Build «يومك» page `src/app/(member)/page.tsx` composing T049 components from `getToday()`
- [X] T051 [P] [US1] Build «ابدأ يومي» sheet in `src/app/(member)/day/start/page.tsx`
- [X] T052 [P] [US1] Build «ختام اليوم» screen (intention, habits done/total, status of each challenge, optional reflection, closing message) in `src/app/(member)/day/close/page.tsx`
- [X] T053 [US1] Add midnight rollover in the user's time zone with `src/components/features/today/useDayRollover.ts` used by the Today page
- [X] T054 [US1] Implement the IndexedDB outbox (`enqueue` with `clientMutationId` and `recordedAt`, ordered `replay` on `online`, pending state per item, drop and notify with «لم نتمكن من حفظ هذا التسجيل» on `date_not_editable`) in `src/lib/offline/outbox.ts`; use it in `HabitList.tsx` and `ChallengeCards.tsx`; add runtime caching of `/` and its data in `src/app/sw.ts`
- [X] T055 [US1] Add all US1 Arabic strings (join, sign-in, welcome, today, start day, close day, offline pending) to `messages/ar.json`

**Checkpoint**: MVP: a member can join and live the daily loop end to end.

---

## Phase 4: User Story 2 - Admin sets up the program (Priority: P1)

**Goal**: Admins create cohorts and groups, assign facilitators, issue and revoke codes, move members, schedule activities, and write journey challenges and closing messages.

**Independent Test**: quickstart.md scenario 3.

### Tests for User Story 2 ⚠️

- [X] T056 [P] [US2] pgTAP tests: admin writes on cohorts, groups, memberships, invitations, journey challenges, closing messages, and roles are denied for member and facilitator; a facilitator removed from a group immediately loses read access to it; `move_member` keeps the member's personal rows unchanged, in `supabase/tests/rls_admin.test.sql`
- [X] T057 [P] [US2] pgTAP tests for activity permissions (constitution III): a facilitator can create, edit, and cancel an activity whose audience is only groups they lead; is refused for another group, for a cohort-wide audience, and for editing an activity they did not create; a member is refused all writes; admin can do all, in `supabase/tests/rls_activities.test.sql`
- [X] T058 [P] [US2] Playwright e2e for quickstart scenario 3 with `checkA11y` in `tests/e2e/us2-admin-setup.spec.ts`

### Implementation for User Story 2

- [X] T059 [US2] Create `supabase/migrations/0008_admin.sql`: admin write policies on structure, invitation, and content tables; for `activities` and `activity_audiences`: admin may write any row, a facilitator may insert/update/cancel only rows they created whose every audience row is a group they lead (cohort-wide audiences are admin-only); `move_member(user_id, group_id)` (sets `group_memberships.ended_on`, inserts a new row with `group_memberships.started_on`, same cohort only); `assign_facilitator` / `remove_facilitator` maintaining `user_roles.role` = `facilitator`; guard against revoking the last admin
- [X] T060 [P] [US2] Zod schemas in `src/lib/validation/admin.ts` citing data-model.md `cohorts.name`, `cohorts.start_date`, `groups.name`, `invitation_codes.max_uses`, `invitation_codes.expires_at`, `activities.title`, `activities.description`, `activities.starts_at`, `activities.ends_at`, `activities.location`, `activity_audiences.cohort_id`, `activity_audiences.group_id`, `journey_challenges.journey_day`, `journey_challenges.text`, `closing_messages.text`
- [X] T061 [P] [US2] Implement an unambiguous-alphabet 8-character code generator in `src/lib/codes.ts` (data-model.md `invitation_codes.code`) with a unit test in `tests/unit/codes.test.ts`
- [X] T062 [US2] Implement `upsertCohort`, `upsertGroup`, `assignFacilitator`, `removeFacilitator`, `addMember`, `moveMember`, `grantAdmin`, `revokeAdmin` in `src/server/actions/admin/structure.ts`
- [X] T063 [US2] Implement `createInvitations` and `revokeInvitation` in `src/server/actions/admin/invitations.ts`
- [X] T064 [US2] Implement `createActivity`, `updateActivity`, `cancelActivity` in `src/server/actions/activities.ts` (admin: any audience; facilitator: own groups only, used by US6)
- [X] T065 [US2] Implement `upsertJourneyChallenge` and `upsertClosingMessage` in `src/server/actions/admin/content.ts`
- [X] T066 [US2] Build admin layout and home (`requireRole('admin')`, counts of cohorts, groups, members) in `src/app/admin/layout.tsx` and `src/app/admin/page.tsx`
- [X] T067 [US2] Build cohorts list and cohort detail (groups, facilitators, members, add/move member) in `src/app/admin/cohorts/page.tsx` and `src/app/admin/cohorts/[id]/page.tsx`
- [X] T068 [P] [US2] Build invitations screen (generate, copy, revoke, uses) in `src/app/admin/invitations/page.tsx`
- [X] T069 [P] [US2] Build activities screen (schedule for groups or cohort, edit, cancel) in `src/app/admin/activities/page.tsx`
- [X] T070 [US2] Build content screen with tabs for journey challenges (by day 1–365) and closing messages in `src/app/admin/content/page.tsx`
- [X] T071 [US2] Add US2 Arabic strings to `messages/ar.json`

**Checkpoint**: The program can be set up and run without manual tracking; US1 works on real data.

---

## Phase 5: User Story 3 - Build my plan and shape my habits (Priority: P2)

**Goal**: «خطتي» with current state and focus areas; habits linked to areas, edited, reordered, archived, and restored.

**Independent Test**: quickstart.md scenario 4.

### Tests for User Story 3 ⚠️

- [X] T072 [P] [US3] pgTAP tests: `plans` and `focus_areas` self-only (facilitator denied); a habit cannot link to another user's focus area; deleting a focus area unlinks habits, in `supabase/tests/rls_plan.test.sql`
- [X] T073 [P] [US3] Playwright e2e for quickstart scenario 4 in `tests/e2e/us3-plan-habits.spec.ts`

### Implementation for User Story 3

- [X] T074 [US3] Create `supabase/migrations/0009_plan.sql`: `focus_areas` per data-model.md `focus_areas.plan_id`, `focus_areas.title`, `focus_areas.description`, `focus_areas.sort_order`; self-only RLS (`plans` already exists from T038)
- [X] T075 [P] [US3] Zod schemas in `src/lib/validation/plan.ts` citing data-model.md `plans.current_state`, `focus_areas.title`, `focus_areas.description`, `habits.focus_area_id`, `habits.sort_order`
- [X] T076 [US3] In `supabase/migrations/0009_plan.sql` add `habits.focus_area_id` per data-model.md `habits.focus_area_id` (FK `on delete set null`, trigger ensuring the area belongs to the habit's plan)
- [X] T077 [US3] Implement `saveCurrentState`, `createFocusArea`, `updateFocusArea`, `deleteFocusArea`, `reorderFocusAreas` in `src/server/actions/plan.ts`
- [X] T078 [US3] Add `updateHabit`, `reorderHabits`, `archiveHabit`, `restoreHabit` to `src/server/actions/habits.ts`, scoped to the current plan (data-model.md `habits.plan_id`, `habits.archived_at`, `habits.sort_order`)
- [X] T079 [P] [US3] Build plan components in `src/components/features/plan/` (`CurrentState.tsx`, `FocusAreaList.tsx`, `HabitsByArea.tsx`, `LastUpdated.tsx`)
- [X] T080 [US3] Build «خطتي» page with guided empty state in `src/app/(member)/plan/page.tsx`
- [X] T081 [P] [US3] Build an accessible reorder list (move up/down buttons, not drag-only) in `src/components/features/habits/ReorderList.tsx` used by the plan page and focus areas
- [X] T082 [US3] Build habit edit screen (name, description, focus area picker, archive) in `src/app/(member)/habits/[id]/page.tsx`; add the focus area picker to `src/app/(member)/habits/new/page.tsx`
- [X] T083 [P] [US3] Build archived habits screen with restore in `src/app/(member)/account/archived-habits/page.tsx`
- [X] T084 [US3] Implement `copyHabitsFromPreviousPlan` in `src/server/actions/plan.ts` (copies name, description, and order of the previous plan's active habits into the current plan per data-model.md "Journey scoping and date rules" → New journey) and an offer card «ابدأ بعاداتك من الرحلة السابقة» on the empty «خطتي» page in `src/components/features/plan/CopyPreviousHabits.tsx`
- [X] T085 [US3] Add US3 Arabic strings to `messages/ar.json`

**Checkpoint**: Habits have direction; US1 Today reflects order and archive state.

---

## Phase 6: User Story 4 - Monthly review «وقفة مع ما مضى» (Priority: P2)

**Goal**: A monthly review prompt, figures for the month, reflection answers, and past reviews.

**Independent Test**: quickstart.md scenario 5.

### Tests for User Story 4 ⚠️

- [X] T086 [P] [US4] pgTAP tests for `month_figures(month)` (per-habit rate, journey/own challenge counts, days closed, archived-habit cut-off) and self-only RLS on `monthly_reviews`, in `supabase/tests/month_figures.test.sql`
- [X] T087 [P] [US4] Unit tests for the review window (opens on the 3rd-last day, closes after day 7 of next month; 28/29/30/31-day months) in `tests/unit/review-window.test.ts`
- [X] T088 [P] [US4] Playwright e2e for quickstart scenario 5 in `tests/e2e/us4-monthly-review.spec.ts`

### Implementation for User Story 4

- [X] T089 [US4] Create `supabase/migrations/0010_reviews.sql`: `review_questions` per data-model.md `review_questions.text`, `review_questions.sort_order`, `review_questions.active`; `monthly_reviews` per `monthly_reviews.user_id`, `monthly_reviews.cohort_id`, `monthly_reviews.month` (first of month, unique per user and cohort), `monthly_reviews.answers`, `monthly_reviews.figures_snapshot`, `monthly_reviews.status`, `monthly_reviews.completed_at`; self-only RLS; shared view `daily_activity` (per user, cohort, and date: habits done, challenges done by kind, closed) and function `month_figures(month)` for the current cohort
- [X] T090 [P] [US4] Implement `isReviewPromptOpen(localDate)` and `reviewMonthFor(localDate)` in `src/lib/review-window.ts` to pass T087
- [X] T091 [P] [US4] Zod schemas in `src/lib/validation/review.ts` citing data-model.md `monthly_reviews.month`, `monthly_reviews.answers`, `monthly_reviews.status`, `review_questions.text`
- [X] T092 [US4] Implement `saveReviewDraft` and `completeReview` (copies question text, stores `month_figures` snapshot) in `src/server/actions/reviews.ts`
- [X] T093 [US4] Add the review prompt to `getToday()` in `src/server/queries/today.ts` and a gentle `ReviewPrompt.tsx` card in `src/components/features/today/`
- [X] T094 [US4] Build past reviews list (done / not yet done) and review screen (figures, then questions; read-only when completed) in `src/app/(member)/reviews/page.tsx` and `src/app/(member)/reviews/[month]/page.tsx`
- [X] T095 [US4] Add a review questions tab and `upsertReviewQuestion` to `src/app/admin/content/page.tsx` and `src/server/actions/admin/content.ts`; seed default questions in `supabase/seed.sql`
- [X] T096 [US4] Add US4 Arabic strings to `messages/ar.json`

**Checkpoint**: The monthly rhythm works on top of the daily data.

---

## Phase 7: User Story 5 - See my progress in «الإحصاءات» (Priority: P2)

**Goal**: Member stats by period; facilitator group aggregates with no access to private content.

**Independent Test**: quickstart.md scenarios 6 and 7.

### Tests for User Story 5 ⚠️

- [X] T097 [P] [US5] pgTAP tests for `member_stats`, `group_stats`, `group_member_signals` against fixtures in `supabase/tests/fixtures/stats_expected.json` (20/30 days → 67%, current streak 5, longest streak, archived habits, journey vs own challenge counts), plus denial for non-facilitators and other groups' facilitators, in `supabase/tests/stats.test.sql`
- [X] T098 [P] [US5] Playwright e2e for quickstart scenarios 6 and 7 in `tests/e2e/us5-stats.spec.ts`

### Implementation for User Story 5

- [X] T099 [US5] Create `supabase/migrations/0011_stats.sql`: security-definer functions `member_stats(from, to)` (self, current cohort, dates clamped to the member's join date and the journey window), `group_stats(group_id, from, to)` and `group_member_signals(group_id, from, to)` (facilitator of group or admin; each member counted only for dates inside their membership in that group; signals limited to last_active, days_closed, completion_rate) built on `daily_activity`
- [X] T100 [US5] Implement `getMemberStats`, `getGroupStats`, `getGroupMemberSignals` in `src/server/queries/stats.ts`
- [X] T101 [P] [US5] Build stats components with text equivalents for every visual in `src/components/features/stats/` (`PeriodTabs.tsx`, `HabitRateList.tsx`, `StreakCard.tsx`, `ChallengeSummary.tsx` with journey/own split)
- [X] T102 [US5] Build «الإحصاءات» page (this week, this month, whole journey) in `src/app/(member)/stats/page.tsx`
- [X] T103 [US5] Add US5 Arabic strings to `messages/ar.json`

**Checkpoint**: Progress is visible; figures match monthly reviews and Today.

---

## Phase 8: User Story 6 - Walk together: community and groups (Priority: P3)

**Goal**: Group and cohort view, preset encouragements, «مجموعاتي», facilitator group page with signals, stats, and activities.

**Independent Test**: quickstart.md scenarios 7 and 8.

### Tests for User Story 6 ⚠️

- [X] T104 [P] [US6] pgTAP tests: `group_peers` shows only current group peers (id, full_name); encouragements readable by sender and recipient only; cross-group send denied; second send to the same person the same day denied; inactive phrase denied, in `supabase/tests/rls_community.test.sql`
- [X] T105 [P] [US6] Playwright e2e for quickstart scenario 8 and the facilitator part of scenario 7 in `tests/e2e/us6-community.spec.ts`

### Implementation for User Story 6

- [X] T106 [US6] Create `supabase/migrations/0012_community.sql`: `encouragement_phrases` per data-model.md `encouragement_phrases.text`, `encouragement_phrases.active`, `encouragement_phrases.sort_order`; `encouragements` per `encouragements.sender_id`, `encouragements.recipient_id` (≠ sender, same active group), `encouragements.phrase_id` (active only), `encouragements.local_date`, unique (sender, recipient, local_date); view `group_peers`; function `send_encouragement(recipient_id, phrase_id)`
- [X] T107 [P] [US6] Zod schema in `src/lib/validation/community.ts` citing data-model.md `encouragements.recipient_id`, `encouragements.phrase_id`, `encouragement_phrases.text`
- [X] T108 [US6] Implement `sendEncouragement` (maps the unique violation to `limit_reached`) in `src/server/actions/community.ts`
- [X] T109 [US6] Implement `getMyGroup`, `getReceivedEncouragements`, `getMyGroups` (led groups + own group with role labels) in `src/server/queries/community.ts`
- [X] T110 [P] [US6] Build community components in `src/components/features/community/` (`GroupHeader.tsx`, `MemberList.tsx`, `EncouragePicker.tsx` preset phrases only with no text input, `ReceivedList.tsx`)
- [X] T111 [US6] Build «المجتمع» page in `src/app/(member)/community/page.tsx`
- [X] T112 [P] [US6] Build «مجموعاتي» page in `src/app/(member)/groups/page.tsx` (member section, so members can open it too; analysis finding I1)
- [X] T113 [US6] Build facilitator group page (members with the three signals only, group stats from US5 queries, activities with create/cancel via `src/server/actions/activities.ts`) in `src/app/(member)/groups/[id]/page.tsx` (guarded by `requireGroupFacilitator`)
- [X] T114 [US6] Add an encouragement phrases tab and `upsertEncouragementPhrase` to `src/app/admin/content/page.tsx` and `src/server/actions/admin/content.ts`; seed default phrases (e.g. «بارك الله في سعيك»، «ثبّتك الله») in `supabase/seed.sql`
- [X] T115 [US6] Add US6 Arabic strings to `messages/ar.json`

**Checkpoint**: The group journey works with privacy limits enforced.

---

## Phase 9: User Story 7 - Resources (Priority: P3)

**Goal**: Journey map, recordings, files, references, and the ten guidelines, audience-restricted; admins manage them.

**Independent Test**: quickstart.md scenario 9.

### Tests for User Story 7 ⚠️

- [X] T116 [P] [US7] pgTAP tests: resources visible only to their audience (program, cohorts, groups) and storage object reads denied outside it; admin-only writes for resources, stages, guidelines, in `supabase/tests/rls_resources.test.sql`
- [X] T117 [P] [US7] Playwright e2e for quickstart scenario 9 in `tests/e2e/us7-resources.spec.ts`

### Implementation for User Story 7

- [X] T118 [US7] Create `supabase/migrations/0013_resources.sql`: `resources` per data-model.md `resources.type`, `resources.title`, `resources.description`, `resources.category`, `resources.sort_order`, `resources.storage_path`, `resources.url` (one of storage_path/url required for recording/file), `resources.audience`; `resource_audiences` (cohort_id or group_id); `guidelines` per `guidelines.number` (1..10, unique), `guidelines.text`; storage policies on bucket `resources`
- [X] T119 [P] [US7] Zod schemas in `src/lib/validation/resources.ts` citing data-model.md `resources.type`, `resources.title`, `resources.url`, `resources.storage_path`, `resources.audience`, `guidelines.number`, `guidelines.text`, `journey_stages.from_day`, `journey_stages.to_day`
- [X] T120 [US7] Implement `getResourceUrl` (audience check, 10-minute signed URL, `not_found` otherwise) in `src/server/actions/resources.ts`
- [X] T121 [US7] Implement `upsertResource` (signed upload URL), `deleteResource`, `reorderResources`, `upsertJourneyStage`, `upsertGuideline` in `src/server/actions/admin/resources.ts`
- [X] T122 [US7] Build «الموارد» hub and screens: `src/app/(member)/resources/page.tsx`, `src/app/(member)/resources/map/page.tsx` (current stage highlighted), `src/app/(member)/resources/guidelines/page.tsx` (intro «عشرة أعراف تحكم الرحلة…»), `src/app/(member)/resources/[type]/page.tsx` (accessible audio/video player, downloads)
- [X] T123 [US7] Build admin resource library in `src/app/admin/resources/page.tsx` and add stages and guidelines tabs to `src/app/admin/content/page.tsx`
- [X] T124 [P] [US7] Seed journey stages and the ten guidelines (editable placeholders) in `supabase/seed.sql`
- [X] T125 [US7] Add US7 Arabic strings to `messages/ar.json`

**Checkpoint**: Supporting content is available to the right audiences only.

---

## Phase 10: User Story 8 - My account, roles, and installing the app (Priority: P3)

**Goal**: Profile editing, cohort/group view, role switching, data export and deletion request, «المزيد» menu, install prompt.

**Independent Test**: quickstart.md scenario 10.

### Tests for User Story 8 ⚠️

- [X] T126 [P] [US8] pgTAP tests: `users.active_role` can only be set to a held role; export function returns only the caller's rows, in `supabase/tests/account.test.sql`
- [X] T127 [P] [US8] Playwright e2e for quickstart scenario 10 (profile edit, role switch without sign-out, manifest standalone check) in `tests/e2e/us8-account.spec.ts`

### Implementation for User Story 8

- [X] T128 [US8] Create `supabase/migrations/0014_account.sql`: `export_my_data()` (JSON of all own rows) and `request_account_deletion()` setting data-model.md `users.deletion_requested_at`
- [X] T129 [US8] Implement `updateProfile` (data-model.md `users.full_name`, `users.phone`, `users.gender`, `users.city`, `users.time_zone`), `switchRole` (`users.active_role`), `requestDataExport`, `requestAccountDeletion` in `src/server/actions/account.ts`
- [X] T130 [US8] Build «حسابي» page (profile form, cohort and group, archived habits link, role switch, sign out, export, delete request) in `src/app/(member)/account/page.tsx`
- [X] T131 [P] [US8] Build «المزيد» menu (الموارد، مجموعاتي، مراجعاتي، حسابي; لوحة الإدارة only for admins) in `src/app/(member)/more/page.tsx`
- [X] T132 [US8] Route `/` by `users.active_role` (member → «يومك», facilitator → group overview, admin → `/admin`) in `src/app/(member)/page.tsx`, and add `src/components/ui/RoleSwitcher.tsx` to the header for multi-role users
- [X] T133 [P] [US8] Build the install hint (Android `beforeinstallprompt`, iOS "Add to Home Screen" instructions, hidden when standalone) in `src/components/features/install/InstallHint.tsx`
- [X] T134 [US8] Add a deletion-requests list for admins in `src/app/admin/page.tsx`
- [X] T135 [US8] Add US8 Arabic strings to `messages/ar.json`

**Checkpoint**: All user stories are independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Constitution gates across all stories

- [ ] T136 [P] Add a messages test that every key used in `src/` exists in `messages/ar.json` and no value is Latin-only text, in `tests/unit/messages.test.ts`
- [ ] T137 [P] Add an axe sweep over every route for each role in `tests/e2e/a11y-all-routes.spec.ts`
- [ ] T138 [P] Add a performance check that «يومك» is interactive within 3 s on a throttled mid-range mobile profile in `tests/e2e/perf-today.spec.ts` (SC-003)
- [ ] T139 Add security headers (CSP, Referrer-Policy, Permissions-Policy) in `next.config.ts` and confirm no personal data reaches logs via `src/lib/log.ts`
- [ ] T140 Arabic language and tone review of `messages/ar.json` (calm, warm, no gamified wording) with fixes applied
- [ ] T141 Capture RTL screenshots of every member screen on a phone viewport for the PR review gate in `tests/e2e/screenshots.spec.ts`
- [ ] T142 Add a release checklist in `docs/release-checklist.md`: take a database backup before any release that includes new migrations, never edit a merged migration, fix mistakes with a new migration (constitution v1.2.0, Constraints › البيانات)
- [ ] T143 Run all of quickstart.md (automated checks and the 10 manual scenarios) and record results in `specs/001-goodlife-journey-app/checklists/quickstart-run.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: after Setup; blocks all stories.
- **US1 (Phase 3)**: after Foundational. Creates the daily, challenge, invitation, and activity tables used by later stories.
- **US2 (Phase 4)**: after Foundational; its migration `0008` adds admin write policies to tables from US1 (`0004`–`0007`), so run US1's migrations first.
- **US3, US4, US5**: after US1 (they extend `habits` and read daily records). US5 reuses `daily_activity` from US4's migration `0010`.
- **US6**: after US1; the facilitator group page uses US5 queries (T100) and the activity actions from US2 (T064).
- **US7**: after Foundational (uses `journey_stages` from `0003`); independent of other stories.
- **US8**: after US1; the role-based home (T132) links to US2 admin and US6 facilitator pages when present.
- **Polish (Phase 11)**: after the stories you intend to ship.

### Story completion order

```text
Setup → Foundational → US1 ─┬─→ US2
                            ├─→ US3
                            ├─→ US4 → US5 → US6
                            └─→ US8
Foundational → US7 (any time)
```

### Within each story

- Tests first; confirm they fail.
- Migration → validation schemas → actions/queries → components → pages → strings.
- Migrations are numbered; apply them in order (`npm run db:reset`).

### Parallel Opportunities

- Setup: T003–T006, T008–T010 together.
- Foundational: tests T012–T014 together; T019, T020, T023–T026, T028, T030, T031 together after T015–T018.
- US1: tests T033–T036 together; migrations T038–T040 together, then T037; T042, T049, T051, T052 alongside the actions.
- After US1, one developer per story: US2, US3, US4, US7, US8 can proceed in parallel.

---

## Parallel Example: User Story 1

```bash
# Tests first, together:
Task: "pgTAP daily RLS tests in supabase/tests/rls_daily.test.sql"
Task: "pgTAP redeem_invitation tests in supabase/tests/redeem_invitation.test.sql"
Task: "Playwright join + today e2e in tests/e2e/us1-join-today.spec.ts"
Task: "Playwright offline e2e in tests/e2e/us1-offline.spec.ts"

# Then three migrations together (T037 follows, since redeem_invitation creates a plan):
Task: "plans, habits, habit_completions, day_entries, closing_messages in supabase/migrations/0005_daily.sql"
Task: "journey/own challenges + completions in supabase/migrations/0006_challenges.sql"
Task: "activities + audiences in supabase/migrations/0007_activities.sql"
Task: "invitation_codes + redeem_invitation in supabase/migrations/0004_invitations.sql"  # after 0005
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → Phase 2 Foundational.
2. Phase 3 (US1), with seed data standing in for the admin panel.
3. **Stop and validate** with quickstart scenarios 1–2; demo to a few members.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → MVP demo.
3. US2 → first real cohort can be set up and invited (**pilot-ready**: US1 + US2).
4. US3 + US4 + US5 → plan, monthly rhythm, progress.
5. US6 + US7 + US8 → full group experience, resources, account.
6. Polish → release.

### Parallel Team Strategy

1. Everyone: Setup + Foundational + US1 migrations.
2. Then: Dev A US2 → US8; Dev B US3 → US4 → US5; Dev C US7 → US6.

---

## Notes

- [P] = different files, no dependency on unfinished tasks.
- Several tasks extend shared files (`messages/ar.json`, `src/app/admin/content/page.tsx`,
  `src/server/actions/admin/content.ts`, `supabase/seed.sql`, `src/server/queries/today.ts`);
  those are not marked [P] across stories.
- Commit after each task or logical group; stop at any checkpoint to validate the story.
