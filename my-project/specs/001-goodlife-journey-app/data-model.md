# Data Model: الحياة الطيبة Journey App

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Date**: 2026-11-21

PostgreSQL (Supabase). All tables have `id uuid pk default gen_random_uuid()`, `created_at`, and
`updated_at` unless noted. RLS is enabled on every table; policies are summarized per entity
(M = member, F = facilitator of the group, A = admin, Self = the owning user).

## Identity and roles

### users (profile; 1:1 with `auth.users`)

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | = `auth.users.id` |
| full_name | text | required, 2–80 chars |
| email | text | required, unique, from auth |
| phone | text? | optional, E.164 |
| gender | enum(`male`,`female`)? | optional |
| city | text? | optional |
| time_zone | text | IANA zone, default detected at onboarding |
| notification_prefs | jsonb | default `{}` (reserved, research §10) |
| active_role | enum(`member`,`facilitator`,`admin`) | must be one of the user's roles |
| deletion_requested_at | timestamptz? | FR-071 |

RLS: Self read/update. Group peers read `id, full_name` only (via view `group_peers`). A read all.

### user_roles

| Field | Type | Rules |
|-------|------|-------|
| user_id | uuid → users | |
| role | enum(`member`,`facilitator`,`admin`) | unique (user_id, role) |

`facilitator` is granted when the user holds ≥1 active facilitator membership; `admin` is granted
only by another admin. RLS: Self read; A read/write.

## Program structure

### cohorts (دفعة)

| Field | Type | Rules |
|-------|------|-------|
| name | text | required, unique, e.g. «الدفعة الثالثة» |
| start_date | date | required; journey day 1 |
| end_date | date | generated: `start_date + 364` |

RLS: M/F read cohorts they belong to; A all.

### groups (مجموعة)

| Field | Type | Rules |
|-------|------|-------|
| cohort_id | uuid → cohorts | required |
| name | text | required, unique within cohort |

RLS: M/F read own groups; A all.

### group_memberships

| Field | Type | Rules |
|-------|------|-------|
| group_id | uuid → groups | |
| user_id | uuid → users | |
| role | enum(`member`,`facilitator`) | |
| started_on | date | required |
| ended_on | date? | null = active |

Constraints: a user has at most one active `member` membership (partial unique index on
`user_id where role='member' and ended_on is null`). Moving a member = end the old row, insert a
new one (keeps history; spec edge case "member moved"). RLS: Self read; F read rows of own groups;
A all.

### invitation_codes

| Field | Type | Rules |
|-------|------|-------|
| code | text | unique, 8 chars, unambiguous alphabet |
| cohort_id, group_id | uuid | group must belong to cohort |
| expires_at | timestamptz | required |
| max_uses | int | ≥1 |
| uses | int | 0..max_uses |
| revoked_at | timestamptz? | |
| created_by | uuid → users | admin |

Redemption happens only through the `redeem_invitation(code)` security-definer function, which
checks validity atomically and creates the membership + `member` role. RLS: A only.

### journey_stages (مرحلة)

`title`, `description`, `from_day int`, `to_day int` (1..365, non-overlapping), `sort_order`.
RLS: all signed-in read; A write.

## Daily practice

### plans (خطتي)

| Field | Type | Rules |
|-------|------|-------|
| user_id | uuid → users | |
| cohort_id | uuid → cohorts | unique (user_id, cohort_id) |
| current_state | text | ≤ 5,000 chars |

`updated_at` drives "last updated" (FR-024). RLS: Self only. No facilitator access.

### focus_areas (مجال)

`plan_id → plans`, `title` (required, ≤ 80), `description?`, `sort_order`. RLS: Self only.

### habits (عادة)

| Field | Type | Rules |
|-------|------|-------|
| user_id | uuid → users | |
| focus_area_id | uuid? → focus_areas | must belong to the same user's plan |
| name | text | required, ≤ 80 |
| description | text? | ≤ 500 |
| sort_order | int | |
| archived_at | timestamptz? | null = active |

State: `active ⇄ archived` (archive/restore, FR-022). RLS: Self only.

### habit_completions

| Field | Type | Rules |
|-------|------|-------|
| habit_id | uuid → habits | |
| user_id | uuid | denormalized for RLS/indexing |
| local_date | date | must be today or yesterday in user's zone at write time |
| client_mutation_id | uuid | unique; makes offline replay idempotent |

Unique (habit_id, local_date). "Unchecked" = row deleted. No `id`/`updated_at` needed beyond PK.
RLS: Self only. Facilitators reach aggregates only through functions (below).

### journey_challenges (تحدّي الرحلة)

`journey_day int` (1..365, unique), `text` (required, ≤ 500). RLS: signed-in read rows where
`journey_day ≤ caller's current journey day`; A write.

### own_challenges (تحدّي ذاتي)

