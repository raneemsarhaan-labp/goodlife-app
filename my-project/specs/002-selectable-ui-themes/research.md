# Research: Selectable Visual Versions

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-21 | Builds on spec 001 ([research](../001-goodlife-journey-app/research.md), §11 Ionic)

Inputs: the three supplied designs (rendered and measured in a browser), the current app, and a
working Ionic showcase in the app (`/dev/ionic`).

## Findings from the designs

All three designs share one token set and one layout; they differ only in surfaces and backgrounds.

| | «رحلة يومي» (Journey) | «زجاجي» (Glass) | «زجاج كامل» (Full Glass) |
|---|---|---|---|
| Card surface | solid `#FFFFFF` | white at ~40–42% over blur | tinted (white / green-100 / terracotta-100 at ~42–55%) over blur |
| Backdrop blur | none | 14–18px | 16–18px |
| Page background | plain canvas `#F7F4ED` | soft painted botanical illustration | full botanical photo |
| Opening quote card | yes | no | yes |
| Radii | 16 / 20 / 999px | 16 / 22 / 999px | 16 / 20 / 999px |

Shared tokens (from the designs' `:root`): `green-100/300/500/700/900` (#DCE6DF, #96AFA0, #2E4A3D,
#1F3329, #12201A), `terracotta-100/300/500/700` (#FBE3D6, #EBA98A, #D6764F, #A85332),
`gold-100/300/500/700` (#FBEDD1, #F0CD84, #DBA649, #AD7E2E), `ink-900…50` (#1B2B22 … #F0EFE8),
`canvas` #F7F4ED, `surface` #FFFFFF, `success` #4C7A52, two shadow levels. Fonts: **Cairo** (Arabic),
Nunito (Latin). Icons: **Material Symbols Rounded**.

## 1. One component set, three themes

- **Decision**: Build each screen once with Ionic components and the shared design tokens. A version is
  a **theme**: a set of CSS custom properties selected by `data-ui="journey|glass|full-glass"` on
  `<html>` (surface color/opacity, blur, borders, background image, Ionic `--ion-*` variables).
  Components never branch on the version, except the ritual (FR-030), which reads a flag.
- **Rationale**: FR-011 says layout and navigation are shared; FR-025/SC-002/SC-007 require identical
  behaviour. One component set makes parity structural instead of something to test three times.
  Constitution VI (simplicity).
- **Alternatives**: three separate component trees (triples work and drift); runtime CSS-in-JS
  themes (extra runtime, no benefit over custom properties).

## 2. Applying the chosen version without a flash

- **Decision**: The server reads the preference and renders `<html data-ui=…>` directly:
  `users.ui_version` for signed-in users (already loaded by `getCurrentUser`), mirrored in a
  long-lived first-party cookie `gl_ui` so signed-out screens and the service-worker-cached «يومك»
  render the right theme before any data loads. Changing the version updates the profile and the
  cookie, then refreshes.
- **Rationale**: no flash of the wrong theme; works offline (FR-004); follows the person across devices
  (SC-005).
- **Alternatives**: localStorage + client script (flash, not shared across devices).

## 3. Ionic and server rendering

- **Finding**: `@ionic/react` does not support server rendering; rendering Ionic on the server causes
  hydration mismatches (verified in `/dev/ionic`).
- **Decision**: Each route stays a Server Component that loads data and checks permissions (unchanged,
  constitution III), then renders a **client-only view** (`next/dynamic` with `ssr: false`) built with
  Ionic. The dynamic import's `loading` component is a server-rendered, theme-aware **skeleton** with
  the same layout, so the first paint is immediate and the view swaps in without layout shift.
  `<html suppressHydrationWarning>` covers Ionic's mode classes.
- **Routing**: Next.js App Router stays the router. Ionic's router (`IonReactRouter`,
  `IonRouterOutlet`, `IonTabs`) is **not** used; navigation components are presentational and call the
  Next router. Page transitions come from the View Transitions API where supported, disabled under
  reduced motion.
- **Alternatives**: Ionic's hydrate/SSR build of web components (only officially supported for Angular;
  high risk); dropping SSR entirely (blank first paint, worse SC-003).

## 4. JavaScript budget for SC-003

- **Finding**: with `setupIonicReact` in the root layout, one shared chunk containing Ionic is ~215 KB
  gzipped and loads on every page, including sign-in.
