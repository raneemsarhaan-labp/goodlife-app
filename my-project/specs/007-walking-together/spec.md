# Feature Specification: Walking Together — Sharing, «مجموعتي», Group Challenge, Community Activities

**Feature Branch**: `claude/brave-rubin-kfvfjs` · **Created**: 2026-11-22 · **Status**: Clarified

**Input**: Roadmap item 007 ([design-gap-inventory.md](../design-gap-inventory.md)).

## Clarifications

### Session 2026-11-22 (product owner)

- **Sharing**: «أظهر هذه العادة لمجموعتي» is off by default; fellow **members** of the group see the
  habit's name and today's state only. Facilitators keep seeing activity signals only (constitution IV).
- **«عادة خاصّة»**: built as designed — the name stays on the device; the server stores a placeholder
  and the completions. Other devices show «عادة خاصّة»; the export contains the placeholder; clearing the
  browser data loses the name. The app says so when the switch is turned on. A private habit cannot be
  shared.
- **Group challenge**: **no ranking** («لوحة الترتيب» is not built; FR-083 stands). Members see the group's
  shared progress as counts («N منكم أتمّوا اليوم») and their own days kept.
- Placement: «مجموعتي» and «التحدّي» are tabs beside «أنا» in «الإحصاءات» (the design's «أثرك»); «المجتمع»
  becomes the full activity list above the group and its encouragements.
- «معروضة» on admin group rows is not built (meaning unclear); group status (open/closed) and tool
  toggles (sharing, encouragement, challenges) are.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Share a habit and walk with peers (Priority: P1)
A member turns on sharing for a habit (in the add flow or edit). «مجموعتي» shows the group hero (name,
«بدأتم معًا في …», member count), «من يمشي معك على العادة نفسها» (each peer's shared habits with today's ✓,
and «N منكم» on habits several share), and «ما تظهره أنت» with the privacy note.

**Acceptance Scenarios**:
1. **Given** member A shares «أذكار الصباح» and does it today, **When** member B of the same group opens
   «مجموعتي», **Then** B sees A with «أذكار الصباح ✓»; unshared habits never appear.
2. **Given** A and B share the same habit (same library suggestion or same name), **Then** it shows «٢ منكم».
3. **Given** the group's facilitator, **When** they open any screen, **Then** no habit names appear.
4. **Given** the admin turned sharing off for the group, **Then** the peers section is hidden.

### User Story 2 - Join a group challenge (Priority: P1)
Admins create a challenge (title, description, domain, the binding habit and its amount, days, start and
length, for a cohort or groups). Members see it in «التحدّي» (current or upcoming), join with «انضمّ», and
get a locked habit flagged «اليوم X من Y» on «يومك»; they see their days kept/missed and the group's counts;
they can «انسحب من التحدّي».

**Acceptance Scenarios**:
1. **Given** an active challenge for the member's cohort, **When** they join, **Then** a habit with the
   challenge's name, amount and days appears on «يومك» with «اليوم X من Y»; its name, amount and days
   cannot be edited.
2. **Given** a joined member, **When** they open «التحدّي», **Then** they see day X of Y, a progress bar,
   «N من Y أيام مكتملة», and «N منكم أتمّوا اليوم» — never names or ranks.
3. **Given** they withdraw, **Then** the habit is archived and the challenge shows «انضمّ» again only if the
   challenge has not ended.
4. **Given** an upcoming challenge, **Then** it shows its start date, length, habit and «انضمّ».

### User Story 3 - «المجتمع» as the activity list (Priority: P2)
«المجتمع» lists all upcoming activities (not only seven days) with «جديد» (added in the last 7 days),
mode, «مسجَّل», presenter, date and time; each expands to details and places left with inline «سجّلني».

**Acceptance Scenarios**:
1. **Given** activities in 3 weeks and tomorrow, **Then** both are listed by next session.
2. **Given** a registration-open activity, **When** «سجّلني» is tapped in the list, **Then** it shows «مسجَّل».

### User Story 4 - «عادة خاصّة» (Priority: P2)
**Acceptance Scenarios**:
1. **Given** «عادة خاصّة» on, **When** saved, **Then** the server keeps «عادة خاصّة» as the name and the real
   name shows only on this device (on «يومك», «خطتي», stats).
2. **Given** another device, **Then** the placeholder shows; completions still sync.
3. **Given** the switch is on, **Then** sharing is disabled and the limits are explained.

### User Story 5 - Group settings (Priority: P3)
Admins open or close a group (closed: its invitation codes stop working) and turn sharing, encouragement
and challenges on or off for the group.

### Edge Cases
- A peer who leaves the group disappears from «مجموعتي».
- Challenge ends: the locked habit stays (archived by the member if they wish); join is no longer offered.
- A member who already has a habit with the challenge's name still gets the locked challenge habit.

## Requirements *(mandatory)*
- **FR-001**: Habits MAY be shared with the group (default off); peers (active members of the same group)
  see name and today's state of shared, non-archived habits scheduled today; facilitators do not.
- **FR-002**: «مجموعتي» shows the hero, peers with shared habits and «N منكم», and the member's own shared
  habits with the note «ولا يرون مجالاتك ولا خطتك ولا ما كتبتَ في وقفات التأمل».
- **FR-003**: Admins create, edit and cancel group challenges (title ≤ 120, description ≤ 1,000, domain,
  habit name ≤ 80, amount ≤ 60, days, start date, 3–90 days, audience cohort or groups).
- **FR-004**: Joining creates a locked habit; withdrawing archives it; members see own progress and group
  counts only; no ranking.
- **FR-005**: «المجتمع» lists all upcoming visible activities with badges, presenter, inline registration.
- **FR-006**: «عادة خاصّة»: placeholder on the server, name on the device, explanation shown, not shareable.
- **FR-007**: Admins set group status and tool toggles; closed groups reject invitation codes.
- **FR-008**: Three versions, Arabic RTL, WCAG 2.1 AA.

## Success Criteria *(mandatory)*
- **SC-001**: In testing, 0 unshared habit names visible to anyone but the owner; 0 shared names visible
  to facilitators.
- **SC-002**: No screen shows a ranking of members.
- **SC-003**: Joining a challenge takes one tap and shows the habit on «يومك» immediately.

## Assumptions
- "Same habit" = same library suggestion, else the same normalised name.
- Group start date = the cohort's start date.
