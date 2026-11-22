# Contracts: Server Actions and Routes (spec 004)

All return `Result<T>` and validate with Zod; SQL/RLS are the guard.

| Action | Input | Result | Errors |
|--------|-------|--------|--------|
| `createHabit` (extended) | name, description?, domainId?, libraryHabitId?, amount? ≤ 60, timeOfDay, days[] (0–6, ≥ 1), returnTo? | redirect `/` or `/plan` | `invalid_input`, `forbidden` |
| `updateHabit` (extended) | + domainId?, amount?, timeOfDay, days[] | `ok(null)` | `invalid_input`, `not_found` |
| `addPlanDomain` | domainId | `ok({ focusAreaId })` | `limit_reached` (three), `forbidden` |
| `removePlanDomain` | domainId | `ok(null)` | `not_found` |
| `saveLifeDomain` (admin) | id, name, icon, color, sortOrder, active | `ok(null)` | `forbidden`, `invalid_input` |
| `upsertLibraryHabit` (admin) | id?, domainId, name, amount?, hint?, icon?, sortOrder, active | `ok(null)` | `forbidden`, `invalid_input` |

| Route | Change |
|-------|--------|
| `/habits/new` | 3-step add flow; `?from=journey\|own` starts at step 2 prefilled; `?returnTo=plan&area=` preselects the domain |
| `/habits/[id]` | edit form gains domain, amount, time of day, days |
| `/` | habits grouped by time of day; detail week circles + «سجّل اليوم» |
| `/admin/content?tab=domains`, `?tab=library` | new admin tabs |