- **Decision**:
  - Move Ionic setup into the client views' entry (loaded only by views), not the root layout.
  - Enable `experimental.optimizePackageImports: ["@ionic/react", "ionicons"]` so only used components
    are bundled; import components individually.
  - Budget: ≤ 200 KB gzipped JavaScript for «يومك»'s first load per version; enforced by the
    performance e2e test (spec 001 T138) extended to each version, plus a bundle-size check in CI.
  - Background images are not in the critical path (see §6).
- **Rationale**: SC-003 / constitution V.

## 5. Glass surfaces, contrast, and fallbacks

- **Decision**:
  - Glass = `backdrop-filter: blur()` behind a surface color whose **minimum opacity under text** is
    chosen so body text reaches 4.5:1 against the darkest and lightest regions of that version's
    background (Glass ≥ 0.72 white under text blocks; Full Glass ≥ 0.78 tint). Decorative areas of a
    card may be more transparent than text areas.
  - `@supports not (backdrop-filter: blur(1px))` → solid surfaces.
  - **Reduced transparency**: honored from `prefers-reduced-transparency` where supported **and** from
    an in-app toggle (iOS Safari does not expose the media query). Both switch glass to solid.
  - **Reduced motion**: `prefers-reduced-motion` removes blur animation, parallax, and transitions.
  - Admin tables and long forms always sit on solid surfaces (FR-007).
- **Verification**: axe in each version, plus a contrast sampler in e2e that screenshots text regions
  and checks the rendered pixels (axe cannot see through backdrop blur over images).
- **Alternatives**: no glass for text at all (diverges from the designs).

## 6. Background imagery

- **Decision**: Backgrounds are pre-sized AVIF/WebP assets (mobile and desktop sizes) under
  `public/ui/`, applied as a fixed, low-priority layer (`fetchpriority="low"` preload hint after
  content, CSS `image-set`). With `Save-Data` (header or `navigator.connection.saveData`) the image is
  skipped and a soft gradient of the same palette is used. Images are licensed or commissioned art in
  the designs' style (spec assumption); placeholders extracted from the supplied designs are used only
  for development until final art arrives.
- **Rationale**: FR-042 (images never block content), edge case "slow connection".

## 7. Typography and icons

- **Decision**: Switch the app font to **Cairo** (self-hosted from `@fontsource/cairo` 5.3, OFL-1.1;
  Arabic + Latin subsets, weights 400/600/700) to match the designs; Nunito is not added (Cairo's
  Latin is used for the few Latin strings).
- **Icons**: **Material Symbols Rounded** as SVGs from `@material-symbols/svg-400` (Apache-2.0),
  imported individually into a typed icon registry (`src/ui/icons.ts`) and rendered via `IonIcon`
  (`icon` = SVG data URL). The curated habit-icon set (FR-022) is ~24 icons from this registry.
  ionicons is kept only as Ionic's internal dependency.
- **Rationale**: matches the designs (FR-010); individual SVG imports keep the bundle small.
- **Alternatives**: the Material Symbols variable font (several MB, or a subsetting build step).

## 8. Daily quote

- **Decision**: Admin-managed `quotes` list; the quote for a date is chosen deterministically —
  the n-th active quote by sort order, where n = days since 2026-01-01 modulo the count — so all
  members see the same quote on the same date with no scheduled job. "Seen today" is stored per user
  and local date so it does not reappear on another device (FR-032).
- **Alternatives**: a scheduled daily pick (needs a job), random per member (contradicts FR-031).

## 9. Choosing the version: setup and settings

- **Decision**: New route `/setup/look` after `/welcome` (joining flow) and `/account/appearance`
  (later changes), both showing three live mini-previews rendered by the same view components at
  reduced scale with sample data. Existing members without a choice (`ui_chosen_at` null) see a
  one-time, dismissible invitation card on «يومك».

## 10. Testing strategy

- **Decision**: Every e2e spec of feature 001 runs in all three versions via a Playwright project per
  version (`ui-journey`, `ui-glass`, `ui-full-glass`) that sets the `gl_ui` cookie and the
  account preference (SC-007). Additional: axe per screen per version with and without reduced
  transparency/motion (SC-004); the contrast sampler; visual snapshots of «يومك» per version for
  design review; the perf test per version (SC-003).

## Resolved items

| Item | Resolution |
|---|---|
| Ionic and SSR | §3 client-only views + server skeleton |
| SC-003 with Ionic | §4 budget, lazy setup, optimized imports |
| Glass contrast and fallbacks | §5 |
| Assets and slow networks | §6 |
| Font and icon family | §7 |
| Quote selection | §8 |
