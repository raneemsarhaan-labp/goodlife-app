# Contract: Server Actions

Every mutation is a Next.js Server Action. Each action: (1) resolves the signed-in user, (2)
checks role and ownership/group membership, (3) validates input with Zod, (4) writes through the
user-scoped Supabase client so RLS applies as a second check. Results use one shape:

```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode; field?: string } // message resolved from messages/ar.json
```

`ErrorCode`: `unauthenticated` · `forbidden` · `not_found` · `invalid_input` · `date_not_editable`
· `code_invalid` · `code_expired` · `code_used_up` · `limit_reached` · `conflict`.

`localDate` is `YYYY-MM-DD`; the server recomputes "today" in the user's time zone and rejects
anything other than today/yesterday with `date_not_editable` where noted.

## Onboarding and account

| Action | Input | Output | Who | Errors |
|--------|-------|--------|-----|--------|
| `checkInvitation` | `{ code }` | `{ cohortName, groupName }` | public | code_invalid, code_expired, code_used_up |
| `completeJoin` | `{ code, fullName, email, phone?, gender?, city?, timeZone }` | `{ userId }` → sends OTP | public | as above, invalid_input, conflict (email exists) |
| `requestSignInCode` | `{ email }` | `{}` (always ok; no account enumeration) | public | — |
| `verifySignInCode` | `{ email, token }` | `{}` sets session | public | invalid_input |
| `updateProfile` | `{ fullName?, phone?, gender?, city?, timeZone? }` | profile | self | invalid_input |
| `switchRole` | `{ role }` | `{ activeRole }` | self holding role | forbidden |
| `requestDataExport` | `{}` | `{ downloadUrl }` (JSON of all own data) | self | — |
| `requestAccountDeletion` | `{}` | `{}` | self | — |

## Today

| Action | Input | Output | Who | Errors |
|--------|-------|--------|-----|--------|
| `setHabitDone` | `{ habitId, localDate, done, clientMutationId }` | `{ doneCount, total }` | habit owner | not_found, date_not_editable |
| `setIntention` | `{ text }` (today) | day entry | self | invalid_input |
| `setOwnChallenge` | `{ text }` (today) / `{ remove: true }` | own challenge | self | invalid_input |
| `setChallengeDone` | `{ kind: 'journey'\|'own', localDate, done, clientMutationId }` | `{}` | self | not_found, date_not_editable |
| `closeDay` | `{ reflection? }` (today) | `{ summary, closingMessage }` | self | invalid_input |

`setHabitDone` and `setChallengeDone` are idempotent: replaying the same `clientMutationId`
returns the current state without a second write (offline outbox, research §4).

## Plan and habits

| Action | Input | Who |
|--------|-------|-----|
| `saveCurrentState` | `{ text }` | self |
| `createFocusArea` / `updateFocusArea` / `deleteFocusArea` | `{ id?, title, description? }` | owner |
| `reorderFocusAreas` | `{ ids: uuid[] }` | owner |
| `createHabit` / `updateHabit` | `{ id?, name, description?, focusAreaId? }` | owner |
| `reorderHabits` | `{ ids: uuid[] }` | owner |
| `archiveHabit` / `restoreHabit` | `{ id }` | owner |

Deleting a focus area unlinks its habits (habits are kept).

## Monthly review

| Action | Input | Output | Who |
|--------|-------|--------|-----|
| `saveReviewDraft` | `{ month, answers[] }` | review | self |
| `completeReview` | `{ month, answers[] }` | review with `figures_snapshot` | self |

## Community and groups

| Action | Input | Who | Errors |
|--------|-------|-----|--------|
| `sendEncouragement` | `{ recipientId, phraseId }` | member sharing an active group with recipient | forbidden, limit_reached (once per recipient per day) |
| `createActivity` / `updateActivity` / `cancelActivity` | `{ id?, title, description?, startsAt, endsAt?, location?, audience: { groupIds?: uuid[], cohortId?: uuid } }` | facilitator (own groups only) or admin (any) | forbidden, invalid_input |

## Resources

| Action | Input | Output | Who |
|--------|-------|--------|-----|
| `getResourceUrl` | `{ resourceId }` | `{ url, expiresAt }` (signed, 10 min) | anyone in the resource's audience; else `not_found` |

## Admin (all require `admin`)

| Action | Input |
|--------|-------|
| `upsertCohort` | `{ id?, name, startDate }` |
| `upsertGroup` | `{ id?, cohortId, name }` |
| `assignFacilitator` / `removeFacilitator` | `{ groupId, userId }` |
| `addMember` / `moveMember` | `{ userId, groupId }` (move ends old membership, starts new) |
| `createInvitations` | `{ cohortId, groupId, count, maxUses, expiresAt }` → codes |
| `revokeInvitation` | `{ id }` |
| `upsertResource` / `deleteResource` / `reorderResources` | resource fields + audience; uploads via signed upload URL |
| `upsertJourneyStage`, `upsertGuideline`, `upsertJourneyChallenge`, `upsertReviewQuestion`, `upsertClosingMessage`, `upsertEncouragementPhrase` | content fields |
| `grantAdmin` / `revokeAdmin` | `{ userId }` (cannot revoke own last admin) |

## Read models (Server Components, not actions)

- `getToday()` → greeting key, date (Gregorian + Hijri), journey day, habits with done state,
  journey challenge?, own challenge?, upcoming activities (7 days), day entry state, review prompt?
- `getMemberStats({ period })`, `getGroupStats({ groupId, period })`,
  `getGroupMemberSignals({ groupId, period })` → SQL functions in data-model.md.
