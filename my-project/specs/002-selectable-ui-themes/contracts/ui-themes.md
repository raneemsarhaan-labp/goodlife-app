# Contract: Themes, Tokens, and Components

How the three versions are expressed in the UI. Screens and components rely only on this contract.

## Theme selection

- `<html lang="ar" dir="rtl" data-ui="journey|glass|full-glass" data-reduce-transparency="true|false">`
  rendered on the server from `users.ui_version` / `users.ui_reduce_transparency`, falling back to the
  `gl_ui` cookie, then `journey`.
- Cookie `gl_ui`: value `journey|glass|full-glass`, path `/`, 400 days, `SameSite=Lax`, `HttpOnly`
  (only the server reads it). Updated whenever the preference changes.

## Tokens (CSS custom properties)

**Shared (all versions)** — from the designs: `--green-100/300/500/700/900`,
`--terracotta-100/300/500/700`, `--gold-100/300/500/700`, `--ink-900/700/500/300/200/100/50`,
`--canvas`, `--surface`, `--success`, `--shadow-sm`, `--shadow-md`, `--radius-card` (20px),
`--radius-pill` (999px), `--font-sans` (Cairo).

**Per version** (set under `[data-ui=…]`):

| Token | journey | glass | full-glass |
|---|---|---|---|
| `--page-bg` | `var(--canvas)` | canvas + painted botanical image | full botanical photo |
| `--card-bg` | `var(--surface)` | `rgb(255 255 255 / .72)` under text | tint per card kind at ≥ .78 under text |
| `--card-blur` | `0` | `18px` | `18px` |
| `--card-border` | `var(--ink-100)` | `rgb(255 255 255 / .6)` | `rgb(255 255 255 / .5)` |
| `--nav-bg` | `var(--surface)` | translucent + blur | translucent + blur |
| `--ritual` | `1` | `0` | `1` |

`[data-reduce-transparency=true]`, `@media (prefers-reduced-transparency: reduce)` and
`@supports not (backdrop-filter: blur(1px))` all set `--card-blur: 0` and opaque `--card-bg`.
`@media (prefers-reduced-motion: reduce)` disables transitions and animated blur.
Ionic variables (`--ion-background-color`, `--ion-item-background`, `--ion-color-primary` =
green-700, `--ion-color-secondary` = terracotta-500, …) are derived from these tokens per version.

## Component catalog (`src/ui/`)

Each is a client component built on Ionic, used by every screen; none branches on the version.

| Component | Built on | Used for |
|---|---|---|
| `AppShell` | `IonHeader`/`IonToolbar` (presentational), page background layer | every screen |
| `BottomNav` | `IonTabBar` + `IonTabButton` (Next router, no Ionic router) | member screens |
| `GlassCard` | `IonCard` + theme surface tokens | all cards |
| `HabitRing` / `HabitRow` | `IonButton` (circular, `aria-pressed`) in a horizontal scroller + `IonAccordion` for details | «عاداتي اليومية» |
| `ProgressCard` | `IonCard` + `IonProgressBar` | «تقدمك اليوم» |
| `ChallengeCard` | `IonCard`, `IonButton` | journey / own challenge (still distinct, spec 001 FR-013) |
| `QuoteModal` | `IonModal` (sheet), `IonButton` | opening ritual |
| `QuickActions` | `IonFab` + `IonFabList` / action sheet | + button |
| `Field`, `TextArea`, `Select`, `Toggle`, `Checkbox` | `IonInput`, `IonTextarea`, `IonSelect`, `IonToggle`, `IonCheckbox` in `IonItem` | all forms |
| `List`, `ListItem` | `IonList` (inset), `IonItem`, `IonLabel`, `IonNote` | lists everywhere |
| `DataTable` | semantic `<table>` on a solid surface (FR-007) | admin tables |
| `VersionPicker` | three live mini-previews (`role="radiogroup"`) | setup and settings |
| `Skeleton` | server-rendered, no Ionic | first paint of each view |

Icons: `src/ui/icons.ts` registry of Material Symbols Rounded SVGs; `IonIcon icon={…}`.

## Screen inventory (all themed, FR-006)

Auth: `/join`, `/join/profile`, `/sign-in`, `/welcome`, **`/setup/look`** (new).
Member: `/`, `/?day=yesterday`, `/day/start`, `/day/close`, `/habits/new`, `/habits/[id]`, `/plan`,
`/stats`, `/reviews`, `/reviews/[month]`, `/community`, `/groups`, `/groups/[id]`, `/resources`,
`/resources/map`, `/resources/guidelines`, `/resources/[type]`, `/more`, `/account`,
`/account/archived-habits`, **`/account/appearance`** (new).
Admin: `/admin`, `/admin/cohorts`, `/admin/cohorts/[id]`, `/admin/invitations`, `/admin/activities`,
`/admin/resources`, `/admin/content` (tabs incl. new **quotes** tab).
Other: not-found page.

Each route = Server Component (data + permission checks, unchanged) → client-only view
(`next/dynamic`, `ssr: false`) with a server-rendered `Skeleton` as `loading`.
