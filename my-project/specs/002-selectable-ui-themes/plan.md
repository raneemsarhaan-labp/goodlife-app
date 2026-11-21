# Implementation Plan: Selectable Visual Versions («الواجهات الثلاث»)

**Branch**: `002-selectable-ui-themes` (git: `claude/brave-rubin-kfvfjs`) | **Date**: 2026-11-21 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-selectable-ui-themes/spec.md`; user input for
`/speckit-plan`: "the UI".

## Summary

Rebuild the whole interface (every screen, all roles) once with Ionic components on the designs'
shared tokens (Cairo, Material Symbols Rounded, green/terracotta/gold/ink), and express the three
versions — «رحلة يومي» (solid), «زجاجي» (frosted glass over painted art), «زجاج كامل» (tinted glass over
a botanical photo) — as CSS themes selected by `data-ui` on `<html>`. The choice is made in a new setup
step, changed in «حسابي», stored on the account and mirrored in a cookie for flash-free and offline
rendering. Routes stay Server Components for data and permissions; each renders a client-only Ionic
view behind a server-rendered skeleton (Ionic React has no SSR). «يومك» gets the designs' layout:
circular habit row with expandable details, progress card, challenge cards, floating quick actions,
and the daily quote ritual. Data changes are small: three preference columns, a habit icon, quotes,
and "ritual seen".

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 22; SQL (PostgreSQL 17) — unchanged from spec 001

**Primary Dependencies**: existing stack (Next.js 16, React 19, Supabase, next-intl, Tailwind 4,
Serwist) + `@ionic/react` 9 (installed), `@fontsource/cairo` 5.3 (new), `@material-symbols/svg-400`
0.49 (new)

**Storage**: Supabase PostgreSQL — migration `0015_ui_versions.sql` ([data-model.md](./data-model.md))

**Testing**: Vitest; pgTAP (`ui_versions.test.sql`); Playwright with one project per version
(`ui-journey`, `ui-glass`, `ui-full-glass`) running all e2e specs, axe with/without reduced
transparency and motion, a contrast sampler for glass, the per-version performance test, and visual
snapshots of «يومك»

**Target Platform**: unchanged (mobile and desktop browsers, installable PWA)

**Project Type**: web application (single Next.js project) — unchanged

**Performance Goals**: «يومك» usable ≤ 3 s per version (SC-003); ≤ 200 KB gzipped JS on «يومك» first
load (research §4); background images never block content

**Constraints**: Ionic views client-only (research §3); WCAG 2.1 AA incl. text over glass (research §5);
Arabic RTL; no behaviour change versus spec 001 (SC-007)

**Scale/Scope**: 3 versions × ~35 screens built once (one component set); ~14 shared UI components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.2.0.

| Principle | Gate | Pre-research | Post-design | Evidence |
|-----------|------|--------------|-------------|----------|
| I. Arabic first, RTL | Arabic UI, RTL by construction, strings in messages, one formatter | PASS | PASS | Ionic follows `dir="rtl"` (verified in `/dev/ionic`); Cairo font; version names/descriptions in `messages/ar.json`; logical CSS only |
| II. Annual journey is the centre | No change to journey rules or data scoping | PASS | PASS | Data actions and SQL unchanged; versions are presentational (contracts/ui-themes.md) |
| III. Roles enforced on server | Server checks per request | PASS | PASS | Routes remain Server Components doing auth and data; client views are presentational; new actions validated + RLS |
| IV. Privacy | Personal content stays private; no PII in logs | PASS | PASS | Preferences are self-only columns; `ritual_seen` self-only; no analytics added |
| V. Installable, mobile-first, ≤ 3 s, offline «يومك» | Budget and offline | RISK → PASS with mitigation | PASS | Client-only Ionic is the risk; mitigations: server skeleton, lazy Ionic setup, optimized imports, 200 KB budget gate, images off the critical path, theme from cookie for SW-cached page (research §2–§4, §6) |
| VI. Simplicity, calm, accessibility | WCAG 2.1 AA; simplest solution; calm | PASS (justified) | PASS | One component set + 3 token themes, not three UIs; reduced transparency/motion fallbacks; contrast sampler; see Complexity Tracking |
| Constraints: tech stack | Added technology justified in the plan | PASS | PASS | Ionic (spec 001 research §11 + this research §3–4), Cairo (§7), Material Symbols (§7) |
| Constraints: data | Forward-only reviewed migration; backup before release | PASS | PASS | New migration `0015`; release checklist applies |
| Workflow gates | Tests before merge, RTL screenshots | PASS | PASS | e2e per version; screenshots per version uploaded by CI |

**Result**: no violations. Complexity is recorded below because three versions are, by nature, more
than one.

## Project Structure

### Documentation (this feature)

```text
specs/002-selectable-ui-themes/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── ui-themes.md     # Theme selection, tokens, component catalog, screen inventory
│   └── server-actions.md# New actions and routes
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (inside `my-project/`)

