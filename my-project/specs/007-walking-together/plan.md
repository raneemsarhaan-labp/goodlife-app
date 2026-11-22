# Implementation Plan: Walking Together

**Branch**: `claude/brave-rubin-kfvfjs` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

## Summary
Migration `0020_walking_together.sql`: habit sharing and private flags; group status and tool toggles;
activity presenter; group challenges and participants with locked habits; definer functions that return
only what peers may see (`group_peers`), challenge status with aggregate counts, and the community activity
list; closed groups reject codes. UI: add-flow/edit switches, a client `HabitName` for device-only names,
«الإحصاءات» tabs (أنا / مجموعتي / التحدّي), «المجتمع» activity list, admin challenges page and group settings.

## Technical Context
Stack unchanged; pgTAP `walking_together.test.sql`; Vitest for private-name storage; e2e
`us-walking-together.spec.ts`.

## Constitution Check
| Principle | Result | Evidence |
|-----------|--------|----------|
| IV Privacy | PASS | sharing default off; `group_peers` returns names only of shared habits, only to active **member** peers; facilitators excluded; private habit names never reach the server; group challenge counts only |
| VI Calm, no pressure | PASS | no ranking (FR-083 unchanged); counts are of the group, not individuals |
| III Server roles | PASS | definer functions check membership/audience; admin-only challenge writes; locked-habit trigger |
| II Journey | PASS | challenges are cohort/group scoped and time-boxed inside the journey |
| V Mobile | PASS | «يومك» unchanged budget; challenge flag comes in `get_today` |

## Research
- **Peer visibility** in a definer function (`group_together`) rather than RLS on `habits`, so peers never get table access.
- **Locked habit**: trigger blocks changes to name, amount, days, time of a habit with `group_challenge_id`.
- **Private name**: the client creates the habit id, stores `{id: name}` in localStorage, sends the
  placeholder; `HabitName` swaps it in on render (hydration-safe: placeholder first, name after mount).
- **Community list**: definer function filtered by `can_see_activity`, next session ahead.

## Structure
```text
supabase/migrations/0020_walking_together.sql  supabase/tests/walking_together.test.sql  seed
src/lib/private-habits.ts  src/components/features/habits/HabitName.tsx  SharingSwitches.tsx
src/app/(member)/stats/{group,challenge}/page.tsx  src/components/features/stats/StatsTabs.tsx
src/components/features/together/{GroupHero,PeersCard,YouShowCard,ChallengeView}.tsx
src/components/features/community/ActivityList.tsx  src/app/(member)/community/page.tsx
src/app/admin/challenges/page.tsx  src/components/features/admin/{ChallengeForm,GroupSettingsForm}.tsx
```