| Field | Type | Rules |
|-------|------|-------|
| user_id | uuid → users | |
| local_date | date | unique (user_id, local_date): at most one per day |
| text | text | required, ≤ 300 |

Editable/removable only while `local_date` is today. RLS: Self only.

### challenge_completions

| Field | Type | Rules |
|-------|------|-------|
| user_id | uuid | |
| local_date | date | today or yesterday |
| kind | enum(`journey`,`own`) | |
| journey_challenge_id | uuid? | required when kind = journey |
| own_challenge_id | uuid? | required when kind = own |
| client_mutation_id | uuid | unique |

Unique (user_id, local_date, kind). RLS: Self only.

### day_entries

| Field | Type | Rules |
|-------|------|-------|
| user_id | uuid | |
| local_date | date | unique (user_id, local_date) |
| intention | text? | ≤ 300; editable on that day |
| reflection | text? | ≤ 1,000 |
| closed_at | timestamptz? | set by «ختام اليوم» |
| closing_message_id | uuid? → closing_messages | |

States: `none → started (intention set) → closed`; habits can be checked in any state.
RLS: Self only.

### closing_messages

`text` (required), `active bool`. RLS: signed-in read; A write.

## Reflection

### review_questions

`text`, `sort_order`, `active bool`. RLS: signed-in read; A write.

### monthly_reviews (مراجعة الشهر)

| Field | Type | Rules |
|-------|------|-------|
| user_id | uuid | |
| month | date | first day of the month; unique (user_id, month) |
| answers | jsonb | `[{question_id, question_text, answer}]` (question text copied) |
| figures_snapshot | jsonb | per-habit rate, journey/own challenge counts, days closed |
| status | enum(`draft`,`completed`) | |
| completed_at | timestamptz? | |

Window: open from the 3rd-last day of `month` through day 7 of the next month for the prompt;
can be completed any time after (FR-030, FR-032). RLS: Self only.

## Community

### encouragement_phrases

`text` (required, ≤ 80), `active bool`, `sort_order`. RLS: signed-in read; A write.

### encouragements (تشجيع)

| Field | Type | Rules |
|-------|------|-------|
| sender_id | uuid → users | |
| recipient_id | uuid → users | ≠ sender; same active group |
| phrase_id | uuid → encouragement_phrases | active phrase only |
| local_date | date | sender's local date |

Unique (sender_id, recipient_id, local_date) (FR-040a). Insert only through
`send_encouragement()` which checks shared group. RLS: sender and recipient read; no update.

## Activities and resources

### activities (نشاط)

| Field | Type | Rules |
|-------|------|-------|
| title | text | required |
| description | text? | |
| starts_at | timestamptz | required |
| ends_at | timestamptz? | > starts_at |
| location | text? | place or meeting link |
| created_by | uuid → users | admin or facilitator |
| cancelled_at | timestamptz? | |

### activity_audiences

`activity_id`, and exactly one of `cohort_id` / `group_id`. RLS: M/F read activities whose
audience includes their group or cohort; F create/update for own groups only; A all.

### resources (مورد)

| Field | Type | Rules |
|-------|------|-------|
| type | enum(`recording`,`file`,`reference`) | |
| title | text | required |
| description | text? | |
| category | text? | |
| sort_order | int | |
| storage_path | text? | private bucket; required for recording/file unless `url` set |
| url | text? | external link (references, outside recordings) |
| audience | enum(`program`,`cohorts`,`groups`) | |

`resource_audiences(resource_id, cohort_id?, group_id?)` for non-program audiences. Download via a
Server Action that checks access and returns a signed URL valid 10 minutes (FR-051).

### guidelines (أعراف الرحلة)

`number` (1..10, unique), `text`. RLS: signed-in read; A write.

## Derived (SQL functions, `security definer`, read-only)

| Function | Returns | Caller |
|----------|---------|--------|
| `journey_day(user_id, local_date)` | int | any (self) |
| `member_stats(from, to)` | per-habit rate, streaks, challenge counts | Self |
| `group_stats(group_id, from, to)` | avg completion, journey-challenge completion, active members | F of group, A |
| `group_member_signals(group_id, from, to)` | per member: last_active, days_closed, completion_rate | F of group, A |
| `month_figures(month)` | snapshot used by monthly review | Self |

"Active" = any habit/challenge completion or day entry on that date. Archived habits count up to
their `archived_at` date and not after.

## Relationships (summary)

```text
cohorts 1─* groups 1─* group_memberships *─1 users 1─* user_roles
users 1─* plans (per cohort) 1─* focus_areas 1─* habits 1─* habit_completions
users 1─* day_entries, own_challenges, challenge_completions, monthly_reviews
journey_challenges 1─* challenge_completions
users (sender/recipient) *─* encouragements *─1 encouragement_phrases
activities 1─* activity_audiences → cohorts | groups
resources 1─* resource_audiences → cohorts | groups
```
