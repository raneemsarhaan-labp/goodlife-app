# Data Model: Life Domains, Habit Shape and the Add-Habit Flow

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Date**: 2026-11-22

New forward-only migration `supabase/migrations/0017_domains_habits.sql`.

## life_domains (new)

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | pk |
| key | text | unique, `^[a-z_]{2,30}$` (stable identifier) |
| name | text | 2–40 chars |
| icon | text | one of the curated habit icons |
| color | enum `domain_color` (`sage`, `dawn`, `gold`, `ink`, `violet`) | colour family token |
| sort_order | int | default 0 |
| active | boolean | default true |

RLS: signed-in read; admin write. Seeded: faith «الصلة بالله», self «النفس والبدن», family «العلاقات
القريبة», work «العمل والرزق», learning «العلم والتعلّم», giving «الإسهام والنفع», leisure «الترويح».

## focus_areas (new column)

| Field | Type | Rules |
|-------|------|-------|
| domain_id | uuid? → life_domains | unique (plan_id, domain_id); ≤ 3 non-null per plan (trigger, `limit_reached`) |

## habits (new columns)

| Field | Type | Rules |
|-------|------|-------|
| domain_id | uuid? → life_domains | set from the focus area's domain when the area has one (trigger) |
| amount | text? | ≤ 60 chars, trimmed; never computed |
| time_of_day | enum `habit_time` (`morning`, `noon`, `evening`, `any`) | default `any` |
| days | smallint | 1–127, bit *d* = weekday *d* (0 Sunday); default 127 |
| library_habit_id | uuid? → habit_library | on delete set null |

Self-update grant extended to `domain_id, amount, time_of_day, days`.

## habit_library (new) — «مكتبة العادات»

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | pk |
| domain_id | uuid → life_domains | required |
| name | text | 1–80 chars |
| amount | text? | ≤ 60 chars |
| hint | text? | ≤ 120 chars |
| icon | text? | curated habit icon |
| sort_order | int | default 0 |
| active | boolean | default true |

RLS: signed-in read active rows; admin all.

## SQL functions

| Function | Change |
|----------|--------|
| `habit_on(days, date)` | new: is the habit scheduled on that date |
| `scheduled_ord(days, date)` | new: count of scheduled days from the epoch through date |
| `habit_rates` | possible = scheduled days; done = completions on scheduled days |
| `habit_streaks` | runs over scheduled days only |
| `my_habit_details` | + `week_scheduled`, `week` (Saturday→Friday) |
| `get_today` | habits filtered by `habit_on(days, date)`; + amount, time_of_day, domain, week, week_scheduled; `habits_total` scheduled only |
| `set_habit_done`, `close_day` | totals count habits scheduled that day |
| `add_plan_domain(domain)` / `remove_plan_domain(domain)` | new: create / delete the domain-linked focus area of the current plan (cap 3) |
