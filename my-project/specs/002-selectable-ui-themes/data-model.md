# Data Model: Selectable Visual Versions

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Date**: 2026-11-21

Extends spec 001's data model ([data-model.md](../001-goodlife-journey-app/data-model.md)). New
migration `supabase/migrations/0015_ui_versions.sql` (forward-only, constitution v1.2.0).

## users (new columns)

| Field | Type | Rules |
|-------|------|-------|
| ui_version | enum `ui_version` (`journey`, `glass`, `full_glass`) | not null, default `journey` (FR-003) |
| ui_ritual | boolean | not null, default true (FR-032: member can turn the ritual off) |
| ui_reduce_transparency | boolean | not null, default false (research §5: in-app toggle) |
| ui_chosen_at | timestamptz? | null until the member chooses or skips (invitation card for existing members) |

RLS: unchanged (self read/update). Column grant: add `ui_version, ui_ritual, ui_reduce_transparency,
ui_chosen_at` to the self-update grant on `users`.

## habits (new column)

| Field | Type | Rules |
|-------|------|-------|
| icon | text? | one of the curated habit-icon names (check constraint listing ~24 names); null = default icon (FR-022) |

RLS: unchanged (owner, current plan).

## quotes (new)

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | pk |
| text | text | required, 10–400 chars |
| source | text? | ≤ 120 chars (e.g. an author or book) |
| sort_order | int | default 0 |
| active | boolean | default true |
| created_at, updated_at | timestamptz | |

RLS: signed-in read active rows; admin all (FR-031).

## ritual_seen (new)

| Field | Type | Rules |
|-------|------|-------|
| user_id | uuid → users | on delete cascade |
| local_date | date | the member's local date |
| seen_at | timestamptz | default now() |

PK (user_id, local_date). RLS: self only; written only by `mark_ritual_seen()`.

## Derived (SQL functions)

| Function | Returns | Rule |
|----------|---------|------|
| `quote_for_date(p_date date)` | quote row | n-th active quote by `sort_order, id`, n = (p_date − 2026-01-01) mod count (research §8) |
| `today_ritual()` | jsonb `{show, quote}` | `show` = caller's `ui_ritual` and version shows the ritual (`journey`, `full_glass`) and no `ritual_seen` row for the caller's local today |
| `mark_ritual_seen()` | void | inserts (caller, local today); idempotent |

`get_today()` (spec 001) gains `habits[].icon` and, for the expanded habit row (FR-021), per habit:
`week_done` (done days in the last 7 local days) and `current_streak` (from `habit_streaks`).

## Version metadata (static, not stored)

`src/ui/versions.ts`: for each version — id, Arabic name and one-line description (message keys),
`showsRitual`, background asset set, preview image. Changing or removing a version is a code change;
members on a removed version fall back to `journey` (spec edge case).
