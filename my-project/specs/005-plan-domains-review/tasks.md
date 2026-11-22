---

description: "Task list for «خطتي» by domain, review rhythm and challenge by domain"
---

# Tasks: «خطتي» by Domain, Personal Review Rhythm, Daily Challenge by Domain

**Input**: `/specs/005-plan-domains-review/` · **Tests**: included (constitution III/IV).

## Phase 1: Setup
- [X] T001 Arabic strings (`identity`, `domainCard`, `planReview`, `challengeLibrary`, admin tab) in `messages/ar.json`

## Phase 2: Foundational
- [X] T002 pgTAP first in `supabase/tests/plan_domains_review.test.sql`: identity/sign self-only; library read/write roles; draw is stable, from plan domains, excludes recent completions, changes on refresh, max three; done in the journey slot; stats count library days; review due and `complete_plan_review` date rules; export keys
- [X] T003 Migration `supabase/migrations/0018_plan_domains_review.sql` (data-model.md `plans.identity`, `plans.next_review_on`, `focus_areas.sign`, `focus_areas.review_on`, `challenge_library.title`, `challenge_library.prompt`, `challenge_library.habit_name`, `challenge_library.style`, `daily_challenge_refreshes.refreshes`, `challenge_completions.library_challenge_id`) and functions per data-model.md
- [X] T004 Seed library and member1 domain texts/next review in `supabase/seed.sql`; DB tests green both modes; regenerate types

## Phase 3: US1 «خطتي» by domain (P1)
- [X] T005 [US1] Schemas + actions `saveIdentity`, `saveDomainArea` (`src/lib/validation/plan.ts`, `src/server/actions/plan.ts`)
- [X] T006 [US1] `IdentityCard.tsx`, `DomainCards.tsx` and «خطتي» layout in `src/app/(member)/plan/page.tsx`
- [X] T007 [P] [US1] e2e `tests/e2e/us-plan-domains.spec.ts`

## Phase 4: US2 challenge by domain (P1)
- [X] T008 [US2] `refreshChallenge` action; `get_today` types; ChallengeCards library variant with ↻, domain and kind chips
- [X] T009 [US2] `/habits/new?from=journey` uses the library challenge's habit name and domain
- [X] T010 [US2] Admin `ChallengeLibraryTab.tsx` + `upsertLibraryChallenge`
- [X] T011 [P] [US2] e2e `tests/e2e/us-challenge-library.spec.ts`

## Phase 5: US3 plan review (P2)
- [X] T012 [US3] `completePlanReview`; `ReviewDueCard.tsx` on «خطتي» and «يومك»
- [X] T013 [US3] `/plan/review` with `PlanReviewStepper.tsx`
- [X] T014 [P] [US3] e2e `tests/e2e/us-plan-review.spec.ts`

## Phase 6: Polish
- [X] T015 Routes in a11y sweep and screenshots; full checks; `checklists/quickstart-run.md`; screenshots

## Dependencies
Setup → Foundational → US1/US2/US3 (independent; US3 reuses US1 forms) → Polish.
