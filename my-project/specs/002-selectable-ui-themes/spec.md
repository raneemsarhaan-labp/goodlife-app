# Feature Specification: Selectable Visual Versions («الواجهات الثلاث»)

**Feature Branch**: `claude/brave-rubin-kfvfjs`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Build three selectable visual versions ("themes") of the app's interface,
using Ionic Framework components, based on three supplied designs of the «يومك» (My Day) screen. The
person chooses a version during setup (onboarding) and can change it later." (Full description: the
three versions «زجاجي» Glass Edition, «رحلة يومي» My Day Journey, «زجاج كامل» Full Glass; shared design
language; «يومك» content shown in the designs; Arabic RTL, calm tone, WCAG 2.1 AA with
reduced-transparency and reduced-motion fallbacks, 3-second «يومك», browser-only rendering of the
component framework; the choice follows the person across devices.)

**Design sources** (supplied by the product owner, 2026-11-21): `Glass_Edition_Standalone_1.html`,
`My_Day_Journey_Standalone.html`, `Full_Glass_Standalone.html` — three versions of the same «يومك»
screen in a phone frame.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose my version during setup (Priority: P1)

After joining and seeing the welcome screen, the member is asked how they would like their app to
look. They see the three versions side by side — «زجاجي»، «رحلة يومي»، «زجاج كامل» — each as a
realistic preview of their own «يومك», pick one, and land on «يومك» in that version. Skipping the
step gives them the default version.

**Why this priority**: The choice is the entry point of the feature; without it no member ever sees
the other versions.

**Independent Test**: Join with an invitation code; on the new setup step choose «زجاج كامل»; «يومك»
opens in that version; sign out and back in on another device and it is still «زجاج كامل».

**Acceptance Scenarios**:

1. **Given** a member who has just seen the welcome screen, **When** the setup continues, **Then** a
   "choose your look" step shows the three versions with their names, a one-line description each,
   and a preview.
2. **Given** the choice step, **When** the member selects a version and confirms, **Then** «يومك»
   opens in that version and the choice is saved to their account.
3. **Given** the choice step, **When** the member skips it, **Then** the default version («رحلة يومي»)
   is applied and they can change it later.
4. **Given** a saved choice, **When** the member signs in on another device, **Then** the same version
   is shown there.

---

### User Story 2 - Live my day in any of the three versions (Priority: P1)

Whatever version the member chose, «يومك» shows the same content and works the same way; only the
look differs. Checking a habit, writing an intention, completing the challenge, and closing the day
behave identically in all three versions.

**Why this priority**: The versions are only acceptable if none of them loses content or function.

**Independent Test**: With the same seeded member, open «يومك» in each version and complete the same
day (check two habits, mark the challenge done, close the day); results and stored data are
identical.

**Acceptance Scenarios**:

1. **Given** any version, **When** «يومك» opens, **Then** it shows the greeting with day name, date,
   and journey day; «حالي المنشود»; «عاداتي اليومية» with done count (e.g. ١/٧); «تقدمك اليوم» as a
   percentage; «تحدّي اليوم»; upcoming activities; and the bottom navigation يومي · خطتي · الإحصاءات ·
   المجتمع · المزيد.
2. **Given** «عاداتي اليومية» as a horizontal row of circular habit icons, **When** the member taps a
   habit's circle, **Then** it toggles done (with a visible check mark), the count and «تقدمك اليوم»
   update, and the change is saved exactly as in the current app (including offline).
3. **Given** the habits row, **When** the member expands it, **Then** each habit shows its
   description, weekly progress (e.g. ٥/٧ أيام), and current streak.
4. **Given** «تحدّي اليوم», **When** the member taps «أنجزت التحدّي», **Then** the challenge is marked
   done as today.
