# Contract: New Server Actions and Routes

Same conventions as spec 001 ([server-actions.md](../../001-goodlife-journey-app/contracts/server-actions.md)):
Zod validation, user-scoped client, RLS as a second check, `Result<T>`.

## Appearance

| Action | Input | Output | Who | Notes |
|--------|-------|--------|-----|-------|
| `setAppearance` | `{ version: 'journey'\|'glass'\|'full_glass', ritual?: boolean, reduceTransparency?: boolean }` | `{}` | self | sets `users.ui_*`, `ui_chosen_at = now()` if null, writes cookie `gl_ui`, revalidates layout |
| `skipAppearanceChoice` | `{}` | `{}` | self | `ui_chosen_at = now()` keeping `journey` (FR-002, FR-003) |
| `dismissRitual` | `{}` | `{}` | self | calls `mark_ritual_seen()`; used by «ابدأ يومي» and close |

## Habits

`createHabit` / `updateHabit` accept `icon?: HabitIconName` (one of the curated names; FR-022).

## Admin content

| Action | Input | Who |
|--------|-------|-----|
| `upsertQuote` | `{ id?, text, source?, sortOrder, active }` | admin |

## Routes

| Route | Screen | Roles |
|-------|--------|-------|
| `/setup/look` | Choose your look (after `/welcome`; skippable) | signed in |
| `/account/appearance` | Change version, ritual on/off, reduce transparency | signed in |
| `/admin/content?tab=quotes` | Daily quotes | admin |

Joining flow: `/join` → `/join/profile` → code → `/welcome` → **`/setup/look`** → `/`.
