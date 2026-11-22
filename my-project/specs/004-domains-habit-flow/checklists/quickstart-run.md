# Quickstart run: Life Domains, Habit Shape and the Add-Habit Flow (T020)

**Date**: 2026-11-22 · **Environment**: cloud container (local PostgreSQL 16 + pgTAP; no Supabase Auth, so
Playwright specs that sign in were not run here; they run in CI).

## Automated checks

| Check | Result |
|-------|--------|
| Lint, typecheck | pass |
| Unit (`npm test`) | 80/80 (17 files; new `days`, icon-list parity with 0017) |
| Database (`npm run db:test:local`, seeded and `--no-seed`) | 323/323; `domains_habits.test.sql` 32 assertions (schedule math, cap, RLS, figures over scheduled days) |
| Capacity script (spec 003) | pass |
| Build | pass |
| «يومك» first-load JS | 168.3 KB gzipped (≤ 200 KB; unchanged — the flow is its own route) |
| e2e | not run here; new `us-add-habit-flow.spec.ts`; spec 001–003 specs updated to add habits through the flow (`addOwnHabit` helper) |

## Rendered checks (dev preview `/dev/add-habit`, Pixel 7, three versions)

- Steps 1–3 render in `journey`, `glass`, `full-glass`; axe: no violations on any step.
- Fixed during the run:
  - **Bug**: on step 2, «التالي» became the submit button within the same click, so the form submitted and
    skipped step 3. The two buttons now have distinct keys, so React replaces the element.
  - Radio groups used list markup (`listitem` violations); now plain groups of radios.
  - Day buttons' accessible names («الإثنين») did not contain their visible labels («إثنين»); the visible
    short name is now the name, with the full name as a tooltip.
  - Terracotta text measured 4.45:1 on the «زجاج كامل» page and 4.32:1 on the own-challenge card. The
    token moved from #A85332 to #9C4B2C (≥ 4.75:1 on every app surface, 6.1:1 with white).
  - The step heading showed a focus ring on first load (StrictMode double effect); focus now moves only
    when the step changes.

## Notes

- Seeded habits stay daily and «أي وقت», so spec 001 stats and ordering e2e expectations hold; they gain
  domains only.
