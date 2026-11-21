# Quickstart run: Selectable Visual Versions (T055)

**Date**: 2026-11-21 · **Environment**: cloud container (local Postgres 16 + pgTAP; no Supabase Auth,
Storage or mail viewer, so Playwright specs that sign in could not run here).

## Automated checks

| Check | Command | Result |
|-------|---------|--------|
| Lint | `npm run lint` | pass |
| Types | `npm run typecheck` | pass |
| Unit | `npm test` | 53/53 pass (13 files; includes `ui-versions`, `habit-icons`, message keys) |
| Database | `npm run db:test:local` | 246/246 pass (12 files; `ui_versions.test.sql` 22 assertions) |
| Build | `npm run build` | pass; new routes `/setup/look`, `/account/appearance` |
| JS budget | `npm run check:bundle` | «يومك» first-load 163.1 KB gzipped (≤ 200 KB); Ionic island lazy |
| e2e (3 versions) | `npm run test:e2e` | **not run here** (needs `supabase start`); runs in CI |

## Rendered checks done here (dev server, `/dev/ionic` and `/sign-in`, Pixel 7 viewport)

- `data-ui` follows the `gl_ui` cookie: `journey`, `glass`, `full-glass`.
- No console or page errors in any version (fixed: IonIcon could not parse URL-encoded SVG data URLs;
  the generator now emits raw `;utf8,<svg…>` markup).
- Background art loads in «زجاجي» and «زجاج كامل» (fixed: the auth proxy redirected `/ui/*`).
- Ionic lists inside cards take the card surface (fixed: they painted solid white).
- Text contrast measured on rendered pixels (worst pixel behind the text):

| Text | journey | glass | full-glass |
|------|---------|-------|------------|
| Page intro (off-card) | 8.84 | 6.02 | 4.65 |
| Page title | 13.51 | 9.22 | 7.56 |
| Habit label on card | 14.84 | 14.30 | 13.25 |
| Ionic secondary text on card | 5.44 | 5.25 | 4.85 |

  Fixed on the way: Ionic's default secondary text (#999, 2.5–2.9:1) now maps to ink-500; a per-version
  page scrim keeps off-card text ≥ 4.5:1 over the «زجاج كامل» photo.

## Manual scenarios

Scenarios 1–9 in [quickstart.md](../quickstart.md) need a signed-in member and are covered by the new
e2e specs (`ui-setup`, `ui-parity`, `ui-appearance`, `ui-ritual`, `ui-contrast`, `ui-backgrounds`,
per-version `a11y-all-routes`, `perf-today`, `screenshots`). To be run with `supabase start` locally or
in CI.
