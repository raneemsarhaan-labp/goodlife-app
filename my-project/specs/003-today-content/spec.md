# Feature Specification: «يومك» Content — Desired State, Activity Registration, «اجعلها عادة»

**Feature Branch**: `claude/brave-rubin-kfvfjs`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "Add the three «يومك» content features shown in the product owner's designs
(Glass_Edition, My_Day_Journey, Full_Glass, 2026-11-21) that spec 002 deferred: (1) «حالي المنشود» on
«يومك» with a quick reflection box; reflections private, readable later, included in the export.
(2) Activity registration: members register for and cancel published activities, including
multi-session and online or in-person ones; «يومك» shows a dismissible card for a registered activity;
admins see registrations and can set a capacity; facilitators see which of their members registered.
(3) «اجعلها عادة» on the challenge card turns today's challenge into a habit. Works in all three visual
versions, Arabic RTL, offline-friendly where spec 001 already is, WCAG 2.1 AA."

## Clarifications

### Session 2026-11-22

- Q: Is «حالي المنشود» a new text, or the existing «واقعي الآن» under a new title? → A: A new, separate
  text in «خطتي» (where the member wants to be); «واقعي الآن» stays as is.
- Q: Is «وقفة تأمل» the same as the «ختام اليوم» reflection? → A: No. Separate short notes, several per day
  allowed; the end-of-day reflection is unchanged. Both appear in the member's reflection history.
- Q: Can members register for or cancel a multi-session activity after it has started? → A: Yes, until
  the last session starts.

**Builds on**: [spec 001](../001-goodlife-journey-app/spec.md) (plan, habits, challenges, activities,
export) and [spec 002](../002-selectable-ui-themes/spec.md) (three visual versions; this content was
explicitly deferred there).

