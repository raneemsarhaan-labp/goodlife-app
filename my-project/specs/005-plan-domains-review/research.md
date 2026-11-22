# Research: «خطتي» by Domain, Review Rhythm, Challenge by Domain

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-22

## 1. Plan texts live on existing rows
- **Decision**: `plans.identity`, `plans.next_review_on`, `plans.last_reviewed_at`; `focus_areas.sign`,
  `focus_areas.review_on`; «من أريد أن أكون» reuses `focus_areas.description` (≤ 500) for domain areas.
- **Rationale**: plans and focus areas are already self-only by RLS (constitution IV) and exported.

## 2. Library challenge in the day's challenge slot
- **Decision**: `challenge_completions.library_challenge_id`; the existing `kind = 'journey'` slot accepts a
  journey challenge **or** a library challenge (check constraint updated). One completion per day per
  slot stays enforced by the existing unique key.
- **Rationale**: stats, reviews and the «يومك» card already read that slot; no new enum value (which
  cannot be used in the same migration transaction).

## 3. Deterministic draw
- **Decision**: `library_challenge_for(user, date)`: eligible = active challenges in the user's plan domains
  (all active domains when none), minus those the user completed in the 14 days before `date`; order by
  `md5(user || date || id)`; take the one at offset `refreshes mod count`. `daily_challenge_refreshes`
  stores only the refresh count. When nothing is eligible, fall back to any active challenge of those
  domains; empty library → none.
- **Rationale**: `get_today` stays read-only and stable; the same challenge on every open (SC-002).

## 4. "Days with a challenge"
- **Decision**: in `period_figures.journey_total` and `group_stats.journey_possible`, a day counts when it
  has a journey challenge **or** the library has an active challenge.

## 5. Review due rule
- **Decision**: due when `next_review_on <= today`, or `next_review_on is null and plans.created_at` is 30+
  days ago; `complete_plan_review(next)` sets `last_reviewed_at` and `next_review_on` (tomorrow … +365).

## 6. UI
- **Decision**: «خطتي» renders `IdentityCard`, `DesiredState`, `DomainCards` (each a form), and the existing
  free-text areas; `/plan/review` is a 3-step client stepper around server-action forms; ChallengeCards
  gets a library-challenge variant with ↻.
