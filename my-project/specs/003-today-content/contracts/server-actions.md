# Contracts: Server Actions and Routes (spec 003)

All actions return `Result<T>` (spec 001 `src/server/actions/result.ts`), validate with Zod, and rely on
RLS / SQL functions ([data-model.md](../data-model.md)) as the guard.

## Plan

| Action | Input | Result | Errors |
|--------|-------|--------|--------|
| `saveDesiredState` (`src/server/actions/plan.ts`) | `text` ≤ 2,000 | `ok(null)` | `invalid_input`, `forbidden` |

## Reflections (`src/server/actions/reflections.ts`)

| Action | Input | Result | Errors |
|--------|-------|--------|--------|
| `saveReflection` | `{ text 1–500, clientMutationId uuid, localDate? }` (outbox kind `reflection`) | `ok({ id })` | `invalid_input`, `forbidden` (no plan) |
| `deleteReflection` | `id` | `ok(null)` | `not_found` |

## Activities (`src/server/actions/activities.ts`)

| Action | Input | Result | Errors |
|--------|-------|--------|--------|
| `registerForActivity` | `activityId` | `ok(null)` | `forbidden`, `not_found`, `limit_reached` (full), `conflict` (closed) |
| `cancelRegistration` | `activityId` | `ok(null)` | `not_found`, `conflict` (closed) |
| `dismissActivityCard` | `activityId` | `ok(null)` | — |
| `saveActivity` (admin/facilitator, extended) | + `sessions[{startsAt, endsAt?}]` 1–52, `registrationOpen`, `capacity?` 1–1,000, `mode`, `meetingUrl?` https ≤ 500 | `ok({ id })` | `invalid_input`, `forbidden` |

## Routes

| Route | Who | Content |
|-------|-----|---------|
| `/` («يومك») | Member | + «حالي المنشود» card with «وقفة تأمل» form; + registered-activity cards; challenge card gains «اجعلها عادة»; upcoming activities link to details |
| `/plan` | Member | + «حالي المنشود» editor; link to reflection history |
| `/plan/reflections` | Member | reflection history (both kinds, labelled, paged by 30 days), delete «وقفة تأمل» |
| `/activities/[id]` | Audience | details, sessions (past marked), place or link, places left, «سجّلني» / «ألغِ تسجيلي» |
| `/habits/new?from=journey\|own` | Member | add-habit form prefilled from today's challenge |
| `/admin/activities` | Admin | form gains sessions editor, registration settings; list shows registered count |
| `/admin/activities/[id]` | Admin | registrations list |
| `/groups/[id]` | Facilitator | activities of the group with which of its members registered |

## UI contract

- New cards use `.gl-surface` and the spec 002 tokens; they render in all three versions.
- «تمّ حفظ تأمّلك», «سجّلتَ في النشاط», «أُلغي تسجيلك» are announced with `role="status"`; errors with
  `role="alert"`.
- All strings live in `messages/ar.json` under `desiredState`, `reflections`, `activityRegistration`.