**Design sources**: the three standalone design files above. On «يومك» they show, in order: greeting,
«حالي المنشود» (the member's own words, an arrow to the plan, and a reflection field), a card
«نشاط سجّلت فيه · أونلاين — نشاط قراءة: أمراض القلوب — أربعة لقاءات» with a close button, the habit row,
progress, and the challenge card with «أنجزت التحدّي» and «اجعلها عادة». The community screen notes that
others never see «ما كتبتَ في وقفات التأمل».

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See my desired state each day and pause to reflect (Priority: P1)

The member wrote, in «خطتي», the state they want to reach this year («حالي المنشود»), for example «أستيقظ
ولي وقتٌ لنفسي قبل أن يبدأ يومي مع الناس…». Every day «يومك» shows those words near the top, so the day
starts with the member's own direction. Under it, a short field invites a «وقفة تأمل»: a sentence or two
on how today relates to that state. Saving shows «تمّ حفظ تأمّلك». The member can read past reflections
by date. Nobody else can see them.

**Why this priority**: It connects the daily habits to the member's purpose, which is the heart of the
journey (constitution II), and it is the most visible new block in all three designs.

**Independent Test**: A member writes a desired state in «خطتي», sees it on «يومك», saves a reflection,
finds it in their reflection history, and confirms a facilitator of their group cannot see it.

**Acceptance Scenarios**:

1. **Given** a member who has written their desired state, **When** they open «يومك», **Then** the
   «حالي المنشود» card shows their words (long text is shortened with a way to read all of it) and an
   arrow that opens «خطتي» at that text.
2. **Given** a member who has not written a desired state, **When** they open «يومك», **Then** the card
   invites them to write it and leads to «خطتي»; no reflection field is shown yet.
3. **Given** the card, **When** the member writes a reflection and saves it, **Then** the field clears,
   «تمّ حفظ تأمّلك» is announced, and the reflection appears in their history under today's date.
4. **Given** saved reflections, **When** the member opens their reflection history, **Then** they see
   their reflections newest first, grouped by date, with the desired-state wording they reflected on.
5. **Given** a facilitator or a fellow group member, **When** they view anything about this member,
   **Then** no reflection or desired-state text is visible to them.
6. **Given** a member who requests their data export, **When** the export is produced, **Then** it
   includes their desired state and all their reflections.
7. **Given** no connection, **When** the member saves a reflection, **Then** it is kept and saved once
   the connection returns, as habit check-offs are today.

---

### User Story 2 - Register for an activity and see it on «يومك» (Priority: P2)

An admin or facilitator publishes an activity that takes registrations, for example a reading circle
of four online sessions. A member opens it, registers, and from then on «يومك» shows a card «نشاط سجّلت
فيه» with the activity's title, whether it is online or in person, and its next session. The card can be
closed for the day. The member can open the activity to see all sessions and the place or meeting link,
and can cancel their registration.

**Why this priority**: Activities exist since spec 001 but members can only look at them. Registration
lets organizers plan, and the designs give it a prominent card. It depends on organizers, so it comes
after the member-only Story 1.

**Independent Test**: An admin publishes a four-session online activity with 2 places; two members
register, a third sees it full; one cancels and the third can register; registered members see the card
on «يومك» with the next session and the meeting link; the facilitator sees which members registered.

**Acceptance Scenarios**:

1. **Given** an activity that takes registrations and is open to the member's group or cohort, **When**
   the member opens it, **Then** they see its description, all its sessions (date and time in their time
   zone), online or in person, places left if limited, and a «سجّلني» action.
2. **Given** the member registers, **When** they return to «يومك», **Then** a card shows «نشاط سجّلت فيه»,
   online or in person, the title, and the next session's day and time, linking to the activity.
3. **Given** the card, **When** the member closes it, **Then** it stays hidden for the rest of that day
   and returns on the day of the next session.
4. **Given** an online activity, **When** a registered member views it, **Then** the meeting link is
   shown; members who are not registered see that a link is given after registering.
5. **Given** a capacity has been reached, **When** another member opens the activity, **Then** it shows
   as full and registration is not offered; when someone cancels, a place opens again.
6. **Given** a registered member, **When** they cancel before the last session starts, **Then** they
   are removed, the place is freed, and the «يومك» card disappears.
7. **Given** a multi-session activity whose first session has passed, **When** a member opens it before
   the last session starts, **Then** they can still register and see which sessions already took place.
8. **Given** an admin, **When** they open an activity, **Then** they see the registered members and the
   count; a facilitator sees only which members of their own groups registered.
9. **Given** an organizer cancels an activity, **When** a registered member opens «يومك», **Then** the
   card shows the activity as cancelled for that day and then disappears.
10. **Given** an activity whose last session has ended, **When** the member opens «يومك», **Then** no
   card is shown for it.

---

### User Story 3 - «اجعلها عادة»: turn today's challenge into a habit (Priority: P3)

The challenge card offers «اجعلها عادة» next to «أنجزت التحدّي». Tapping it opens the add-habit form with
the challenge text already in the name. The member may pick a focus area as usual. The member edits if they wish, confirms, and the habit joins «خطتي» and
«يومك».

**Why this priority**: Small, and it builds on existing habit creation, but it is a clear bridge from a
one-day challenge to a lasting practice.

**Independent Test**: With today's journey challenge «اقرأ صفحةً واحدةً وقف عند آية», the member taps
«اجعلها عادة», sees the form prefilled, saves, and finds the habit on «يومك» and in «خطتي».

**Acceptance Scenarios**:

1. **Given** today's journey challenge, **When** the member taps «اجعلها عادة», **Then** the add-habit
   form opens with the name prefilled from the challenge (shortened to the habit name limit) and a note
   that it comes from today's challenge.
2. **Given** the member's own challenge, **When** they tap «اجعلها عادة», **Then** the same happens with
   their own text.
3. **Given** the prefilled form, **When** the member saves, **Then** the habit appears on «يومك» and in
   «خطتي»; the challenge itself and whether it was done are unchanged.
4. **Given** the member already has an active habit with the same name, **When** they open «اجعلها
   عادة», **Then** they are told it is already a habit and can still continue or cancel.
5. **Given** the prefilled form, **When** the member cancels, **Then** nothing is created.

### Edge Cases

- Desired state is very long (up to the plan's text limit): «يومك» shows the first lines with «اقرأ المزيد».
- The member edits their desired state: later reflections show the new wording; earlier reflections
  keep the wording they were written against.
- Reflection is empty or only spaces: the save action is disabled.
- Several reflections on the same day: all are kept, in order.
- The member's journey has ended or not started: the desired-state card and reflections remain
  available (they belong to the member, not the day's journey).
- An activity's sessions are edited after members registered: registrations stay; the card and details
  show the new times.
- An activity with no capacity set: unlimited places.
- Capacity is lowered below the number already registered: existing registrations stay; no new ones
  until places open.
- Registration after the first session has started: allowed (registering and cancelling) until the last
  session starts; the member sees which sessions have already taken place.
- A member moves to another group: registrations for activities aimed at the old group stay, but new
  registrations follow the new group's audience.
- Two members take the last place at the same time: exactly one succeeds; the other sees it is full.
- Offline: registering and cancelling need a connection and say so; the «يومك» card shows the last
  known details.
- No challenge today: the «اجعلها عادة» action is not shown.

## Requirements *(mandatory)*

### Functional Requirements

**Desired state and reflections (US1)**

- **FR-001**: «خطتي» MUST let the member write and edit a free-text «حالي المنشود» (the state they want
  to reach), up to 2,000 characters, separate from «واقعي الآن» (spec 001 FR-020), which is unchanged.
- **FR-002**: «يومك» MUST show the «حالي المنشود» card near the top in all three visual versions, with
  the member's text (shortened if long), a link to edit it in «خطتي», and an invitation to write it when
  empty.
- **FR-003**: Members MUST be able to save short reflections («وقفة تأمل», up to 500 characters) from the
  card; each is dated with the member's local date and records the desired-state wording at that time.
- **FR-004**: «وقفة تأمل» entries MUST be separate from the «ختام اليوم» reflection (spec 001), which is
  unchanged; a member MAY save several in one day. The reflection history MUST show both kinds by date,
  each labelled («وقفة تأمل» or «ختام اليوم»).
- **FR-005**: Members MUST be able to read all their reflections, newest first, grouped by date, and
  delete one.
- **FR-006**: Reflections and the desired state MUST be visible only to the member; facilitators, group
  members, and admins' member views MUST NOT show them.
- **FR-007**: The account data export (spec 001) MUST include the desired state and all reflections.
- **FR-008**: Saving a reflection without a connection MUST queue it and save it exactly once when the
  connection returns.

**Activity registration (US2)**

- **FR-010**: Organizers (admins for any audience, facilitators for their own groups, as in spec 001)
  MUST be able to mark an activity as taking registrations, set an optional capacity, and say whether it
  is online or in person.
- **FR-011**: An activity MUST be able to have one or more sessions, each with a start and optional end;
  registering registers for all sessions.
- **FR-012**: Members MUST be able to register for an activity that takes registrations and whose
  audience includes their group or cohort, while places remain, and to cancel their registration; both
  stay possible until the last session starts.
- **FR-013**: Capacity MUST never be exceeded, including when members register at the same moment.
- **FR-014**: For online activities the meeting link MUST be shown only to registered members and
  organizers; for in-person activities the place is shown to everyone in the audience.
- **FR-015**: «يومك» MUST show a card for each registered activity that still has a session ahead: «نشاط
  سجّلت فيه», online or in person, title, and the next session's day and time; it links to the activity.
- **FR-016**: The member MUST be able to close the card for the rest of the day; it MUST come back on the
  day of the next session.
- **FR-017**: Admins MUST see the list and count of registered members per activity; facilitators MUST
  see only which members of their own groups registered.
- **FR-018**: When an activity is cancelled, registered members MUST see it marked cancelled on «يومك» on
  that day, and it MUST then stop appearing.
- **FR-019**: Existing activities from spec 001 MUST keep working as today (shown under upcoming
  activities, no registration) unless an organizer turns registration on.

**«اجعلها عادة» (US3)**

- **FR-020**: The challenge card MUST offer «اجعلها عادة» for today's journey challenge and own challenge
  when present.
- **FR-021**: «اجعلها عادة» MUST open the add-habit form prefilled with the challenge text (within the
  habit name limit); the member may pick a focus area as usual; nothing is saved until they confirm.
- **FR-022**: If an active habit with the same name exists, the form MUST say so before saving.
- **FR-023**: Creating a habit this way MUST NOT change the challenge or its done state.

**Across the feature**

- **FR-030**: All new screens and cards MUST work in the three visual versions (spec 002), in Arabic and
  right-to-left, and meet WCAG 2.1 AA, including text over glass.
- **FR-031**: All new text MUST come from the Arabic message catalogue (constitution I).

### Key Entities

- **Desired state («حالي المنشود»)**: the member's own description of where they want to be this year;
  part of their plan; edited any time; private.
- **Reflection («وقفة تأمل»)**: a short private note by a member, with its local date, the time written,
  and the desired-state wording it responded to.
- **Activity session**: one meeting of an activity, with start and optional end; an activity has one or
  more.
- **Activity registration**: a member's place in an activity, with when they registered and, if so, when
  they cancelled.
- **Activity (extended)**: gains whether it takes registrations, an optional capacity, and online or in
  person (with a meeting link or a place).
- **Dismissed activity card**: that a member closed an activity's «يومك» card on a given day.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member can save a reflection from «يومك» in under 30 seconds, in each visual version.
- **SC-002**: In testing, 0 reflections or desired-state texts are visible to anyone other than their
  author, across all facilitator, community and admin screens.
- **SC-003**: A member can register for an activity in 3 taps or fewer from «يومك» or the activity list.
- **SC-004**: Under simultaneous registration for the last place, registrations never exceed capacity
  (verified with at least 20 concurrent attempts).
- **SC-005**: Registered members see the next session on «يومك» on every day until the activity ends,
  except days they closed the card.
- **SC-006**: Turning a challenge into a habit takes 2 taps when no edits are needed.
- **SC-007**: Within 2 months of release, at least 40% of active members save one or more reflections
  per week (product goal, measured from anonymous counts).
- **SC-008**: All new screens pass the automated accessibility sweep in the three visual versions.

## Assumptions

- Reflection history lives in «خطتي», next to the desired state; the monthly review may link to it.
- When «يومك» shows only the first lines of the desired state, the full text opens in place.
- Reflections can be deleted by their author; there is no editing after saving (they are quick notes).
- Registration is open to the activity's audience without approval; there is no waiting list.
- No reminders or notifications for sessions in this feature (consistent with spec 001's scope).
- Meeting links are entered by organizers; the app does not create meetings.
- Only one «اجعلها عادة» flow: the existing add-habit form, prefilled. The designs' three-step add flow
  (domain → suggestion → details) is not part of this feature.
- Group-member visibility rules from spec 001 (activity signals only) are unchanged.
