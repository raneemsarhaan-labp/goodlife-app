# Feature Specification: «أثرك ← أنا» Stats

**Feature Branch**: `claude/brave-rubin-kfvfjs` · **Created**: 2026-11-22 · **Status**: Clarified

**Input**: Roadmap item 006 ([design-gap-inventory.md](../design-gap-inventory.md)): consecutive days,
active habits, challenges done, the weekly commitment ring, «خطتي مقابل ما سواها», completion over time
(week by day, month by week, year by month), streaks with one forgiven miss a week («استُعمل الغفران»),
and «أين تعيش حياتك» by domain («التوزيع» / «الالتزام»). Member-only.

**Builds on**: specs 001 (stats, FR-035/036), 004 (domains, schedules), 005 (plan domains).

## Clarifications

### Session 2026-11-22

- Streak grace (product owner): one missed **scheduled** day per calendar week (Saturday–Friday) is
  forgiven; a second miss that week breaks the streak, which restarts quietly. Applies wherever streaks
  show («يومك» detail, stats).
- «يومًا متتاليًا» (overall): consecutive days, ending today or yesterday, with at least one habit done.
- «أين تعيش حياتك» is drawn as labelled bars per domain rather than a colour wheel: the seven domains
  share colour families, so colour alone could not tell them apart (dataviz rule: identity never by colour
  alone). The title and the two views («التوزيع», «الالتزام») follow the design.
- The «مجموعتي» and «التحدّي» tabs belong to spec 007.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Headline figures (Priority: P1)

«الإحصاءات» opens with four tiles for the chosen period: «يومًا متتاليًا», «التزام هذا الأسبوع/الشهر/الرحلة»
(a ring with the %), «عادات نشطة», «تحدّيًا أُنجز».

**Independent Test**: A member who did at least one habit on each of the last 5 days and none the day
before sees «٥ أيام متتالية».

**Acceptance Scenarios**:
1. **Given** habits done on each of the last N days (today or yesterday included), **When** stats open,
   **Then** the consecutive-days tile shows N; a day without any habit done resets it.
2. **Given** a period, **When** stats open, **Then** the ring shows done/possible over scheduled days,
   active habits counts non-archived habits, and challenges done counts the day's challenge slot.

### User Story 2 - Over time and plan vs others (Priority: P1)

Bars show completion % per day (week), per week (month), or per month (journey), with each bar's value on
hover/focus and a table view. «خطتي مقابل ما سواها» compares completion of habits in the plan's domains
with the member's other habits, with a short note.

**Acceptance Scenarios**:
1. **Given** the week period, **When** stats open, **Then** seven bars (Saturday→Friday, future days
   empty) show each day's %; month shows one bar per week; journey one per month.
2. **Given** habits inside and outside plan domains, **When** stats open, **Then** both rates show with
   the note «عاداتك في خطتك أثبت» or «عاداتك الأخرى أثبت هذه الفترة» (or «متقاربتان»).

### User Story 3 - Streaks with grace, and where you live your life (Priority: P2)

«السلاسل» lists each habit's current streak (with grace) and longest streak; a habit whose grace was used
this week shows «استُعمل الغفران». «أين تعيش حياتك» shows for every domain (empty ones too) the number of
habits («التوزيع») or the completion % («الالتزام») with the average.

**Acceptance Scenarios**:
1. **Given** a habit done on every scheduled day except one this week, **When** stats open, **Then** its
   streak continues and shows «استُعمل الغفران»; a second miss that week resets it.
2. **Given** habits in two domains, **When** «التوزيع» is chosen, **Then** all domains are listed with their
   counts (0 for empty); «الالتزام» lists active domains with % and the average.

### Edge Cases
- No habits: tiles show 0; bars and wheel show an empty state.
- Periods are clamped to the journey and today (as spec 001).
- Archived habits count in past rates (as spec 001) but not in «عادات نشطة» or «التوزيع».

## Requirements *(mandatory)*

- **FR-001**: Tiles: consecutive days (≥ 1 habit done per day, ending today or yesterday), commitment % of
  the period, active habits, challenges done.
- **FR-002**: Completion over time: day buckets for ≤ 7 days, Saturday-start weeks for ≤ 31 days, months
  otherwise; each bucket's % = done / scheduled possible; values available on hover/focus and as a table.
- **FR-003**: Plan vs others: rates for habits in plan-domain areas vs all other habits, with a note.
- **FR-004**: Streaks apply one forgiven missed scheduled day per Saturday–Friday week; «استُعمل الغفران»
  shows when used in the current week. This changes the streak definition of spec 001 everywhere.
- **FR-005**: «أين تعيش حياتك»: per active domain, habit count and completion % for the period; average of
  domains with habits.
- **FR-006**: All figures are computed from completions and schedules (spec 001 FR-036); member-only;
  nothing new reaches facilitator views.
- **FR-007**: Three visual versions, Arabic RTL, WCAG 2.1 AA; charts have text alternatives.

## Success Criteria *(mandatory)*
- **SC-001**: Figures equal a hand count over scheduled days in 100% of test cases.
- **SC-002**: Stats load within 3 s on a mid-range phone.
- **SC-003**: Charts pass axe and are fully readable with a screen reader via their tables.

## Assumptions
- Ring and bars use one chart colour (validated with the dataviz validator) on existing surfaces; there is
  no dark mode.
