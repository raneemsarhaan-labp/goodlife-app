# Research: الحياة الطيبة Journey App

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-21

The product owner delegated the tech stack choice ("the tool"). Each decision below resolves a
`NEEDS CLARIFICATION` from the plan's Technical Context or a constitution TODO. Versions are the
current releases as of 2026-11-21.

## 1. Application framework

- **Decision**: Next.js 16 (App Router) with React 19 and TypeScript, as one full-stack web app.
- **Rationale**: One codebase serves the member PWA, the facilitator views, and the admin panel.
  Server Components and Server Actions keep data access and permission checks on the server
  (constitution III) without a separate API service. Server rendering of «يومك» gives a fast
  first paint on mid-range phones (SC-003). Large ecosystem and hiring pool.
- **Alternatives considered**:
  - SvelteKit: lighter bundles, smaller ecosystem for RTL/i18n/PWA libraries.
  - SPA (Vite + React) + separate API: two deployables and an extra contract layer for no gain
    at this scale (constitution VI).
  - Native apps: excluded by the spec (installable web app only).

## 2. Database, auth, and file storage

- **Decision**: Supabase: PostgreSQL 17, Supabase Auth (email one-time code), Supabase Storage
  (private buckets with signed URLs). Permissions enforced by PostgreSQL Row Level Security (RLS)
  plus server-side checks in Server Actions.
- **Rationale**:
  - Email OTP sign-in (FR-003) is built in; no password handling.
  - RLS enforces "who sees what" in the database itself, so a bug in one page cannot leak another
    group's data (constitution III, IV; SC-005). Policies are testable in SQL.
  - Private storage + short-lived signed URLs satisfies FR-051 (resources not reachable by direct
    link outside their audience).
  - Managed Postgres, backups, and a local dev stack (`supabase start`) with one CLI.
- **Alternatives considered**:
  - Self-managed Postgres + Auth.js + S3: more moving parts, permission checks only in app code.
  - Firebase: weaker relational model for cohorts/groups/memberships and stats queries.
- **Lock-in mitigation**: schema and policies are plain SQL migrations; Auth and Storage are
  accessed through thin modules in `src/lib/` so they can be swapped.

## 3. Arabic, RTL, and dates

- **Decision**: `next-intl` with a single `ar` locale; `<html lang="ar" dir="rtl">`; Tailwind CSS 4
  using only logical utilities (`ms-*`, `me-*`, `ps-*`, `start-*`, `text-start`); font: IBM Plex Sans
  Arabic (self-hosted via `next/font`); all dates and numbers through one formatter module built on
  `Intl.DateTimeFormat('ar', …)` and `Intl.NumberFormat('ar', …)`.
- **Rationale**: Messages live in `messages/ar.json`, reviewable by a language editor (constitution
  I). Logical CSS makes RTL correct by construction. One formatter decides numerals and calendar.
- **Open product choice (non-blocking)**: Arabic-Indic (٢/٦) vs Latin (2/6) digits. Default:
  Arabic-Indic, as in the spec examples; switchable in the formatter.
- **Hijri date**: shown as secondary text via `Intl` `islamic-umalqura` calendar.
- **Alternatives considered**: `react-i18next` (more setup with App Router); RTL via CSS flipping
  plugins (fragile).

## 4. Installable app and offline (constitution TODO(OFFLINE_SCOPE))

- **Decision**: PWA with a web app manifest and a Serwist (`@serwist/next`) service worker.
  Offline scope for v1:
  - App shell and «يومك» for the current day are cached and open without a connection.
  - Habit and challenge check/uncheck while offline go to an IndexedDB outbox (`idb`) and are
    replayed in order when back online; each mutation carries a client-generated id so replay is
    idempotent (no duplicates, spec edge case).
  - Everything else (plan editing, reviews, admin, community) requires a connection and says so
    calmly.
  - **Late replay rule**: each queued check-off carries `recorded_at` (device time of the tap).
    The server accepts it when its `local_date` is the tap day or the day before in the user's
    time zone, `recorded_at` is not in the future, and it arrives within 7 days of the tap. Older
    entries are refused; the outbox drops them and shows «لم نتمكن من حفظ هذا التسجيل».
    (Decided 2026-11-21, /speckit-analyze finding A1.)
- **Rationale**: Covers the daily-use moment the constitution cares about (V) with the smallest
  offline surface. Idempotent "set state" mutations (`done = true/false` for a date) make
  conflict handling trivial: last write wins per habit per date.
- **Alternatives considered**: full offline-first sync engine (e.g., a local-first DB): large
  complexity for little v1 value.

## 5. Day boundaries and time zones

- **Decision**: Store each user's IANA time zone (auto-detected at onboarding, editable in
  «حسابي»). All per-day records use a `local_date` (`date` type) computed in the user's time zone
  at the moment of action. Journey day = `local_date − cohort.start_date + 1`.
- **Rationale**: Matches the spec rule "midnight to midnight in the member's time zone" and keeps
  queries simple (no timestamp-range math). The server validates that `local_date` is today or
  yesterday in the user's zone (FR-011).
- **Alternatives considered**: storing UTC timestamps only; makes "what day was this" ambiguous
  for travelling users and complicates stats.

## 6. Stats computation

- **Decision**: Compute all figures in SQL views/functions over the raw records
  (`habit_completions`, `challenge_completions`, `day_entries`); no stored counters. Monthly review
  stores a JSON snapshot of the figures at submit time (FR-032).
- **Rationale**: FR-036 (figures never disagree) and SC-004. Volume is small (≈ members × habits ×
  365 rows per year), so on-the-fly aggregation with indexes is fast.
- **Streak definition**: consecutive local dates up to today (or yesterday, if today not yet
  done) with a completion for that habit.
- **Facilitator stats**: exposed only through `security definer` SQL functions that return
  aggregates and the three activity signals (FR-037, FR-043), never raw member rows.
- **Alternatives considered**: materialized views/counters: premature at this scale.

## 7. Testing

- **Decision**:
  - Vitest 5 for unit tests (date/journey-day math, streaks, formatters, validation).
  - pgTAP via `supabase test db` for RLS and SQL function tests: every role × table allow/deny
    pair (constitution III, SC-005).
  - Playwright 1.65 + `@axe-core/playwright` for end-to-end flows on a mobile viewport in RTL, with
    automated WCAG 2.1 AA checks (constitution VI, quality gates).
- **Rationale**: Each constitution gate maps to a concrete, automated check.

## 8. Hosting and operations

- **Decision**: Vercel (or any Node 22+ host) for the Next.js app; Supabase cloud project in a
  region close to the users (e.g., Frankfurt `eu-central-1` or Bahrain if available on the plan).
  Secrets only in environment variables. Migrations via Supabase CLI, reviewed in PRs.
- **Rationale**: Minimal ops for a small team; preview deployments per PR for the RTL screenshot
  review gate.
- **Alternatives considered**: self-hosted containers: more ops, no product benefit now.

## 9. Validation and forms

- **Decision**: Zod 4 schemas shared by forms and Server Actions; Arabic error messages from
  `messages/ar.json`.
- **Rationale**: One source of validation truth; server always re-validates.

## 10. Notifications

- **Decision**: Out of v1 build scope (spec: optional, off by default, design deferred). The data
  model reserves `users.notification_prefs` so it can be added later without migration churn.

## Resolved items

| Item | Resolution |
|------|------------|
| Constitution TODO(TECH_STACK) | §1–3, §7–9 |
| Constitution TODO(OFFLINE_SCOPE) | §4 |
| Time zone / day boundary | §5 |
| Stats consistency | §6 |
