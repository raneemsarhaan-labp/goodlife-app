# Quickstart run: «يومك» Content (T033)

**Date**: 2026-11-22 · **Environment**: cloud container (local PostgreSQL 16 + pgTAP; no Supabase Auth,
Storage or mail viewer, so Playwright specs that sign in were not run here; they run in CI).

## Automated checks

| Check | Command | Result |
|-------|---------|--------|
| Lint | `npm run lint` | pass |
| Types | `npm run typecheck` | pass |
| Unit | `npm test` | 72/72 pass (16 files; new: `reflections`, `activity-card`, `make-habit`, plurals) |
| Database | `npm run db:test:local` (seeded and `--no-seed`) | 291/291 pass; `today_content.test.sql` 45 assertions |
| Capacity under load | `bash scripts/db-concurrency-check.sh` | 25 parallel registrations for 2 places → 2; 40 for 5 → 5 |
| Build | `npm run build` | pass; new routes `/plan/reflections`, `/activities/[id]`, `/admin/activities/[id]` |
| JS budget | `npm run check:bundle` | «يومك» 168.3 KB gzipped (≤ 200 KB; 163.6 KB before this feature) |
| e2e | `npm run test:e2e` | **not run here**; new specs `us-desired-state`, `us-activity-registration`, `us-make-habit`; a11y sweep, screenshots, contrast and export specs extended |

## Rendered checks done here (dev server `/dev/ionic`, Pixel 7, three versions)

- The «حالي المنشود» card and the «نشاط سجّلت فيه» card render in `journey`, `glass`, `full-glass`.
- Contrast measured on rendered pixels (worst pixel behind the text): desired-state text ≥ 12.5:1,
  reflection prompt ≥ 8.4:1, «تأمّلاتي» link ≥ 11.9:1, activity card labels ≥ 8.6:1.
- axe (WCAG 2.1 A/AA): no violations in the new cards in any version.

## Fixed during the run

- Zod was shipped to the browser through a shared constant (+25.7 KB on «يومك»); limits moved to
  `src/lib/limits.ts`.
- Counts in plural messages showed Western digits; they now pass `n` formatted with Arabic digits.
- Ionic's `ion-note` grey (text step 350) was below 4.5:1; mapped to ink-500 like the other steps.

## Not covered here

- Remaining axe findings on `/dev/ionic` are in the older IonButton demo (outline/clear button text on
  the «زجاج كامل» photo); the app's screens do not use those button styles. Dev-only page.
- The concurrency script runs against the local test database, not in CI.
