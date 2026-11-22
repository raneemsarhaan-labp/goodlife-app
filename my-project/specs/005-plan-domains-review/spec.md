# Feature Specification: «خطتي» by Domain, Personal Review Rhythm, Daily Challenge by Domain

**Feature Branch**: `claude/brave-rubin-kfvfjs`

**Created**: 2026-11-22

**Status**: Clarified (decisions in [design-gap-inventory.md](../design-gap-inventory.md))

**Input**: Roadmap item 005: «هويّتي»; per plan domain «من أريد أن أكون», «العلامة» and a review date;
the plan review «من أنت وما تريد» with a member-chosen next review and the «حان موعد مراجعتك» card;
the admin «مكتبة التحدّيات»; «تحدّي اليوم» by the member's domains with a refresh.

**Builds on**: specs 001 (plan, challenges, monthly review), 003 (desired state), 004 (life domains,
plan domains, habit library).

## Clarifications

### Session 2026-11-22

- «هويّتي» is a new private text in «خطتي»; «واقعي الآن» stays (default chosen by the team).
- The program's journey challenge for the day keeps priority. On days without one, the member gets a
  challenge from «مكتبة التحدّيات» drawn from their plan domains (all domains when the plan has none) and
  may ask for another up to three times a day. It occupies the same «تحدّي اليوم» slot, so completion
  counts as the day's challenge in stats; the own challenge is unchanged.
- The plan review is separate from the calendar-month review of spec 001 (FR-030–032), which stays.
- First plan review falls due 30 days after the plan was created unless the member set a date.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - «خطتي» by domain (Priority: P1)

«خطتي» shows «هويّتي» (who I am, a paragraph or two: «فقرةٌ أو فقرتان — الكرّاسة تفصّل، وهنا تُحفظ
الخلاصة»), «حالي المنشود», and «مجالات عملي هذه السنة» as up to three domain cards (icon, name, habit
count). Each card opens to «من أريد أن أكون في هذا المجال», «العلامة التي أعرف بها أني صرتُ», its habits,
and «موعد المراجعة».

**Independent Test**: Write «هويّتي»; for «النفس والبدن» write who-I-want-to-be, the sign and a review date;
reload: all kept; a facilitator sees none of it.

**Acceptance Scenarios**:

1. **Given** a plan with two domains, **When** «خطتي» opens, **Then** two domain cards show with habit
   counts («لا عادة بعد» when none), and an action to add a domain (the add flow's step 1 rules).
2. **Given** a domain card, **When** the member edits who-I-want-to-be, the sign and the review date and
   saves, **Then** they are kept and shown on the card.
3. **Given** «هويّتي» saved, **When** the member exports their data, **Then** it is included with the
   per-domain texts and dates.
4. **Given** a facilitator or admin, **When** they view anything about the member, **Then** none of these
   texts is visible.

---

### User Story 2 - «تحدّي اليوم» by domain, with a refresh (Priority: P1)

On a day without a program challenge, «يومك» shows «تحدّي اليوم» from the library: domain tag, kind
(«فعل» or «تأمّل»), title, prompt, «أنجزت التحدّي», «اجعلها عادة» (prefilled from the challenge's linked
habit and domain), and ↻ «تحدٍّ آخر» (up to three times a day, until it is done). Admins manage «مكتبة
التحدّيات» per domain.

**Independent Test**: With no journey challenge today and plan domains «الصلة بالله» and «النفس والبدن»,
the challenge shown is from those domains; ↻ gives a different one; done counts in stats.

**Acceptance Scenarios**:

1. **Given** a journey challenge exists for today, **When** «يومك» opens, **Then** it is shown as before
   and no library challenge or refresh is offered.
2. **Given** no journey challenge, **When** «يومك» opens, **Then** a library challenge from the plan's
   domains is shown, the same one on every open that day.
3. **Given** the library challenge, **When** the member taps ↻, **Then** a different challenge appears;
   after three refreshes or once done, ↻ is no longer offered.
4. **Given** the member marks it done, **When** they look at stats, **Then** it counts as the day's
   challenge done, and days with a library challenge count as days with a challenge.
5. **Given** a library challenge linked to a habit, **When** «اجعلها عادة» is tapped, **Then** the add flow
   opens at step 2 with the linked habit name and the challenge's domain.
6. **Given** the admin's «مكتبة التحدّيات», **When** they add, edit or deactivate a challenge, **Then**
   members see the change from the next draw; challenges done in the last 14 days are not drawn again.

---

### User Story 3 - Personal plan review «من أنت وما تريد» (Priority: P2)

When the review falls due, «خطتي» and «يومك» show «حان موعد مراجعتك» (with the date the member set). The
review walks through: reread and edit «هويّتي» and «حالي المنشود» («قبل الأرقام»); reread and edit each
domain's who-I-want-to-be and sign; then choose the next review: «بعد شهر» (date shown) or «تاريخٌ آخر».
Saving records the review and hides the card until the next date.

**Independent Test**: Set the next review to today; the card shows; complete the review with «بعد شهر»;
the card disappears and «خطتي» shows the new date.

**Acceptance Scenarios**:

1. **Given** a next review date of today or earlier, **When** «خطتي» or «يومك» opens, **Then** the card
   shows and links to the review.
2. **Given** a plan created 30+ days ago with no date set, **When** «خطتي» opens, **Then** the card shows.
3. **Given** the review's last step, **When** the member picks «بعد شهر» or another date (tomorrow to one
   year ahead) and saves, **Then** the date is kept and the card hides until then.
