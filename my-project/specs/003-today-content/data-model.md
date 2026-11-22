# Data Model: «يومك» Content

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Date**: 2026-11-22

Extends spec 001 and spec 002 data models. New forward-only migration
`supabase/migrations/0016_today_content.sql`.

## plans (new column)

| Field | Type | Rules |
|-------|------|-------|
| desired_state | text | not null, default `''`, ≤ 2,000 chars (FR-001) |

RLS unchanged (self only). Added to the plan's self-update column grant; `touch_plan()` updates
`updated_at` as for `current_state`.

## reflections (new) — «وقفة تأمل»

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | pk |
| user_id | uuid → users | on delete cascade |
| cohort_id | uuid → cohorts | the member's cohort when written |
| local_date | date | member's local date when written; ≤ today, ≥ today − 7 (offline replay) |
| text | text | trimmed, 1–500 chars (FR-003) |
| desired_state_snapshot | text | copy of `plans.desired_state` at writing time, ≤ 2,000 |
| client_mutation_id | uuid | unique (idempotent replay, FR-008) |
| created_at | timestamptz | default now() |

RLS: select and delete self only; no insert/update grants — written only by `add_reflection()`.
Index (user_id, local_date desc, created_at desc).

## activities (new columns)

| Field | Type | Rules |
|-------|------|-------|
| registration_open | boolean | not null, default false (FR-010, FR-019) |
| capacity | int? | 1–1,000; null = unlimited |
| mode | enum `activity_mode` (`in_person`, `online`) | not null, default `in_person` |

`starts_at` / `ends_at` become derived: set by trigger to the first session start and last session end.

## activity_sessions (new)

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | pk |
| activity_id | uuid → activities | on delete cascade |
| starts_at | timestamptz | required |
| ends_at | timestamptz? | > starts_at |

1–52 sessions per activity; unique (activity_id, starts_at). RLS: read like the parent activity; write
like the parent (admin, or facilitator creator for own groups). Back-filled with one row per existing
activity.

## activity_links (new)

| Field | Type | Rules |
|-------|------|-------|
| activity_id | uuid → activities | pk, on delete cascade |
| meeting_url | text | `https://` URL, ≤ 500 chars |

RLS select: admin, activity creator, facilitator of an audience group, or member with an active
registration (FR-014). Write: as the parent activity.

## activity_registrations (new)

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | pk |
| activity_id | uuid → activities | on delete cascade |
| user_id | uuid → users | on delete cascade |
| registered_at | timestamptz | default now(); reset when re-registering |
| cancelled_at | timestamptz? | set by cancelling |

Unique (activity_id, user_id). Active = `cancelled_at is null`. Written only by
`register_for_activity()` / `cancel_activity_registration()`. RLS select: own rows; admins all;
facilitators through `activity_registrations()` only.

## activity_card_dismissals (new)

| Field | Type | Rules |
|-------|------|-------|
| user_id | uuid → users | on delete cascade |
| activity_id | uuid → activities | on delete cascade |
| dismissed_on | date | member's local date |

PK (user_id, activity_id). Self only; written by `dismiss_activity_card()`.

## SQL functions

| Function | Returns | Rule | Who |
|----------|---------|------|-----|
| `add_reflection(p_text, p_client_mutation_id, p_local_date?)` | reflection id | trims; 1–500; date = given if within 7 days, else today; snapshot desired state; idempotent | Self |
| `my_reflections(p_before date?, p_days int = 30)` | rows (date, kind `pause`/`closing`, text, desired_state_snapshot, id?) | merges reflections and «ختام اليوم» | Self (invoker) |
| `register_for_activity(p_activity)` | void | audience + open + not cancelled + now < last session start + capacity under row lock; raises `forbidden`, `not_found`, `limit_reached` (full), `conflict` (closed) | Member |
| `cancel_activity_registration(p_activity)` | void | own active registration, now < last session start | Member |
| `activity_details(p_activity)` | jsonb | activity, sessions (with `past` flag), places left, my registration, meeting link if allowed | Audience |
| `activity_registrations(p_activity)` | rows (user_id, full_name, group, registered_at) | admin: all; facilitator: own groups' members only | A, F |
| `dismiss_activity_card(p_activity)` | void | upsert today's local date | Self |
| `get_today()` | + `registered_activities[]` | research §9 | Self |
| `export_my_data()` | + `desired_state`, `reflections`, `activity_registrations` | FR-007 | Self |
| `save_activity(...)` | + sessions[], registration_open, capacity, mode, meeting_url | replaces sessions in one transaction | A, F (own groups) |

## State: activity registration

```text
(none) --register--> active --cancel--> cancelled --register--> active
           (window: activity not cancelled and now < last session start; capacity checked on register)
```
