# Feature Specification: Life Domains, Habit Shape and the Add-Habit Flow

**Feature Branch**: `claude/brave-rubin-kfvfjs`

**Created**: 2026-11-22

**Status**: Clarified (decisions in [design-gap-inventory.md](../design-gap-inventory.md))

**Input**: "Proceed with the rest of features" — roadmap item 004 from the design gap inventory: seven
life domains; plan domains (up to three); habits with domain, amount, time of day and repeat days; all
figures respect the schedule; the 3-step add-habit flow with the admin habit library; «يومك» grouped by
time of day; weekday circles and «سجّل اليوم» in the habit detail.

**Builds on**: specs [001](../001-goodlife-journey-app/spec.md) (plan, focus areas, habits, stats,
reviews), [002](../002-selectable-ui-themes/spec.md) (three versions, habit row), [003](../003-today-content/spec.md)
(«اجعلها عادة»).

## Clarifications

### Session 2026-11-22

- Habits may now repeat on chosen weekdays. This replaces spec 001's assumption "habits are daily only".
  Every "possible days" figure (today's total, completion %, streaks, weekly progress, monthly figures,
  group aggregates) counts only the habit's scheduled days.
- Amount is free text that defines when the habit counts as done («مقدار يحدّد الفعل»). It is never
  counted or tracked (design copy: «لا يُحسب ولا يُتتَّبع»).
- Removing a domain from the plan deletes its focus area; the habits keep their domain and stay active.
- The sharing switch and «عادة خاصّة» belong to spec 007 and are not part of this feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a habit through domains and suggestions (Priority: P1)

The member taps + → «عادة جديدة». Step 1 «اختر المجال» shows the plan's domains («من مجالات خطّتك», up
to three, as cards) and the other domains («مجالات أخرى», as rows); + moves a domain into the plan and −
takes it out. Step 2 «اختر العادة» shows «مقترحات جاهزة» for that domain (name, optional amount tag,
one-line hint, icon) and «عادة من عندي» (name and optional description). Step 3 «خصّص عادتك» sets an
optional amount, the time of day (الصباح / الظهيرة / المساء / أي وقت) and the repeat days (all seven by
default, «الأفضل أن تكون يوميّة»). Saving adds the habit to «يومك» in its time-of-day group and to
«خطتي» under its domain when that domain is in the plan.

**Why this priority**: It is the main way habits enter the journey and the most-used flow in the designs.

**Independent Test**: Pick «النفس والبدن», choose «مشي ٢٠ دقيقة», set «المساء» and five days, save;
the habit shows under «المساء» on «يومك» on a chosen day, is absent on an unchosen day, and appears under
«النفس والبدن» in «خطتي».

**Acceptance Scenarios**:

1. **Given** a member with two plan domains, **When** they open the add flow, **Then** step 1 shows two
   domain cards and the remaining domains as rows, each with its icon.
2. **Given** step 1, **When** the member taps + on a row while the plan has fewer than three domains,
   **Then** the domain joins the plan cards; with three already, they are told the plan holds three.
3. **Given** step 1, **When** the member taps − on a plan domain, **Then** it moves to «مجالات أخرى»; if
   its description in «خطتي» is not empty they confirm first; its habits keep their domain.
4. **Given** a chosen domain, **When** step 2 opens, **Then** the active library suggestions for that
   domain are listed in order; selecting one fills the name; «عادة من عندي» opens name and description.
5. **Given** step 3, **When** the member saves with no changes, **Then** the habit is daily, «أي وقت»,
   with no amount.
6. **Given** a habit set to Sunday–Thursday, **When** «يومك» is opened on Friday, **Then** it is not
   listed and not counted in today's total.
7. **Given** «اجعلها عادة» on a challenge (spec 003), **When** it is tapped, **Then** the flow opens at
   step 2 with the challenge text as «عادة من عندي».
8. **Given** the member deselects every day, **When** they try to save, **Then** they are asked to keep at
   least one day.

---

### User Story 2 - «يومك» and figures follow the schedule (Priority: P1)

«يومك» lists today's scheduled habits in time-of-day groups (الصباح, الظهيرة, المساء, أي وقت), skipping
empty groups. The habit detail shows the amount, one circle per day of the current week (done, missed,
not scheduled, today), the weekly progress as done/scheduled («٤/٥ أيام»), the streak, and «سجّل
اليوم». Completion rates, streaks and monthly figures count only scheduled days.

**Why this priority**: Without it, repeat days would make every figure wrong.

**Independent Test**: A habit scheduled on 5 of 7 days and done on all 5 shows 100% for the week, a
weekly «٥/٥», and an unbroken streak across the unscheduled days.

**Acceptance Scenarios**:

1. **Given** habits with different times, **When** «يومك» opens, **Then** they appear under their group
   headings in the order الصباح، الظهيرة، المساء، أي وقت, and by the member's order within a group.
2. **Given** an expanded habit, **When** the member looks at the week, **Then** each day of the week
   (Saturday first) shows done, missed, not scheduled, or upcoming, and today is marked.
3. **Given** the expanded habit, **When** the member taps «سجّل اليوم», **Then** today's check-off toggles
   exactly as tapping the circle does, offline included.
4. **Given** a habit done on every scheduled day with unscheduled days between, **When** stats are
   viewed, **Then** its current streak counts the scheduled days without breaking.
5. **Given** monthly figures and group aggregates, **When** they are computed, **Then** possible days
   count only scheduled days (facilitators still see aggregates only).

