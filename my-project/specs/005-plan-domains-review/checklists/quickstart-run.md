# Quickstart run: «خطتي» by Domain, Review Rhythm, Challenge by Domain (T015)

**Date**: 2026-11-22 · **Environment**: cloud container (local PostgreSQL 16 + pgTAP; no Supabase Auth —
signed-in Playwright specs run in CI, not here).

| Check | Result |
|-------|--------|
| Lint, typecheck | pass |
| Unit | 83/83 (18 files; new `plan-review`) |
| Database (seeded and `--no-seed`) | 349/349; `plan_domains_review.test.sql` 26 assertions (privacy, library roles, stable draw from plan domains, refresh limit, other members cannot query a draw, completion in the day's slot, stats, review rule) |
| Build | pass; new route `/plan/review` |
| «يومك» first-load JS | 168.4 KB gzipped (≤ 200 KB) |
| e2e | not run here; new `us-plan-domains`, `us-plan-review`, `us-challenge-library`; a11y sweep and screenshots extended |

Rendered checks (dev preview `/dev/plan-preview`, three versions): review-due card, «هويّتي», domain
cards (opened), library challenge with domain/kind chips and ↻ — axe: no violations in any version.

Notes
- `library_challenge_for` must be callable by members because «يومك» reads it; it returns nothing when
  asked about another member (the draw would reveal plan domains). Covered by a test.
- The plan-review e2e only reads the seeded member (shared database across the three Playwright
  projects); a fresh member completes a review.