5. **Given** the floating + button, **When** the member taps it, **Then** quick actions open (add a
   habit, write today's own challenge, start or close the day).
6. **Given** two members on different versions completing the same actions, **When** their stats and
   monthly figures are compared, **Then** they are recorded identically.

---

### User Story 3 - Change my version later (Priority: P2)

From «حسابي» the member opens "how the app looks", previews the three versions, and switches. The
change applies immediately on this device and follows them to their other devices.

**Why this priority**: People's taste and devices change; a choice made in the first minute should
not be permanent.

**Independent Test**: Switch from «زجاجي» to «رحلة يومي» in «حسابي»; «يومك» re-renders in the new
version without signing out; another signed-in device shows it on next open.

**Acceptance Scenarios**:

1. **Given** «حسابي», **When** the member opens the appearance setting, **Then** the current version
   is marked and the other two can be previewed.
2. **Given** a different version is selected, **When** the member confirms, **Then** every screen
   uses it immediately, with no sign-out and no lost unsaved input.

---

### User Story 4 - The opening ritual «ابدأ يومي» (Priority: P2)

On the first open of the day, versions that include the ritual («رحلة يومي» and «زجاج كامل») greet the
member with a short quote card «من اقتباسات الحياة الطيبة» and an «ابدأ يومي» button that leads into
setting the day's intention. It never appears again the same day once dismissed.

**Why this priority**: It sets the calm tone the designs intend, but the day works without it.

**Independent Test**: First open of the day in «رحلة يومي» shows the quote card; «ابدأ يومي» leads to
the intention step; reopening the app the same day does not show it again.

**Acceptance Scenarios**:

1. **Given** the first open of a day in a ritual version, **When** «يومك» loads, **Then** the quote
   card appears over a softened background with the quote and «ابدأ يومي».
2. **Given** the quote card, **When** the member taps «ابدأ يومي» or closes it, **Then** it disappears
   and does not return that day (on any device).
3. **Given** a member who prefers no ritual, **When** they turn it off in the appearance setting,
   **Then** it is not shown in any version.

---

### User Story 5 - Comfortable for everyone, in every version (Priority: P2)

Members who need higher contrast, less transparency, or less motion get an equally readable
experience in any version: translucent glass surfaces become solid, background imagery is softened,
and animations are reduced, without changing the chosen version's layout.

**Why this priority**: Constitution principle VI requires WCAG 2.1 AA; glassy, image-backed surfaces
are where contrast most often fails.

**Independent Test**: Turn on the device's "reduce transparency" and "reduce motion" settings; each
version still passes automated WCAG 2.1 AA checks, with solid card surfaces and no non-essential
animation.

**Acceptance Scenarios**:

1. **Given** any version, **When** text sits on a translucent card over imagery, **Then** it meets
   4.5:1 contrast (3:1 for large text and icons) at every point of the background.
2. **Given** the device asks for reduced transparency, **When** a glass version renders, **Then** card
   surfaces are solid.
3. **Given** the device asks for reduced motion, **When** any version renders, **Then** blur and
   decorative motion are removed and transitions are instant.

---

### User Story 6 - New «يومك» content from the designs (Priority: P3)

The designs introduce content the current app does not have: a «حالي المنشود» (desired state) card
with a quick «اكتب تأمّلك» reflection field, a card for an activity the member registered for, and
«اجعلها عادة» to turn today's challenge into a daily habit. [NEEDS CLARIFICATION: Is this new content
part of this feature, or should this feature only restyle what already exists and leave new content
for a separate spec?]

**Why this priority**: The versions can ship on existing content; the new content adds value but also
adds data and behavior.

**Independent Test**: (If in scope.) Write a desired state in «خطتي» and see it on «يومك»; add a quick
reflection from the card; turn the day's challenge into a habit and see it in tomorrow's habits.

**Acceptance Scenarios** (if in scope):

1. **Given** a member who wrote their desired state, **When** «يومك» opens, **Then** «حالي المنشود»
   shows it, with a short reflection field that saves to today's reflection.
2. **Given** today's challenge, **When** the member taps «اجعلها عادة», **Then** a new habit with the
   challenge's text is added to their current plan and appears from tomorrow.
