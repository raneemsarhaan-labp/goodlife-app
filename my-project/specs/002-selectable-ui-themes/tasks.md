---

description: "Task list for selectable visual versions («الواجهات الثلاث»)"
---

# Tasks: Selectable Visual Versions («الواجهات الثلاث»)

**Input**: Design documents from `/specs/002-selectable-ui-themes/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included — constitution v1.2.0 requires permission tests, accessibility checks, and e2e
before merge; the spec adds per-version parity (SC-007), contrast (SC-004) and speed (SC-003).

**Organization**: by user story. US2 («يومك» and every other screen in all versions) is the largest
phase and has an internal checkpoint after «يومك» (the MVP).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: US1–US5 from spec.md
- Paths are relative to `my-project/`; field rules are canonical in `data-model.md` (`Entity.field`).

---

## Phase 1: Setup

- [X] T001 Add dependencies `@fontsource/cairo@5.3.0` and `@material-symbols/svg-400@0.49.0` to `package.json` (research §7)
- [X] T002 [P] Self-host Cairo (Arabic + Latin, 400/600/700 woff2 + OFL license) in `src/app/fonts/` and switch the root layout font from IBM Plex Sans Arabic to Cairo in `src/app/layout.tsx` — *Done as: Fonts self-hosted in `public/fonts/` (woff2, `@font-face` in `src/ui/theme/tokens.css`).*
- [X] T003 [P] Extract development placeholder background art (painted botanical for «زجاجي», botanical photo for «زجاج كامل», quote-card plant art) from the supplied design files into `public/ui/` as AVIF + WebP at 828 and 1600 px widths, with `public/ui/README.md` noting they are placeholders pending licensed art (research §6)
- [X] T004 [P] Enable `experimental.optimizePackageImports: ["@ionic/react", "ionicons"]` in `next.config.ts` (research §4)
- [X] T005 [P] Add Playwright projects `ui-journey`, `ui-glass`, `ui-full-glass` (each sets cookie `gl_ui`) running all specs in `playwright.config.ts` (research §10)

---

## Phase 2: Foundational (blocking)

### Tests

- [X] T006 [P] pgTAP tests in `supabase/tests/ui_versions.test.sql`: defaults (`journey`, ritual on, chosen_at null); self can update own preferences, not others'; invalid version rejected; habit icon outside the curated list rejected; quotes readable by signed-in users and writable by admins only; `quote_for_date` is the same for everyone on a date and rotates by day; `today_ritual()`/`mark_ritual_seen()` hide the ritual for the rest of the day, for `glass`, and when `ui_ritual` is off; `ritual_seen` is self-only
- [X] T007 [P] Unit tests for version metadata, cookie parsing, and the theme resolver (profile → cookie → default) in `tests/unit/ui-versions.test.ts`

### Implementation

- [X] T008 Create `supabase/migrations/0015_ui_versions.sql`: enum `ui_version`; columns per data-model.md `users.ui_version`, `users.ui_ritual`, `users.ui_reduce_transparency`, `users.ui_chosen_at` (added to the self-update column grant); `habits.icon` with a check listing the curated names; tables `quotes` per `quotes.id`, `quotes.text`, `quotes.source`, `quotes.sort_order`, `quotes.active` and `ritual_seen` per `ritual_seen.user_id`, `ritual_seen.local_date`, `ritual_seen.seen_at` with RLS; functions `quote_for_date`, `today_ritual`, `mark_ritual_seen`; extend `get_today()` with `habits[].icon`, `habits[].week_done`, `habits[].current_streak`
- [X] T009 [P] Shared design tokens from the designs in `src/ui/theme/tokens.css` (contracts/ui-themes.md › Tokens)
- [X] T010 [P] Version themes in `src/ui/theme/journey.css`, `src/ui/theme/glass.css`, `src/ui/theme/full-glass.css`, each setting the per-version tokens and derived `--ion-*` variables under `[data-ui=…]` — *Done as: One file `src/ui/theme/versions.css` with three `[data-ui]` blocks; Ionic variables mapped once in `tokens.css`.*
- [X] T011 [P] Fallbacks in `src/ui/theme/fallbacks.css`: `[data-reduce-transparency=true]`, `prefers-reduced-transparency`, `@supports not (backdrop-filter)`, `prefers-reduced-motion`, `Save-Data` class (no background image) (research §5–6)
- [X] T012 [P] Version metadata and resolver in `src/ui/versions.ts` (ids, message keys, `showsRitual`, backgrounds, previews; `resolveVersion(profile, cookie)`; fallback to `journey`) per data-model.md `users.ui_version`
- [X] T013 [P] Icon registry in `src/ui/icons.ts`: Material Symbols Rounded SVGs as data URLs for app icons and the curated habit-icon set (data-model.md `habits.icon`)
- [X] T014 Move Ionic setup out of the root layout into `src/ui/IonicRoot.tsx` (imported only by client views) and add `src/ui/clientView.tsx` (`next/dynamic` `ssr:false` + server `Skeleton`) (research §3–4)
- [X] T015 Render `<html data-ui data-reduce-transparency>` from the current user's preferences or cookie `gl_ui` in `src/app/layout.tsx`; import the theme CSS; add `ui_version`, `ui_ritual`, `ui_reduce_transparency`, `ui_chosen_at` to `getCurrentUser()` in `src/server/auth.ts`
- [X] T016 Implement `setAppearance` and `skipAppearanceChoice` (writing data-model.md `users.ui_version`, `users.ui_ritual`, `users.ui_reduce_transparency`, `users.ui_chosen_at` and cookie `gl_ui`) in `src/server/actions/appearance.ts` with Zod schemas in `src/lib/validation/appearance.ts`
- [X] T017 [P] Base components in `src/ui/components/`: `AppShell.tsx` (page background layer + header), `GlassCard.tsx`, `Skeleton.tsx`, `List.tsx` (IonList/IonItem wrappers), form fields `Field.tsx` (IonInput/IonTextarea/IonSelect/IonToggle/IonCheckbox in IonItem, with error and hint wired for screen readers), `ActionForm.tsx` (Ionic version of the existing ActionForm), `DataTable.tsx` (solid surface, FR-007) — *Done as: `GlassCard.tsx` for Ionic islands; server primitives (`Card`, `Field`, `EmptyState`, …) use `.gl-surface` instead of new Ionic wrappers (plan › Implementation note).*
- [X] T018 [P] `src/ui/components/BottomNav.tsx` with `IonTabBar`/`IonTabButton` driving the Next router (no Ionic router), RTL order يومي · خطتي · الإحصاءات · المجتمع · المزيد — *Done as: Kept a semantic `<nav>` of links (no `IonTabBar`), themed with `.gl-nav` and Material Symbols.*
- [X] T019 Add Arabic strings for versions (names, descriptions), appearance settings, setup step, ritual, quotes admin to `messages/ar.json`
- [X] T020 Seed: member1 → `glass`, member2 → `full_glass`, default for others; 12 daily quotes; icons for member1's habits in `supabase/seed.sql` — *Done as: 12 quotes and habit icons seeded; seeded users have no version choice (e2e sets the `gl_ui` cookie per project).*

**Checkpoint**: theme system, preferences, and component base ready.

---

## Phase 3: User Story 1 - Choose my version during setup (Priority: P1)

**Goal**: a "choose your look" step after «أهلًا بك», skippable, saved to the account.

**Independent Test**: quickstart scenarios 1–2.

- [X] T021 [P] [US1] e2e: join → welcome → choose «زجاج كامل» → «يومك» has `data-ui=full-glass`; second context signed in as the same user sees it; skip path gives `journey`, in `tests/e2e/ui-setup.spec.ts`
- [X] T022 [P] [US1] `src/ui/components/VersionPicker.tsx`: `role="radiogroup"` of three live mini-previews (same components with sample data at reduced scale), name and one-line description each
- [X] T023 [US1] Route `/setup/look` (server page + client view) in `src/app/(auth)/setup/look/page.tsx` and `src/ui/views/SetupLookView.tsx`; `/welcome` continues to it in `src/app/(auth)/welcome/page.tsx` — *Done as: Client form in `src/components/features/appearance/SetupLookForm.tsx`.*
- [X] T024 [US1] Existing members with no choice (data-model.md `users.ui_chosen_at` null) see a dismissible invitation card on «يومك» linking to `/account/appearance` (component `src/ui/components/ChooseLookCard.tsx`)

**Checkpoint**: members can choose a version.

---

## Phase 4: User Story 2 - Live my day (and use every screen) in any version (Priority: P1) 🎯 MVP

**Goal**: «يومك» in the designs' layout in all three versions, then every other screen.

**Independent Test**: quickstart scenarios 3, 4, 8; all spec 001 e2e specs pass in each version (SC-007).

### Tests

- [X] T025 [P] [US2] Update spec 001 e2e selectors where the UI changed (habit circles are toggle buttons with `aria-pressed`; quick actions in the + menu) keeping each scenario's assertions, in `tests/e2e/*.spec.ts`
- [X] T026 [P] [US2] e2e parity: the same day actions in each version produce identical stored state and stats, in `tests/e2e/ui-parity.spec.ts`

### «يومك» (MVP)

- [X] T027 [P] [US2] `src/ui/components/HabitRow.tsx`: horizontal scroller of circular habit toggles (icon from data-model.md `habits.icon`, label, done check, `aria-pressed`), done/total count, expandable details (description, `week_done`/7, `current_streak`) via `IonAccordion`; uses the existing offline outbox
- [X] T028 [P] [US2] `src/ui/components/ProgressCard.tsx` («تقدمك اليوم» percentage + `IonProgressBar`) and `src/ui/components/ChallengeCard.tsx` (journey and own challenge, still distinct) — *Done as: Existing `ChallengeCards` reused inside the island (still two distinct cards).*
- [X] T029 [P] [US2] `src/ui/components/QuickActions.tsx`: `IonFab` with add habit, own challenge, start day, close day
- [X] T030 [US2] `src/ui/views/TodayView.tsx` composing greeting, intention/«ابدأ يومي», review prompt, HabitRow, ProgressCard, ChallengeCards, upcoming activities, «ختام اليوم», QuickActions; `src/app/(member)/page.tsx` renders it via `clientView`; member shell `src/app/(member)/layout.tsx` uses AppShell + BottomNav — *Done as: `src/ui/views/TodayIsland.tsx` (+ skeleton, `TodayIsland.client.tsx`); greeting, tabs, intention, review prompt and «ختام اليوم» stay server-rendered.*
- [X] T031 [US2] Habit icon picker in the habit create/edit forms (data-model.md `habits.icon`) in `src/ui/views/HabitFormView.tsx`; `createHabit`/`updateHabit` accept `icon` in `src/server/actions/habits.ts` — *Done as: `src/components/features/habits/HabitIconPicker.tsx` in `NewHabitForm` and `HabitEditForm`.*

**Checkpoint (MVP)**: «يومك» works identically in all three versions.

### Remaining member screens

- [X] T032 [P] [US2] Auth views: join, join profile, OTP, sign-in, welcome in `src/ui/views/auth/` — *Done as: Themed through tokens on the existing server components (plan › Implementation note).*
- [X] T033 [P] [US2] Day views: start day, close day in `src/ui/views/DayStartView.tsx`, `src/ui/views/DayCloseView.tsx` — *Done as: Themed through tokens on the existing server components.*
- [X] T034 [P] [US2] «خطتي», habit edit, archived habits in `src/ui/views/PlanView.tsx`, `src/ui/views/HabitFormView.tsx`, `src/ui/views/ArchivedHabitsView.tsx` — *Done as: Themed through tokens on the existing server components.*
- [X] T035 [P] [US2] Stats in `src/ui/views/StatsView.tsx` — *Done as: Themed through tokens on the existing server components.*
- [X] T036 [P] [US2] Reviews list and review in `src/ui/views/ReviewsView.tsx`, `src/ui/views/ReviewView.tsx` — *Done as: Themed through tokens on the existing server components.*
- [X] T037 [P] [US2] Community and «مجموعاتي» in `src/ui/views/CommunityView.tsx`, `src/ui/views/GroupsView.tsx` — *Done as: Themed through tokens on the existing server components.*
- [X] T038 [P] [US2] Resources hub, map, guidelines, lists in `src/ui/views/resources/` — *Done as: Themed through tokens on the existing server components.*
- [X] T039 [P] [US2] «المزيد» and «حسابي» in `src/ui/views/MoreView.tsx`, `src/ui/views/AccountView.tsx`; not-found page — *Done as: Themed through tokens; «المظهر» linked from «حسابي» and «المزيد».*

### Facilitator and admin

- [X] T040 [P] [US2] Facilitator group page in `src/ui/views/GroupView.tsx` — *Done as: Themed through tokens on the existing server components.*
- [X] T041 [US2] Admin shell and home, cohorts, cohort detail, invitations, activities, resources, content tabs in `src/ui/views/admin/` (tables and long forms on solid surfaces, FR-007) — *Done as: Themed through tokens; `[data-area=admin]` keeps solid surfaces (FR-007).*
- [X] T042 [US2] Point every route in `src/app/**/page.tsx` to its view via `clientView` with a matching `Skeleton`; delete replaced components in `src/components/` — *Done as: Superseded: only «يومك» uses `clientView`; no screens were replaced, so no components were deleted.*

**Checkpoint**: every screen themed (FR-006).

---

## Phase 5: User Story 3 - Change my version later (Priority: P2)

**Goal**: switch version from «حسابي» › المظهر, immediately and across devices.

**Independent Test**: quickstart scenario 5.

- [X] T043 [P] [US3] e2e: switch in `/account/appearance` → `data-ui` changes without sign-out; a second context sees it on next open; unsaved text in another tab is not lost, in `tests/e2e/ui-appearance.spec.ts`
- [X] T044 [US3] Route `/account/appearance` with VersionPicker, ritual toggle (data-model.md `users.ui_ritual`) and reduce-transparency toggle (data-model.md `users.ui_reduce_transparency`) in `src/app/(member)/account/appearance/page.tsx` and `src/ui/views/AppearanceView.tsx`; link from «حسابي» and «المزيد» — *Done as: Client form in `src/components/features/appearance/AppearanceForm.tsx`.*

---

## Phase 6: User Story 4 - The opening ritual «ابدأ يومي» (Priority: P2)

**Goal**: daily quote card in «رحلة يومي» and «زجاج كامل», once a day across devices.

**Independent Test**: quickstart scenario 6.

- [X] T045 [P] [US4] e2e: first open shows the quote card in `journey` and `full-glass`, not in `glass`; «ابدأ يومي» leads to the intention step; not shown again that day (second context too); hidden when the ritual is off, in `tests/e2e/ui-ritual.spec.ts`
- [X] T046 [US4] `src/ui/components/QuoteModal.tsx` (`IonModal` sheet, quote and source, «ابدأ يومي», close) shown by TodayView when `today_ritual().show`; actions `dismissRitual` in `src/server/actions/appearance.ts`
- [X] T047 [US4] Admin quotes tab and `upsertQuote` (data-model.md `quotes.text`, `quotes.source`, `quotes.sort_order`, `quotes.active`) in `src/ui/views/admin/content/QuotesTab.tsx` and `src/server/actions/admin/content.ts` — *Done as: `src/components/features/admin/content/QuotesTab.tsx`.*

---

## Phase 7: User Story 5 - Comfortable for everyone (Priority: P2)

**Goal**: WCAG 2.1 AA in every version, with reduced transparency and motion.

**Independent Test**: quickstart scenario 7.

- [X] T048 [P] [US5] axe sweep of every route × 3 versions × (default, reduced transparency, reduced motion) in `tests/e2e/a11y-all-routes.spec.ts`
- [X] T049 [P] [US5] Contrast sampler: screenshot text regions on glass cards and assert ≥ 4.5:1 (3:1 large text/icons) against rendered pixels, per glass version, in `tests/e2e/ui-contrast.spec.ts` and helper `tests/e2e/helpers/contrast.ts`
- [X] T050 [US5] Tune `src/ui/theme/glass.css` and `src/ui/theme/full-glass.css` minimum surface opacity under text until T049 passes; verify fallbacks in `src/ui/theme/fallbacks.css` — *Done as: Tuned via `--page-scrim` (off-card text) and Ionic text-step variables (#999 → ink-500); measured ≥ 4.5:1 in all versions.*

---

## Phase 8: Polish & Cross-Cutting

- [X] T051 [P] Per-version performance check («يومك» ≤ 3 s, throttled) and a JS budget check (≤ 200 KB gzipped first load for «يومك») in `tests/e2e/perf-today.spec.ts` and `scripts/check-bundle-budget.mjs` (CI step) — *Done as: `scripts/check-bundle-budget.mjs` (`npm run check:bundle`, CI step): 163.6 KB.*
- [X] T052 [P] Visual snapshots of «يومك» per version for design review in `tests/e2e/screenshots.spec.ts`
- [X] T053 [P] Background images load after content and are skipped under Save-Data: verify in `tests/e2e/ui-backgrounds.spec.ts`
- [X] T054 Remove the dev-only `/dev/ionic` showcase's duplication by reusing `src/ui/components` in `src/app/dev/ionic/IonicShowcase.tsx`; update spec 001 plan/quickstart references to the new UI layer — *Done as: `ClientOnly.tsx` uses `clientView`; showcase renders the real `HabitRow`, `ProgressCard`, `ActivitiesCard`.*
- [X] T055 Run all checks and record results in `specs/002-selectable-ui-themes/checklists/quickstart-run.md`

---

## Dependencies & Execution Order

- Setup → Foundational (T008–T020) → stories.
- US1 needs T022 VersionPicker previews of «يومك» components → do US2's «يومك» part (T027–T030) before T022's live previews; T022 can start with static previews.
- US2 (MVP «يومك») → rest of US2 screens in parallel (T032–T041) → T042.
- US3 needs T022 (picker). US4 needs T030 (TodayView). US5 runs once views exist.
- Polish last.

```text
Setup → Foundation → US2 «يومك» (MVP) → US1 → US2 other screens ─┬─→ US3
                                                                   ├─→ US4
                                                                   └─→ US5 → Polish
```

## Parallel Example: User Story 2

```bash
Task: "HabitRow in src/ui/components/HabitRow.tsx"
Task: "ProgressCard + ChallengeCard in src/ui/components/"
Task: "QuickActions in src/ui/components/QuickActions.tsx"
# after TodayView: one developer per area
Task: "Auth views in src/ui/views/auth/"
Task: "Plan views in src/ui/views/PlanView.tsx"
Task: "Admin views in src/ui/views/admin/"
```

## Implementation Strategy

1. Setup + Foundation (themes switchable with existing screens wrapped).
2. «يومك» in all three versions → **MVP**, demo.
3. Setup step (US1) → new members choose.
4. Remaining screens by area, each area shippable.
5. Appearance settings, ritual, accessibility hardening, polish.
