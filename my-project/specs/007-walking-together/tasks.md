---

description: "Task list for walking together"
---

# Tasks: Walking Together

## Phase 1–2: Setup and foundation
- [X] T001 Arabic strings (`together`, `groupChallenge`, `communityList`, `privateHabit`, admin) in `messages/ar.json`
- [X] T002 pgTAP first `supabase/tests/walking_together.test.sql`: peers see only shared habits of members of their group; facilitators and other groups see none; private+shared refused; challenge join/withdraw/locked habit; counts only; community list; closed group rejects codes
- [X] T003 Migration `supabase/migrations/0020_walking_together.sql`; seed (member1 shares two habits, member2 shares one, an active challenge); DB green both modes; types

## Phase 3: US1 sharing and «مجموعتي» (P1)
- [X] T004 [US1] Sharing switch in add flow step 3 and edit form; actions accept `shared`
- [X] T005 [US1] `StatsTabs`, `/stats/group` with `GroupHero`, `PeersCard`, `YouShowCard`

## Phase 4: US2 group challenge (P1)
- [X] T006 [US2] Admin `/admin/challenges` with `ChallengeForm`; actions
- [X] T007 [US2] `/stats/challenge` with `ChallengeView` (join, withdraw, progress, counts); «يومك» flag on the locked habit

## Phase 5: US3 community list (P2)
- [X] T008 [US3] `ActivityList` on `/community` with badges, presenter and inline registration; admin presenter field

## Phase 6: US4 private habit (P2)
- [X] T009 [US4] `src/lib/private-habits.ts` (+ unit tests), `HabitName`, private switch with explanation; names swapped on «يومك», «خطتي», stats

## Phase 7: US5 group settings (P3)
- [X] T010 [US5] `GroupSettingsForm` on the cohort page; features respected on «مجموعتي», «التحدّي», encouragements

## Phase 8: Polish
- [X] T011 e2e `tests/e2e/us-walking-together.spec.ts`; a11y routes; checks; screenshots; `checklists/quickstart-run.md`
