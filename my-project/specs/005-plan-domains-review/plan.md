# Implementation Plan: «خطتي» by Domain, Review Rhythm, Challenge by Domain

**Branch**: `claude/brave-rubin-kfvfjs` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

## Summary
Plan texts by domain («هويّتي», who-I-want-to-be, sign, review dates) on existing self-only rows; a personal
plan review with a member-chosen next date; an admin challenge library drawn deterministically per member
and day from their plan domains, filling the day's challenge slot with up to three refreshes.

## Technical Context
**Stack**: unchanged (TypeScript strict, Next 16, React 19, Supabase/PostgreSQL 17); no new packages
**Storage**: migration `0018_plan_domains_review.sql` ([data-model.md](./data-model.md))
**Testing**: pgTAP `plan_domains_review.test.sql`; Vitest; Playwright specs per visual version
**Performance**: «يومك» unchanged budget (≤ 200 KB); `get_today` one call (draw computed in SQL)
**Constraints**: Arabic RTL; WCAG 2.1 AA ×3 versions; privacy of plan texts

## Constitution Check
| Principle | Pre | Post | Evidence |
|-----------|-----|------|----------|
| I. Arabic first | PASS | PASS | new keys `identity`, `domainCard`, `planReview`, `challengeLibrary` |
| II. Journey rhythm | PASS | PASS | year (identity, domains) ↔ day (challenge by domain) ↔ review rhythm; stats from records |
| III. Server roles, tested | PASS | PASS | admin-only library writes; self-only plan rows; definer functions check the caller; pgTAP |
| IV. Privacy | PASS | PASS | identity, domain texts on self-only plans/focus_areas; group stats numbers only |
| V. Mobile, offline «يومك» | PASS | PASS | challenge done still via the outbox; refresh needs a connection (stated) |
| VI. Simplicity, a11y | PASS | PASS | reuses focus areas and the challenge slot; one stepper |
**Result**: no violations. Spec 001 FR-013 (journey challenge per day) is extended, not replaced: the
journey challenge keeps priority.

## Project Structure
```text
supabase/migrations/0018_plan_domains_review.sql   supabase/tests/plan_domains_review.test.sql   supabase/seed.sql
src/server/actions/plan.ts (saveIdentity, saveDomainArea, completePlanReview)   src/server/actions/today.ts (refreshChallenge)
src/server/actions/admin/content.ts (upsertLibraryChallenge)
src/components/features/plan/IdentityCard.tsx  DomainCards.tsx  ReviewDueCard.tsx
src/app/(member)/plan/review/page.tsx + src/components/features/plan/PlanReviewStepper.tsx
src/components/features/today/ChallengeCards.tsx (library variant)   src/components/features/admin/content/ChallengeLibraryTab.tsx
tests/e2e/us-plan-domains.spec.ts  us-plan-review.spec.ts  us-challenge-library.spec.ts
```

## Complexity Tracking
None.