4. **Given** the review, **When** the member leaves midway, **Then** edits already saved stay and the card
   remains until the review is completed.

### Edge Cases

- Plan with no domains: domain cards are replaced by an invitation to add up to three; challenges are
  drawn from all active domains.
- Library empty or every eligible challenge done in the last 14 days: fall back to any active challenge in
  the domains; if the library is empty, no «تحدّي اليوم» is shown.
- A challenge deactivated after it was drawn today: today's pick stays (it was already shown).
- Journey challenge added by the admin later in the day: it takes the slot from the next open; a library
  completion already recorded for today remains the day's completion.
- Domain review dates are reminders on the card only (no notifications).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: «خطتي» MUST let the member write and edit «هويّتي» (≤ 2,000 characters), private.
- **FR-002**: Each plan domain MUST have editable «من أريد أن أكون في هذا المجال» (≤ 500), «العلامة التي أعرف
  بها أني صرتُ» (≤ 300) and an optional review date; «خطتي» MUST show plan domains as cards with habit counts.
- **FR-003**: Admins MUST manage «مكتبة التحدّيات»: per domain, kind (فعل / تأمّل), title (≤ 200), prompt
  (≤ 300), optional linked habit name (≤ 80), order, active.
- **FR-004**: On a day without a journey challenge, «يومك» MUST show one library challenge per member per
  day, drawn from the member's plan domains (all active domains if none), excluding challenges the member
  completed in the last 14 days, stable across opens that day.
- **FR-005**: The member MUST be able to draw another challenge up to three times a day while not done.
- **FR-006**: Completing a library challenge MUST count as completing the day's challenge in stats and
  reviews; days with an available library challenge MUST count as days with a challenge.
- **FR-007**: «اجعلها عادة» on a library challenge MUST open the add flow at step 2 with the linked habit name
  (or the title) and the challenge's domain.
- **FR-008**: The plan MUST hold a next review date; the review MUST become due on that date, or 30 days
  after the plan's creation when unset.
- **FR-009**: The review «من أنت وما تريد» MUST let the member reread and edit «هويّتي», «حالي المنشود» and each
  domain's texts, then choose the next review («بعد شهر» or a date from tomorrow to one year ahead).
- **FR-010**: «حان موعد مراجعتك» MUST show on «خطتي» and «يومك» while the review is due.
- **FR-011**: The export MUST include «هويّتي», the per-domain texts and dates, and the next review date.
- **FR-012**: All new screens MUST work in the three visual versions, Arabic RTL, WCAG 2.1 AA.

### Key Entities

- **Plan (extended)**: identity, next review date, last reviewed time.
- **Plan domain (extended focus area)**: who I want to be (existing description), sign, review date.
- **Library challenge**: domain, kind, title, prompt, linked habit name, order, active.
- **Daily challenge refreshes**: per member and day, how many times another challenge was drawn.
- **Challenge completion (extended)**: may record a library challenge in the day's challenge slot.

## Success Criteria *(mandatory)*

- **SC-001**: On days without a journey challenge, 100% of members with an active library see a challenge.
- **SC-002**: A drawn challenge is identical on every open the same day (until refreshed).
- **SC-003**: A member completes the plan review in under 5 minutes.
- **SC-004**: 0 plan texts (identity, domain texts) visible to anyone but the member, in testing.
- **SC-005**: New screens pass the accessibility sweep in the three visual versions.

## Assumptions

- Seeded challenge library: the design's three challenges plus a few per domain (about 14).
- Domain review dates show on the domain card only; no reminders.
- The monthly review (spec 001) stays as it is; the plan review does not replace it.