---

### User Story 3 - Admins manage domains and the habit library (Priority: P2)

In «لوحة الإدارة ← المحتوى», admins rename, reorder, re-icon and hide life domains, and manage «مكتبة
العادات»: per domain, suggestions with name, optional amount, one-line hint, icon, order and active.

**Why this priority**: The flow works with the seeded library; editing it is needed but less frequent.

**Independent Test**: Add a suggestion to «العلم والتعلّم», hide another; a member sees the new one and
not the hidden one in step 2.

**Acceptance Scenarios**:

1. **Given** the library tab, **When** the admin adds a suggestion, **Then** members see it in step 2 of
   its domain in the set order.
2. **Given** a suggestion set inactive, **When** members open step 2, **Then** it is not listed; habits
   already made from it are unchanged.
3. **Given** a hidden domain, **When** members open step 1, **Then** it is not offered; plans and habits
   that already use it keep it.
4. **Given** a non-admin, **When** they try to change domains or the library, **Then** they are refused.

---

### User Story 4 - Edit a habit's shape (Priority: P3)

From «خطتي» (habit edit), the member changes the domain, amount, time of day and repeat days. Past
completions stay; figures use the new schedule from then on.

**Independent Test**: Change a daily habit to three days; it disappears from «يومك» on other days.

**Acceptance Scenarios**:

1. **Given** a habit, **When** the member edits its days, **Then** «يومك» follows the new days at once.
2. **Given** a habit linked to a plan domain, **When** its domain changes to a non-plan domain, **Then**
   it leaves that domain in «خطتي» and appears under «عادات بلا مجال».

### Edge Cases

- Existing habits from specs 001–003: daily, «أي وقت», no amount; domain from their focus area when that
  area is linked to a domain; otherwise none.
- Existing free-text focus areas stay as they are; they do not count toward the three plan domains and
  can be linked to a domain from «خطتي».
- A habit not scheduled today is still reachable in «خطتي»; the yesterday tab lists habits scheduled
  yesterday.
- Changing days does not rewrite history; past figures are computed with the current days (assumption).
- A completion recorded on an unscheduled day (e.g. before a schedule change) is kept but not counted.
- Library suggestion with an icon outside the curated set falls back to the default icon.
- The plan already has three domains and the member chooses a non-plan domain in step 1: the habit is
  created with that domain but outside the plan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST hold an ordered list of life domains (initially الصلة بالله، النفس والبدن،
  العلاقات القريبة، العمل والرزق، العلم والتعلّم، الإسهام والنفع، الترويح), each with a name, icon, colour
  family, order and active flag, managed by admins.
- **FR-002**: A plan MUST hold at most three domain-linked focus areas («مجالات خطتي»); free-text areas
  from spec 001 are allowed and not counted.
- **FR-003**: Each habit MAY have a domain, an amount (≤ 60 characters, free text, never computed), a time
  of day (morning, noon, evening, any; default any) and repeat days (one or more weekdays; default all).
- **FR-004**: A habit linked to a focus area that has a domain MUST carry that domain.
- **FR-005**: Adding a habit MUST follow three steps: domain (with + / − to change plan domains),
  suggestion or own habit, customisation; Back keeps earlier choices; the add flow replaces the spec 001
  form, and «اجعلها عادة» opens it at step 2 prefilled.
- **FR-006**: «يومك» MUST list only habits scheduled for the shown day, grouped by time of day, and its
  totals and percentage MUST count only those.
- **FR-007**: The habit detail MUST show the amount, the current week's days (done, missed, not
  scheduled, upcoming), weekly progress as done/scheduled, the current streak and «سجّل اليوم».
- **FR-008**: Completion rates, streaks, weekly progress, monthly figures and group aggregates MUST count
  only scheduled days; streaks MUST skip unscheduled days.
- **FR-009**: Admins MUST manage «مكتبة العادات»: per domain, suggestions with name (≤ 80), optional
  amount (≤ 60), hint (≤ 120), icon (curated set), order and active.
- **FR-010**: Members MUST be able to edit a habit's domain, amount, time of day and repeat days.
- **FR-011**: All new screens MUST work in the three visual versions, Arabic RTL, WCAG 2.1 AA.

### Key Entities

- **Life domain**: name, icon, colour family, order, active.
- **Plan domain**: a focus area linked to a life domain (at most three per plan).
- **Habit (extended)**: domain, amount, time of day, repeat days, and the library suggestion it came from.
- **Library habit**: domain, name, amount, hint, icon, order, active.

## Success Criteria *(mandatory)*

- **SC-001**: A member adds a habit from a suggestion in under 30 seconds and 4 taps or fewer after +.
- **SC-002**: For habits with repeat days, completion %, streaks and monthly figures equal a hand count
  over scheduled days in 100% of test cases.
- **SC-003**: «يومك» never lists a habit on a day it is not scheduled (verified across all 7 weekdays).
- **SC-004**: Admin changes to the library appear for members on their next open of the flow.
- **SC-005**: New screens pass the accessibility sweep in the three visual versions.

## Assumptions

- The week starts on Saturday in all week displays (as elsewhere in the app).
- Seeded library: the design's suggestions (about 30 across six domains); «الترويح» starts empty.
- Domain colours use the existing token families (sage, dawn, gold, ink, violet); no new colours.
- Reminders at the chosen time of day are out of scope (no notifications, spec 001).
