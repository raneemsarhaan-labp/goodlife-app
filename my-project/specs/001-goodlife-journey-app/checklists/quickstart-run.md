# Quickstart validation run

**Date**: 2026-11-21 | **Branch**: `claude/brave-rubin-kfvfjs` | **Where**: cloud development container

The Supabase local stack (`supabase start`) could not run in this container: Docker image pulls
were refused by the registry (data limit / rate limit). Database tests therefore ran on a plain
PostgreSQL 16 + pgTAP with a minimal stand-in for Supabase's `auth`/`storage` schemas
(`npm run db:test:local`, `scripts/local-db/auth_shim.sql`). Everything that needs Supabase Auth,
REST, or Storage (sign-in, all signed-in screens, e2e) is wired into CI (`.github/workflows/ci.yml`),
which runs the real stack, and has **not** been executed yet.

## Automated checks

| Check | Command | Result |
|---|---|---|
| Lint (incl. RTL logical-class rule) | `npm run lint` | Pass |
| Typecheck | `npm run typecheck` | Pass |
| Unit tests | `npm test` | Pass, 46 tests in 11 files |
| Database tests, with seed | `npm run db:test:local` | Pass, 224 assertions in 11 files |
| Database tests, without seed | `npm run db:test:local -- --no-seed` | Pass, 224 assertions |
| Database tests on Supabase | `npx supabase test db` | Not run here (needs Docker); runs in CI |
| Production build | `npm run build` | Pass, 28 pages, service worker bundled |
| End-to-end + axe (12 spec files) | `npm run test:e2e` | Not run here (needs Supabase Auth); runs in CI |

## Checked in a real browser here (production build, phone viewport, no Supabase)

| What | Result |
|---|---|
| `/join` and `/sign-in` render right-to-left with the Arabic font | Pass |
| axe WCAG 2.1 A/AA on `/join`, `/sign-in`, and the join error state | Pass, no violations |
| Signed-out `/` redirects to `/sign-in` | Pass |
| Invalid invitation code shows the Arabic error, keeps the typed value, sets `aria-invalid` | Pass |
| `manifest.webmanifest` (`dir: rtl`, standalone) and `sw.js` are served | Pass |
| Security headers (CSP, Referrer-Policy, Permissions-Policy, nosniff, frame denial) | Pass, no CSP violations during hydration and form actions |

## Manual scenarios (quickstart.md)

| # | Scenario | Status | Covered by |
|---|---|---|---|
| 1 | Join and Today | Not run (needs Supabase) | `tests/e2e/us1-join-today.spec.ts`; `rls_daily.test.sql`, `redeem_invitation.test.sql` pass |
| 2 | Offline check-off | Not run | `tests/e2e/us1-offline.spec.ts`; 7-day rule in `rls_daily.test.sql` passes |
| 3 | Admin setup | Not run | `tests/e2e/us2-admin-setup.spec.ts`; `rls_admin`, `rls_activities` pass |
| 4 | Plan and habits | Not run | `tests/e2e/us3-plan-habits.spec.ts`; `rls_plan` passes |
| 5 | Monthly review | Not run | `tests/e2e/us4-monthly-review.spec.ts`; `month_figures` passes |
| 6 | Stats | Not run | `tests/e2e/us5-stats.spec.ts`; `stats.test.sql` (fixture values) passes |
| 7 | Facilitator privacy | Not run | `tests/e2e/us5-stats.spec.ts`, `us6-community.spec.ts`; `stats`, `rls_daily` pass |
| 8 | Encouragement | Not run | `tests/e2e/us6-community.spec.ts`; `rls_community` passes |
| 9 | Resources | Not run | `tests/e2e/us7-resources.spec.ts`; `rls_resources` passes |
| 10 | Account, roles, install | Not run | `tests/e2e/us8-account.spec.ts`; `account.test.sql` passes |

## To complete validation

Run locally with Docker (`npx supabase start && npx supabase db reset && npm run test:e2e`), or open
a pull request so CI runs the full stack and uploads the `rtl-screenshots` artifact. Then walk the
10 scenarios on a real phone.
