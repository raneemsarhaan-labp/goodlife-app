# Data Model: «خطتي» by Domain, Review Rhythm, Challenge by Domain

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-22 | Migration `0018_plan_domains_review.sql`.

## plans (new columns)
| Field | Type | Rules |
|-------|------|-------|
| identity | text | not null default `''`, ≤ 2,000 |
| next_review_on | date? | tomorrow … today + 365 when set by the review |
| last_reviewed_at | timestamptz? | set by `complete_plan_review` |

Self-update grant extended to `identity`.

## focus_areas (new columns)
| Field | Type | Rules |
|-------|------|-------|
| sign | text? | ≤ 300 («العلامة التي أعرف بها أني صرتُ») |
| review_on | date? | optional domain review date |

`description` (≤ 500) is «من أريد أن أكون في هذا المجال» on domain areas.

## challenge_library (new) — «مكتبة التحدّيات»
| Field | Type | Rules |
|-------|------|-------|
| id | uuid | pk |
| domain_id | uuid → life_domains | required |
| style | enum `challenge_style` (`action` «فعل», `reflection` «تأمّل») | default `action` |
| title | text | 2–200 |
| prompt | text? | ≤ 300 |
| habit_name | text? | ≤ 80 («يصير عادة: …») |
| sort_order | int | default 0 |
| active | boolean | default true |

RLS: signed-in read active; admin all.

## daily_challenge_refreshes (new)
| Field | Type | Rules |
|-------|------|-------|
| user_id | uuid → users | pk part, cascade |
| local_date | date | pk part |
| refreshes | smallint | 0–3 |

Self read; written by `refresh_challenge()`.

## challenge_completions (new column)
| Field | Type | Rules |
|-------|------|-------|
| library_challenge_id | uuid? → challenge_library | on delete set null; only with `kind = 'journey'`; the journey slot holds a journey **or** library challenge |

## Functions
| Function | Rule |
|----------|------|
| `library_challenge_for(user, date)` | research §3 (internal) |
| `refresh_challenge()` | today, no journey challenge, not done, refreshes < 3 → +1 |
| `set_challenge_done` | journey slot: journey challenge, else today's library challenge |
| `get_today` | + `library_challenge` {id, title, prompt, style, habit_name, domain {id, name, icon, color}, done, can_refresh} when no journey challenge; + `plan_review_due` |
| `period_figures`, `group_stats` | days with a challenge = journey day or active library (research §4) |
| `complete_plan_review(p_next date)` | caller's current plan; validates the date |
| `export_my_data` | + identity, next_review_on, focus-area sign/review_on |