3. **Given** an activity the member registered for, **When** «يومك» opens, **Then** a card shows it
   and can be dismissed for the day.

---

### Edge Cases

- **No choice yet** (existing members from before this feature): they get the default version and a
  one-time, dismissible invitation on «يومك» to pick a look.
- **Device can't do blur** (older browsers): glass versions fall back to solid surfaces, the same as
  reduced transparency.
- **Slow connection**: background imagery loads after content; «يومك» is usable before images arrive.
  A low-data mode (device "save data" setting) skips background images in all versions.
- **Offline**: the chosen version is remembered on the device, so «يومك» opens offline in the right
  look; a change made offline is saved when back online.
- **More than seven habits**: the habits row scrolls horizontally; the count shows done/total.
- **No habits / no challenge today**: the same empty and hidden states as today, styled per version.
- **Journey not started or ended**: the same states as today, styled per version.
- **Version removed or renamed later**: members on it fall back to the default with a calm notice.
- **Other roles' screens** (admin panel, facilitator pages): not themed by this feature unless scope
  below says otherwise.

## Requirements *(mandatory)*

### Functional Requirements

**Choosing a version**

- **FR-001**: The app MUST offer exactly three visual versions: «زجاجي» (Glass Edition), «رحلة يومي»
  (My Day Journey), and «زجاج كامل» (Full Glass), each matching its supplied design.
- **FR-002**: Setup MUST include a "choose your look" step after the welcome screen, with a preview of
  each version, its name, and a one-line description; it MUST be skippable.
- **FR-003**: The default version (for skipped setup and existing members) MUST be «رحلة يومي», the
  only version without translucency, as the most readable choice.
- **FR-004**: The chosen version MUST be saved as a per-person preference on the account, apply on
  every device the person signs in on, and be remembered on the device for offline use.
- **FR-005**: Members MUST be able to change version from «حسابي» at any time; the change MUST apply
  immediately without signing out and without losing unsaved input.
- **FR-006**: Each version MUST apply to the screens in scope: [NEEDS CLARIFICATION: Which screens
  get the three versions — only «يومك» and the shared navigation, all member screens, or every screen
  including the facilitator and admin areas?]

**Shared design language**

- **FR-010**: All versions MUST use the same design tokens from the designs: green, terracotta, gold,
  and ink color scales; the warm canvas color; the Cairo Arabic typeface; rounded cards and controls;
  and the same icon family.
- **FR-011**: All versions MUST share the same layout and navigation: bottom navigation يومي · خطتي ·
  الإحصاءات · المجتمع · المزيد and a floating + button; only surfaces, background imagery, and the
  opening ritual differ.
- **FR-012**: Surface treatment per version:
  - «زجاجي»: translucent white cards with frosted blur over a soft painted botanical background.
  - «رحلة يومي»: solid white/cream cards on the plain warm canvas; no blur.
  - «زجاج كامل»: tinted translucent cards with blur over a full botanical image background.

**«يومك» content (all versions)**

- **FR-020**: «يومك» MUST present, in every version: greeting with day name, Gregorian date and journey
  day; the day's intention / «ابدأ يومي»; «عاداتي اليومية»; «تقدمك اليوم»; «تحدّي اليوم» (journey and own
  challenge, still visually distinct per FR-013 of spec 001); upcoming activities; «ختام اليوم».
- **FR-021**: «عاداتي اليومية» MUST show habits as a horizontally scrollable row of labelled circular
  icons with a clear done state and a done/total count, and MUST be expandable to show each habit's
  description, this week's done days out of 7, and its current streak.
- **FR-022**: Each habit MUST be able to show an icon chosen by the member from a curated set; habits
  without one show a default icon.
- **FR-023**: «تقدمك اليوم» MUST show today's habit completion as a percentage, computed from the same
  records as «الإحصاءات» (spec 001 FR-036).
