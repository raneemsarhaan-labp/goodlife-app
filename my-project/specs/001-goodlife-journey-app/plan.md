# Implementation Plan: الحياة الطيبة (The Good Life) Journey App

**Branch**: `001-goodlife-journey-app` (git: `claude/brave-rubin-kfvfjs`) | **Date**: 2026-11-21 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-goodlife-journey-app/spec.md`

## Summary

An Arabic-first RTL, installable web app for a year-long cohort-based personal development
journey: members live the day on «يومك» (intention, habits, journey challenge + own challenge,
close-out), build a yearly plan, reflect monthly, and see their stats; facilitators follow their
groups through aggregate stats and activity signals only; admins run cohorts, groups,
invitations, activities, content, and resources.

Technical approach (see [research.md](./research.md)): one Next.js 16 full-stack app (React 19,
TypeScript, Server Components + Server Actions) on Supabase (PostgreSQL with Row Level Security,
email one-time-code Auth, private Storage with signed URLs). Arabic RTL via `next-intl` and
Tailwind CSS 4 logical utilities; PWA via Serwist with an IndexedDB outbox for offline habit and
challenge check-offs. All stats computed in SQL from raw records.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 22 LTS+; SQL (PostgreSQL 17)

**Primary Dependencies**: Next.js 16.4, React 19.3, `@supabase/supabase-js` 2.x + `@supabase/ssr`,
`next-intl` 4, Tailwind CSS 4, `@serwist/next` 9, `idb` 8, Zod 4

**Storage**: Supabase PostgreSQL 17 (RLS on every table); Supabase Storage private buckets for
recordings and files

**Testing**: Vitest 5 (unit), pgTAP via `supabase test db` (RLS + SQL functions), Playwright 1.65
+ `@axe-core/playwright` (e2e, mobile RTL viewport, WCAG 2.1 AA)

**Target Platform**: Current mobile browsers (Android Chrome, iOS Safari 17+) and desktop
browsers; installable PWA; hosted on Vercel (or any Node host) + Supabase cloud

**Project Type**: Web application (single full-stack Next.js project)

**Performance Goals**: «يومك» interactive ≤ 3 s on a mid-range phone over 4G (SC-003); habit
check-off reflects instantly (optimistic) and persists ≤ 1 s online; stats pages ≤ 2 s for a full
year of data

**Constraints**: Arabic only, RTL by construction; permission checks server-side + RLS; no
personal data in logs; offline open of «يومك» and offline check-offs (research §4); WCAG 2.1 AA

**Scale/Scope**: v1 sized for ≈ 2,000 members, ≈ 100 groups, ≈ 10 concurrent cohorts; ≈ 30
screens; ≈ 25 tables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.1.0 — evaluated before research and re-evaluated after Phase 1 design.

| Principle | Gate | Pre-research | Post-design | Evidence |
|-----------|------|--------------|-------------|----------|
| I. Arabic first, RTL | Arabic-only UI, RTL by construction, strings in translation files, one date/number formatter | PASS | PASS | research §3; `messages/ar.json`; `src/lib/format.ts`; Tailwind logical utilities only (lint rule) |
| II. Annual journey is the centre | Every feature maps to day → month → year; «يومك» is home; stats derived from records | PASS | PASS | spec US1–US8 all tied to the journey; route `/` = «يومك»; research §6, data-model derived functions |
| III. Roles enforced on server | Server checks per request; least privilege; automated test per permission rule | PASS | PASS | contracts/server-actions.md (check → validate → RLS); pgTAP allow/deny suite; 404 for forbidden routes |
| IV. Privacy of personal reflection | Reflective content private; facilitator sees activity signals only; export + deletion; no PII in logs | PASS | PASS | data-model RLS "Self only" for plans, habits, day entries, own challenges, reviews; `group_member_signals()` returns 3 signals only; `requestDataExport`, `requestAccountDeletion` |
| V. Installable, mobile-first PWA | Manifest + service worker; mobile-first; offline «يومك»; ≤ 3 s | PASS | PASS | contracts/routes.md PWA section; research §4; SC-003 performance goal |
| VI. Simplicity, calm, accessibility | WCAG 2.1 AA; simplest solution; calm tone, optional reminders | PASS | PASS | one deployable; no custom backend; axe in e2e; preset-encouragement community; no gamification |
| Constraints: tech stack | TODO(TECH_STACK) resolved | RESOLVED | — | research §1–3, §7–9 → constitution amendment follows (see below) |
| Constraints: secrets, resources, migrations | Env-only secrets; signed URLs; reviewed reversible migrations | PASS | PASS | research §8; `getResourceUrl`; `supabase/migrations/` |
| Workflow gates | Constitution Check in plan; roles named in spec; tests before merge; PR review | PASS | PASS | this section; quickstart automated checks |

**Result**: no violations; Complexity Tracking not needed.

**Follow-up (governance)**: research resolves constitution `TODO(TECH_STACK)` and
`TODO(OFFLINE_SCOPE)`. Record them in the constitution with `/speckit-constitution` (MINOR bump to
1.2.0) before implementation starts.

## Project Structure

### Documentation (this feature)

```text
specs/001-goodlife-journey-app/
├── plan.md              # This file
├── research.md          # Phase 0: stack and design decisions
├── data-model.md        # Phase 1: tables, rules, RLS, derived functions
├── quickstart.md        # Phase 1: setup + validation scenarios
├── contracts/
│   ├── routes.md        # Screens, routes, role access, navigation, PWA
│   └── server-actions.md# Mutations: inputs, outputs, permissions, errors
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (inside `my-project/`)

```text
src/
├── app/
│   ├── (auth)/              # join, join/profile, welcome, sign-in
│   ├── (member)/            # «يومك» (/), day/start, day/close, plan, habits, reviews, stats,
│   │                        # community, resources, more, account
│   ├── (facilitator)/       # groups, groups/[id]
│   ├── admin/               # cohorts, invitations, activities, resources, content
│   ├── layout.tsx           # <html lang="ar" dir="rtl">, font, providers
│   ├── manifest.ts          # PWA manifest
│   └── sw.ts                # Serwist service worker
├── components/
│   ├── ui/                  # buttons, sheets, cards, bottom nav (RTL, accessible)
│   └── features/            # today/, plan/, habits/, review/, stats/, community/, admin/
├── server/
│   ├── actions/             # Server Actions per contracts/server-actions.md
│   ├── queries/             # read models (getToday, stats, …)
│   └── auth.ts              # current user, role guard
├── lib/
│   ├── supabase/            # server/browser clients (thin wrapper, research §2)
│   ├── format.ts            # Arabic dates (Gregorian + Hijri), numbers
│   ├── journey.ts           # journey day, local date, greeting
│   ├── offline/outbox.ts    # IndexedDB outbox + replay
│   └── validation/          # Zod schemas
└── i18n/                    # next-intl config
messages/
└── ar.json                  # all UI strings
supabase/
├── migrations/              # schema, RLS policies, SQL functions
├── seed.sql                 # quickstart seed
└── tests/                   # pgTAP: rls_*.sql, stats_*.sql, fixtures/
tests/
├── unit/                    # Vitest
└── e2e/                     # Playwright + axe
public/
└── icons/                   # PWA icons
```

**Structure Decision**: a single Next.js project in `my-project/` (where Spec Kit lives). Front end
and server logic share one deployable; the database layer (schema, RLS, SQL functions, pgTAP
tests) lives in `supabase/`. No separate backend service (constitution VI).

## Complexity Tracking

No constitution violations to justify.
