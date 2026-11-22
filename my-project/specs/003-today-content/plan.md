# Implementation Plan: «يومك» Content — Desired State, Activity Registration, «اجعلها عادة»

**Branch**: `claude/brave-rubin-kfvfjs` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-today-content/spec.md`

## Summary

Three additions to «يومك» from the product owner's designs. (1) «حالي المنشود»: a new private text in
«خطتي» shown at the top of «يومك», with quick «وقفة تأمل» notes (several a day, offline-capable) and a
history that also lists «ختام اليوم» reflections. (2) Activity registration: activities gain sessions, an
online/in-person mode, an optional capacity and a meeting link visible only to registered members;
members register or cancel until the last session starts; «يومك» shows a closable card for each
registered activity; admins see all registrations, facilitators only their own members'. (3) «اجعلها
عادة» turns today's challenge into a habit through the existing add-habit form, prefilled on the server.
One forward-only migration (`0016`) adds the data; SQL functions enforce audience, window and capacity
under a row lock; UI follows spec 002's token theming, outside the Ionic island to protect the JS budget.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 22; SQL (PostgreSQL 17) — unchanged

**Primary Dependencies**: unchanged (Next.js 16, React 19, Supabase, next-intl, Tailwind 4, Serwist,
`@ionic/react` 9 for the existing «يومك» island). No new dependencies.

**Storage**: Supabase PostgreSQL — migration `0016_today_content.sql` ([data-model.md](./data-model.md))

**Testing**: Vitest (validation, name shortening, card visibility rule); pgTAP `today_content.test.sql`
(RLS per role, window, capacity, link visibility, export); a parallel-session script for capacity
(research §7); Playwright e2e per visual version (three Playwright projects from spec 002) + axe

**Target Platform**: unchanged (mobile and desktop browsers, installable PWA)

**Project Type**: web application (single Next.js project) — unchanged

**Performance Goals**: «يومك» usable ≤ 3 s; first-load JS ≤ 200 KB gzipped (spec 002 gate; today 163 KB);
one round trip for «يومك» data (extended `get_today`)

**Constraints**: Arabic RTL; WCAG 2.1 AA in three versions; reflections private (constitution IV);
offline reflection saving; capacity never exceeded

**Scale/Scope**: 1 migration (5 tables/columns groups, ~8 functions), 3 new routes, ~6 new components,
admin form extension; cohorts of hundreds of members, activities with up to 52 sessions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.2.0.

| Principle | Gate | Pre-research | Post-design | Evidence |
|-----------|------|--------------|-------------|----------|
| I. Arabic first, RTL | Strings in messages; RTL; one formatter | PASS | PASS | New keys under `desiredState`, `reflections`, `activityRegistration`; dates/times via `src/lib/format.ts` |
| II. Annual journey is the centre | Features serve the day/month/year rhythm; data tied to a journey | PASS | PASS | Desired state (year) shown daily with a daily pause; reflections carry `cohort_id`; activities stay cohort/group scoped |
| III. Roles enforced on server; tested | Server checks + RLS; a test per rule | PASS | PASS | Registration via security-definer functions with explicit audience checks; facilitator list filtered in SQL; pgTAP allow/deny per role (data-model.md › SQL functions) |
| IV. Privacy of personal reflection | Reflective content self-only; facilitator sees activity signals only | PASS (with explicit rule) | PASS | `plans.desired_state` and `reflections` are self-only; nothing reflective reaches facilitators or admins' member views. Facilitators seeing *which of their members registered* is not reflective content and is the explicit visibility rule in spec 003 FR-017 (research §10) |
| V. Installable, mobile-first, ≤ 3 s, offline «يومك» | Budget, offline core tasks | PASS | PASS | New cards outside the Ionic island, server-rendered; reflections use the existing outbox; budget gate in CI |
| VI. Simplicity, calm, accessibility | Simplest design; WCAG 2.1 AA | PASS | PASS | Reuses plan, outbox, habit form, activity form; no waitlist, no notifications; axe sweep per version |
| Constraints: tech stack | Added technology justified | PASS | PASS | None added |
| Constraints: data | Forward-only migration; backup before release | PASS | PASS | `0016` additive; back-fill of one session per existing activity |
| Workflow gates | Tests before merge; RTL screenshots | PASS | PASS | New e2e specs run in the three versions; screenshots spec extended |

**Result**: no violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-today-content/
├── spec.md              # clarified 2026-11-22
├── plan.md              # this file
├── research.md          # decisions §1–§13
├── data-model.md        # migration 0016
├── quickstart.md        # validation guide
├── contracts/
│   └── server-actions.md  # actions, routes, UI contract
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (inside `my-project/`)

```text
supabase/
├── migrations/0016_today_content.sql      # NEW
├── tests/today_content.test.sql           # NEW
└── seed.sql                               # + desired state, registration activity
scripts/db-concurrency-check.sh            # NEW (capacity under parallel sessions)
src/
├── app/(member)/
│   ├── page.tsx                           # + DesiredStateCard, RegisteredActivityCards
│   ├── plan/page.tsx                      # + desired-state editor, history link
│   ├── plan/reflections/page.tsx          # NEW
│   ├── activities/[id]/page.tsx           # NEW
│   └── habits/new/page.tsx                # + ?from=journey|own prefill
├── app/admin/activities/[id]/page.tsx     # NEW (registrations)
├── components/features/
│   ├── today/DesiredStateCard.tsx         # NEW (client form, outbox)
│   ├── today/RegisteredActivityCard.tsx   # NEW (closable)
│   ├── today/ChallengeCards.tsx           # + «اجعلها عادة»
│   ├── plan/DesiredStateForm.tsx          # NEW
│   ├── activities/RegistrationButton.tsx  # NEW
│   └── admin/ActivityForm.tsx             # + sessions, registration settings
├── lib/offline/outbox.ts                  # + kind "reflection"
├── lib/validation/{reflections,activities}.ts
├── server/actions/{reflections,activities}.ts  # NEW; plan.ts + saveDesiredState
└── server/queries/today.ts                # + registered_activities
tests/
├── unit/{reflections,activity-card,make-habit}.test.ts
└── e2e/{us-desired-state,us-activity-registration,us-make-habit}.spec.ts
```

**Structure Decision**: same single Next.js project; features follow spec 001's folders
(`components/features/*`, `server/actions/*`) and spec 002's theming (`.gl-surface`).

### Delivery order (for /speckit-tasks)

1. Migration 0016 + pgTAP + seed; types regenerated.
2. US1 desired state, reflections, history, offline (MVP).
3. US2 sessions + admin form, registration functions, details page, «يومك» card, organizer views,
   concurrency script.
4. US3 «اجعلها عادة».
5. Export, a11y sweep and screenshots for new routes, quickstart run.

## Complexity Tracking

No constitution violations; nothing to justify.