- **FR-024**: The floating + button MUST open quick actions: add a habit, write today's own challenge,
  start the day, close the day.
- **FR-025**: Every action on «يومك» MUST behave and store data exactly as in the current app,
  including offline check-offs and the date rules of spec 001.

**Opening ritual**

- **FR-030**: «رحلة يومي» and «زجاج كامل» MUST show, on the first open of each day, a quote card «من
  اقتباسات الحياة الطيبة» with the day's quote and «ابدأ يومي»; «زجاجي» does not show it by default.
- **FR-031**: Quotes MUST be managed by admins as a list; one quote is shown per day, the same for all
  members on that date.
- **FR-032**: Once dismissed or acted on, the quote card MUST NOT reappear that day on any device; the
  member MUST be able to turn the ritual off.

**Accessibility and performance**

- **FR-040**: Every version MUST meet WCAG 2.1 AA, including text and icon contrast over translucent
  surfaces at every point of the background image.
- **FR-041**: When the device asks for reduced transparency or cannot render blur, glass surfaces MUST
  become solid; when it asks for reduced motion, blur and decorative motion MUST be removed.
- **FR-042**: «يومك» MUST be usable within 3 seconds on a mid-range phone over a typical mobile
  connection in every version; background images MUST NOT block content.
- **FR-043**: All text MUST remain Arabic, right-to-left, and come from the app's message catalog.

**New content (only if in scope — see User Story 6)**

- **FR-050**: Members MUST be able to write a «حالي المنشود» (desired state) in «خطتي»; «يومك» shows it
  with a quick reflection field that saves to today's reflection.
- **FR-051**: «اجعلها عادة» MUST add a habit with the challenge's text to the member's current plan,
  starting the next day.
- **FR-052**: Members MUST be able to register for an activity; «يومك» shows registered activities as a
  dismissible card.

### Key Entities *(include if feature involves data)*

- **Appearance preference**: per user — chosen version (one of three), whether the opening ritual is
  on, when the choice was made (to know who still needs to choose).
- **Visual version**: one of «زجاجي»، «رحلة يومي»، «زجاج كامل»; name, description, preview, whether it
  shows the ritual by default, its surface treatment and background imagery.
- **Daily quote**: admin-managed text with optional source; one is selected per date.
- **Ritual seen**: per user and date — the quote card was dismissed or acted on.
- **Habit icon**: an icon from a curated set, optionally attached to a habit.
- **Desired state** *(if in scope)*: per plan — a short text describing the member's hoped-for day.
- **Activity registration** *(if in scope)*: member ↔ activity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New members complete the "choose your look" step in under 30 seconds, and at least 90%
  of them complete or skip it without help.
- **SC-002**: 100% of «يومك» content and actions are present and behave identically in all three
  versions (checked by running the same scenario in each).
- **SC-003**: «يومك» is usable within 3 seconds on a mid-range phone over a typical mobile connection
  in each version.
- **SC-004**: Automated accessibility checks report 0 WCAG 2.1 AA violations on every in-scope screen
  in each version, with and without reduced transparency and reduced motion.
- **SC-005**: A version change made on one device appears on the person's other device on its next
  open in 100% of tests.
- **SC-006**: In usability sessions, at least 80% of participants say their chosen version feels calm
  and easy to read.

## Assumptions

- The supplied designs are the visual reference; this spec does not require pixel-perfect matching
  of decorative illustrations, which may be replaced with licensed or commissioned art of the same
  style.
- The product owner asked that the versions be built with the Ionic component framework already
  added to the app (spec 001 research §11); the implications are handled in the plan, not here.
- The current app's design (spec 001) is replaced by these versions on the screens in scope; there is
  no fourth "classic" option.
- Icons come from one rounded icon family across all versions; the designs use the same family.
- Quotes ship with a small editable default set in Arabic.
- Dark mode is out of scope for this feature.
- Facilitator and admin screens keep the current design unless FR-006 says otherwise.