```text
src/
├── ui/                          # NEW: the shared component set (client, Ionic)
│   ├── theme/
│   │   ├── tokens.css           # shared tokens from the designs
│   │   ├── journey.css          # [data-ui=journey]
│   │   ├── glass.css            # [data-ui=glass]
│   │   ├── full-glass.css       # [data-ui=full-glass]
│   │   └── fallbacks.css        # reduced transparency / motion / no-blur
│   ├── versions.ts              # version metadata (research §2, data-model)
│   ├── icons.ts                 # Material Symbols Rounded registry + habit icon set
│   ├── IonicRoot.tsx            # setupIonicReact, loaded by views only (research §4)
│   ├── clientView.tsx           # helper: next/dynamic ssr:false + Skeleton
│   ├── components/              # AppShell, BottomNav, GlassCard, HabitRow, ProgressCard,
│   │                            # ChallengeCard, QuoteModal, QuickActions, form fields,
│   │                            # List, DataTable, VersionPicker, Skeleton
│   └── views/                   # one client view per screen (TodayView, PlanView, …, admin/*)
├── app/                         # routes stay; pages fetch data and render views
│   ├── (auth)/setup/look/       # NEW
│   └── (member)/account/appearance/  # NEW
├── server/actions/appearance.ts # NEW
└── server/queries/today.ts      # + icon, week_done, current_streak, ritual
public/ui/                       # background art per version (AVIF/WebP, sizes)
supabase/migrations/0015_ui_versions.sql
supabase/tests/ui_versions.test.sql
tests/e2e/ (existing specs run per version) + ui-*.spec.ts (new)
```

Existing `src/components/**` screens are replaced by `src/ui/views/**` as each area is migrated;
the old components are deleted at the end (no dead code).

**Structure Decision**: one Next.js project; a new `src/ui/` layer holds the theme, the Ionic-based
component set, and the client views; routes keep their server responsibilities.

### Implementation note (2026-11-21): what was actually built

Building every screen as a client-only Ionic view (above) was replaced during implementation by a
lighter design that meets the same requirements:

- **Every screen is themed by tokens, not rewritten.** The existing server-rendered primitives
  (`Card`, `Button`, `Field`, `EmptyState`, `BottomNav`, …) use the shared surfaces `.gl-surface` /
  `.gl-surface-strong` / `.gl-nav`, whose look comes from the version tokens. All member,
  facilitator and admin screens (FR-006) therefore change with `data-ui`, and keep server rendering,
  no skeleton flash, and no extra JavaScript. Admin keeps solid surfaces via `[data-area=admin]`
  (FR-007).
- **Ionic is used where the designs need it**, in client-only islands loaded with `clientView`:
  the «يومك» island (`src/ui/views/TodayIsland.tsx`: `HabitRow`, `ProgressCard`, `ActivitiesCard`,
  `QuickActions` (`IonFab`), `QuoteModal` (`IonModal`)). Greeting, day tabs, intention, review
  prompt and «ختام اليوم» stay server-rendered around it.
- **`BottomNav` stays a semantic `<nav>` of links**, themed with `.gl-nav` and Material Symbols,
  instead of `IonTabBar` (page navigation, no Ionic router).
- Themes live in `src/ui/theme/versions.css` (one file, three `[data-ui]` blocks) rather than three
  files; Ionic variables are mapped once in `tokens.css`.
- Seeded users have **no** version choice; e2e selects the version per Playwright project with the
  `gl_ui` cookie (the account wins only after a choice).
- Text colour on terracotta buttons uses `--terracotta-700` (#A85332, 5.3:1); `--terracotta-500`
  (3.2:1 with white) is for graphics only. Off-card text over the backgrounds is protected by a
  per-version `--page-scrim`.

Measured: first-load JS of «يومك» 163.6 KB gzipped (budget 200 KB); the Ionic island loads after.

### Delivery order (for /speckit-tasks)

1. Foundation: tokens + three themes + fallbacks, Cairo, icons, `IonicRoot`, `clientView`, skeletons,
   preference columns + cookie + `<html data-ui>`; `/setup/look`, `/account/appearance`.
2. «يومك» in the designs' layout (MVP), ritual + quotes, habit icons.
3. Remaining member screens.
4. Facilitator pages, admin panel (solid data surfaces).
5. Per-version e2e, axe, contrast sampler, perf, visual snapshots; remove old components.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Three visual versions | Explicit product-owner requirement (spec FR-001) | A single theme does not meet the requirement; three separate UIs would triple the work, so versions are themes over one component set |
| Client-only rendering of views | `@ionic/react` has no SSR (research §3) | Server-rendering Ionic causes hydration errors; Ionic's hydrate build is unsupported for React |
| Vendored Tailwind preflight | Tailwind's reset erases Ionic's internal spacing (spec 001 commit `7fa7837`) | Per-component overrides do not scale across ~40 Ionic components |
