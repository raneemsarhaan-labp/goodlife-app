# Research: «يومك» Content — Desired State, Activity Registration, «اجعلها عادة»

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-22

No open questions remained in the Technical Context; each section below records one design decision
taken against the existing code (spec 001 migrations 0005–0014, spec 002 migration 0015).

## 1. Where «حالي المنشود» lives

- **Decision**: a new column `plans.desired_state` (text, ≤ 2,000), edited in «خطتي» next to «واقعي الآن»
  through the same plan update path as `current_state`.
- **Rationale**: plans are per member *and* per cohort (constitution II: data tied to a journey) and are
  already self-only by RLS (`plans_select_self`), so privacy (FR-006) comes for free. `touch_plan()`
  already maintains "last updated" (spec 001 FR-024).
- **Alternatives**: a separate table (no benefit, one row per plan anyway); reusing `current_state`
  (rejected in clarification Q1).

## 2. Reflections («وقفة تأمل»)

- **Decision**: new table `reflections` (one row per note), inserted only through
  `add_reflection(p_text, p_client_mutation_id)`, which stamps the member's local date, current cohort and
  a copy of the desired-state wording at that moment. Self-only read and delete; no update.
- **Rationale**: clarification Q2 (separate from «ختام اليوم», several a day). A *copy* of the wording
  satisfies the edge case "earlier reflections keep the wording they were written against" without
  versioning the plan. `client_mutation_id` (unique) makes offline replays idempotent, as for habit
  check-offs (0005).
- **Alternatives**: referencing a plan version table (heavier); storing in `day_entries` (one per day,
  rejected by Q2).

## 3. Reflection history

- **Decision**: route `/plan/reflections`, fed by `my_reflections(p_before date, p_days int)`, which merges
  «وقفة تأمل» rows and non-empty `day_entries.reflection` («ختام اليوم») by date, newest first, 30 days per
  page. Linked from the «حالي المنشود» card in «خطتي» and from «يومك».
- **Rationale**: FR-004/FR-005 want both kinds by date, labelled; one function keeps paging and labels in
  one place; `security invoker` so RLS stays the guard.

## 4. Offline reflections

- **Decision**: extend the existing IndexedDB outbox (`src/lib/offline/outbox.ts`) with
  `kind: "reflection"` replayed through a `saveReflection` action. The 7-day replay rule for habits does
  not apply: reflections are dated by the device's local date at writing time, sent with the request,
  and accepted if within the last 7 days, else dated to the arrival date.
- **Rationale**: FR-008 asks for "saved exactly once"; the outbox already provides retries, pending
  badges and idempotency keys.

## 5. Multi-session activities

- **Decision**: new table `activity_sessions(activity_id, starts_at, ends_at?)`. Existing activities are
  back-filled with one session each. `activities.starts_at` / `ends_at` stay and are kept equal to the
  first session start / last session end by trigger, so spec 001 queries (upcoming activities,
  admin list) keep working unchanged (FR-019).
- **Rationale**: least disruption; a single source of truth for sessions.
- **Alternatives**: an array column (no constraints per session); dropping `starts_at` (breaks spec 001).

## 6. Registration settings and the meeting link

- **Decision**: `activities` gains `registration_open boolean default false`, `capacity int?` (1–1,000) and
  `mode enum('in_person','online') default 'in_person'`. The online meeting link goes in a separate table
  `activity_links(activity_id pk, meeting_url)` whose RLS allows admins, the creator, facilitators of an
  audience group, and members with an active registration.
- **Rationale**: FR-014 hides the link from non-registered members; Postgres RLS cannot hide one column
  per row, a side table can. `location` keeps meaning "place" for in-person activities.

## 7. Capacity under concurrency

- **Decision**: `register_for_activity(p_activity)` (security definer, explicit audience check) locks the
  activity row (`select … for update`), counts active registrations, and inserts or re-activates the
  member's row. One row per (activity, member) with `cancelled_at`; unique (activity_id, user_id).
- **Rationale**: row lock serialises competing registrations, so capacity is never exceeded (FR-013,
  SC-004). Tested with 25 parallel sessions in `scripts/db-concurrency-check.sh` (pgTAP cannot run
  concurrent transactions).
- **Alternatives**: serializable isolation with retries (more client logic); an exclusion constraint
  (cannot express a count).

## 8. Registration window

- **Decision**: register and cancel are allowed while the activity is not cancelled and
  `now() < max(session.starts_at)` (clarification Q3); audience rules as `can_see_activity`.

## 9. «يومك» card and closing it

- **Decision**: `get_today()` gains `registered_activities`: for each active registration with a session
  that has not ended — title, mode, next session start/end, `cancelled` (shown only on the local day of
  cancellation). Closing writes `activity_card_dismissals(user_id, activity_id, dismissed_on)` (upsert).
  The card shows when there is no dismissal, or when today is the local date of the next session and
  `dismissed_on < today`.
- **Rationale**: matches FR-016 ("hidden for the rest of the day, back on the next session's day")
  without a scheduler.

## 10. Who sees registrations

- **Decision**: `activity_registrations(p_activity)` returns names and registration time: all for admins;
  for facilitators only members whose active membership is in one of the facilitator's groups. Members
  see only counts (places left).
- **Rationale**: FR-017. Constitution IV limits what facilitators see about members; activity
  registration is not reflective content, and spec 003 FR-017 is the explicit, approved visibility rule
  the constitution requires. Recorded in Constitution Check.

## 11. «اجعلها عادة»

- **Decision**: a link to `/habits/new?from=journey|own`. The server page reads today's challenge text
  itself (not from the URL), shortens it to 80 characters at a word boundary, and passes it as the
  default name with a note «من تحدّي اليوم». The form warns when an active habit has the same name.
- **Rationale**: no new data; reading text server-side avoids URL tampering and length issues; habit
  creation path and validation unchanged (FR-021–FR-023).

## 12. Export and deletion

- **Decision**: `export_my_data()` gains `desired_state` (inside plans), `reflections`, and
  `activity_registrations`. New tables cascade on user deletion.

## 13. UI placement (spec 002 approach)

- **Decision**: the «حالي المنشود» card and the registered-activity card are small client components on
  `.gl-surface` (no Ionic needed), rendered by the server page above the Ionic island, so they appear
  with the first paint in all three versions. «اجعلها عادة» is a link inside `ChallengeCards`. Activity
  details are a new server route `/activities/[id]`; upcoming-activity items link to it.
- **Rationale**: keeps «يومك» first-load JS within the 200 KB budget (spec 002) and follows the token
  theming decided there.
