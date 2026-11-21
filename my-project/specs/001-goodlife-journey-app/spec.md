# Feature Specification: الحياة الطيبة (The Good Life) Journey App

**Feature Branch**: `claude/brave-rubin-kfvfjs`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Build \"الحياة الطيبة\" (The Good Life), an Arabic-first, right-to-left app
that guides participants through a structured, year-long personal development journey. Participants
build daily habits, set a yearly plan, and reflect on their progress, both on their own and as part
of a cohort-based group led by a facilitator." (full description: onboarding, Today, My Plan,
habits, monthly review, stats, community and groups, resources, admin panel, account, installable
app; Arabic RTL only; calm tone; no payments.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Join the journey and live the day on «يومك» (Priority: P1)

A new member receives an invitation or access code, joins, enters their personal data, sees a
welcome screen, and lands on «يومك» (Today). Each day they open the app, see a greeting suited to
the time of day with the date and their journey day ("اليوم ١٢"), tap «ابدأ يومي» to write the
day's intention, check off their habits as they do them (progress shown as e.g. ٢/٦), see and
complete the daily challenge, glance at upcoming activities, and close with «ختام اليوم», which
summarizes what they did and ends with a calm closing message.

**Why this priority**: This is the core daily loop the whole program depends on. Without it there
is no practice to plan, review, or measure.

**Independent Test**: With one cohort, one group, a valid invitation code, and challenges for the
first days already in place, a tester can join, complete a full day (intention → habits →
challenge → close), return the next day, and see the journey day advance.

**Acceptance Scenarios**:

1. **Given** a valid unused invitation code linked to a cohort and group, **When** the person
   enters it and completes their personal data, **Then** they see the welcome screen, become a
   member of that cohort and group, and land on «يومك».
2. **Given** an invalid, expired, or already-used code, **When** it is entered, **Then** a clear
   Arabic message explains the problem and no account is created.
3. **Given** a member whose cohort started 11 days ago, **When** they open «يومك» in the morning,
   **Then** they see a morning greeting, today's date, and "اليوم ١٢".
4. **Given** a member with 6 active habits and none done today, **When** they check off two,
   **Then** progress reads ٢/٦ and stays correct after closing and reopening the app.
5. **Given** a checked habit, **When** the member unchecks it the same day, **Then** it returns
   to not done and progress updates.
6. **Given** the member has not started their day, **When** they tap «ابدأ يومي» and write an
   intention, **Then** the intention is saved and shown on «يومك» for the rest of the day.
7. **Given** a member during the day, **When** they open «ختام اليوم», **Then** they see their
   intention, habits done out of total, the challenge status, an optional space for a short
   reflection, and a closing message such as «ما نويته اليوم تمّ. وغدًا يبدأ من حيث توقفت.»
8. **Given** an activity scheduled for the member's group in the next 7 days, **When** they open
   «يومك», **Then** it appears under upcoming activities with its title, date, and time.

---

### User Story 2 - Admin sets up the program (Priority: P1)

An admin creates a cohort (e.g., «الدفعة الثالثة») with a start date, creates groups inside it,
assigns facilitators, generates invitation codes that place people in a cohort and group, moves
members between groups, schedules activities for groups or whole cohorts, and authors the daily
challenges for the journey.

**Why this priority**: Members cannot join, and Today has no challenge or activities, until an
admin sets up the program. It is required for any real launch.

**Independent Test**: An admin can, from the admin panel alone, create a cohort and two groups,
assign a facilitator, issue codes, schedule an activity, and add challenges; a member who uses one
of those codes then sees the right group, activity, and challenge.

**Acceptance Scenarios**:

1. **Given** an admin, **When** they create a cohort with a name and start date and add groups to
   it, **Then** the cohort and its groups appear in the admin panel and can be edited.
2. **Given** a group, **When** the admin assigns a facilitator, **Then** that person gains the
   facilitator role for that group and sees it under «مجموعاتي».
3. **Given** a cohort and group, **When** the admin generates invitation codes, **Then** each code
   places whoever uses it in that cohort and group; codes can be revoked before use.
4. **Given** a member in group A, **When** the admin moves them to group B in the same cohort,
   **Then** the member's personal history (habits, plan, reviews) is unchanged and their community
   and activities now come from group B.
5. **Given** an activity scheduled for a cohort, **When** members of any group in that cohort
   open «يومك», **Then** they see the activity in upcoming activities.
6. **Given** a non-admin user, **When** they try to open any admin panel page or perform any admin
   action, **Then** access is refused.

---

### User Story 3 - Build my plan and shape my habits (Priority: P2)

In «خطتي» (My Plan), the member writes a description of where they are now and defines focus areas
for the year. They create daily habits, link each to a focus area, edit and reorder them, and
archive habits they no longer practice. They can return to the plan at any time and edit it.

**Why this priority**: The plan gives the daily habits meaning and direction. Story 1 can run with
habits alone, but the journey is incomplete without the plan.

**Independent Test**: A member can write their current state, add three focus areas, create four
habits linked to them, reorder and archive one, and see the result on «يومك» and in «حسابي».

**Acceptance Scenarios**:

1. **Given** a member with no plan, **When** they open «خطتي», **Then** they are guided to
   describe their current state and add focus areas.
2. **Given** focus areas exist, **When** the member creates a habit, **Then** they can link it to
   a focus area, and «خطتي» shows habits grouped under their focus areas.
3. **Given** several habits, **When** the member reorders them, **Then** «يومك» shows them in the
   new order.
4. **Given** an active habit with history, **When** the member archives it, **Then** it leaves
   «يومك» and today's total, appears under archived habits in «حسابي», and keeps its history; it
   can be restored.
5. **Given** a saved plan, **When** the member edits their current state or focus areas, **Then**
   the changes are saved and the plan shows when it was last updated.

---

### User Story 4 - Monthly review: «وقفة مع ما مضى» (Priority: P2)

At the end of each month the member is invited to pause and reflect on the month. The review shows
that month's facts (habit completion, challenge completion, days closed) and asks guided
reflective questions. Past reviews stay available to reread.

**Why this priority**: The monthly pause is how the member adjusts course over a year-long journey;
it depends on Stories 1 and 3 producing data.

**Independent Test**: With a month of habit and challenge data, a member is prompted for a review,
completes it, and can open it again later alongside the month's figures.

**Acceptance Scenarios**:

1. **Given** the last days of a month, **When** the member opens the app, **Then** «يومك» shows a
   gentle invitation to the monthly review.
2. **Given** an open review, **When** the member starts it, **Then** they see the month's habit
   completion per habit, challenges completed, and days closed, followed by reflection questions.
3. **Given** a completed review, **When** the member opens past reviews, **Then** they can read it
   with the month's figures as they were at the time.
4. **Given** a member who skipped a review, **When** the review window ends, **Then** the review
   is still available to complete later and is marked as not yet done.

---

### User Story 5 - See my progress in «الإحصاءات» (Priority: P2)

The member sees their consistency and progress over time: completion rate per habit and overall,
current and longest streaks, and challenge completion, by week and month. A facilitator sees
aggregate figures for each of their groups.

**Why this priority**: Stats reinforce consistency and give facilitators visibility, but they only
add value once daily data exists.

**Independent Test**: With seeded history, the member's figures match a manual count of their
records, and a facilitator sees group totals without access to any member's private reflections.

**Acceptance Scenarios**:

1. **Given** a habit done on 20 of the last 30 days, **When** the member views stats for the last
   30 days, **Then** that habit shows a 67% completion rate.
2. **Given** a habit done on each of the last 5 days but not the day before, **When** stats are
   shown, **Then** the current streak is 5.
3. **Given** a facilitator of a group of 12, **When** they open group stats, **Then** they see the
   group's average habit completion, challenge completion, and number of members active this week.
4. **Given** a facilitator, **When** they view group stats, **Then** they cannot see any member's
   intentions, end-of-day reflections, plan text, or monthly review answers through stats.

---

### User Story 6 - Walk together: community and groups (Priority: P3)

Members see their group and cohort and interact with fellow participants. Facilitators see the
groups they lead and their members, follow each member's participation, and run group activities.
«مجموعاتي» lists both the groups a user leads and the group they belong to.

**Why this priority**: Group belonging is central to the program, but the individual practice
(Stories 1–5) must work first.

**Independent Test**: Two members and a facilitator of the same group can see each other in the
group, interact as defined in FR-040, and the facilitator can schedule a session that both members
then see on «يومك».

**Acceptance Scenarios**:

1. **Given** a member, **When** they open «المجتمع», **Then** they see their group's name,
   facilitator, members, and cohort.
2. **Given** a member of group A, **When** they browse the community, **Then** they cannot see the
   members or content of other groups.
3. **Given** a person who is a member of one group and facilitator of two others, **When** they
   open «مجموعاتي», **Then** they see all three, labelled by their role in each.
4. **Given** a facilitator, **When** they open a member of their group, **Then** they see that
   member's participation as defined in FR-043.
5. **Given** a facilitator, **When** they schedule an activity for their group, **Then** group
   members see it under upcoming activities.

---

### User Story 7 - Resources (Priority: P3)

Members open «الموارد» to see the journey map with its stages and where they are now, watch or
listen to session recordings, download files, browse suggested readings, and read the ten
«أعراف الرحلة». Admins upload and organize these resources.

**Why this priority**: Supporting content enriches the journey but is not needed for the daily
loop.

**Independent Test**: An admin uploads a recording and a file and adds a reading; a member sees
them in «الموارد», plays the recording, downloads the file, and reads the ten guidelines.

**Acceptance Scenarios**:

1. **Given** a member on journey day 40, **When** they open the journey map, **Then** they see
   all stages with the current stage highlighted.
2. **Given** a recording limited to cohort 3, **When** a member of cohort 2 browses resources,
   **Then** it is not shown and cannot be opened by direct link.
3. **Given** the admin has published the ten guidelines, **When** a member opens
   «أعراف الرحلة», **Then** they see all ten under the intro «عشرة أعراف تحكم الرحلة: بينك وبين
   نفسك، وبينك وبين من يسير معك».
4. **Given** an admin, **When** they upload, rename, reorder, or remove resources, **Then**
   members see the change.

---

### User Story 8 - My account, roles, and installing the app (Priority: P3)

From «حسابي» the user views and edits their personal data, sees their current cohort and group,
and opens archived habits. A user with several roles switches between them. The user installs the
app to their phone's home screen and uses it like a standalone app with bottom navigation.

**Why this priority**: Needed for a complete product, but each part is small and builds on the
stories above.

**Independent Test**: A user who is both member and facilitator edits their name, switches to the
facilitator view and back, opens archived habits, and installs the app from a phone browser.

**Acceptance Scenarios**:

1. **Given** a user, **When** they edit their personal data and save, **Then** the change
   appears everywhere their name is shown.
2. **Given** a user with member and facilitator roles, **When** they switch role, **Then** the
   navigation and home screen change to that role's view without signing out.
3. **Given** a supported phone browser, **When** the user chooses to install the app, **Then** it
   opens from the home screen without browser controls and shows the bottom navigation: يومك،
   خطتي، الإحصاءات، المجتمع، المزيد.

---

### Edge Cases

- **Day boundary**: a day runs from midnight to midnight in the member's time zone. A habit checked
  at 23:59 counts for that day; «يومك» switches to the next day at midnight even if the app stays
  open.
- **Missed days**: members can mark habits for the previous day only (to cover late logging);
  older days are read-only. Days with no activity count as not done, not as errors.
- **Not started / not closed**: the member can check habits without tapping «ابدأ يومي»; a day not
  closed with «ختام اليوم» is simply recorded as not closed.
- **Late joiner**: a member who joins after the cohort's start sees the cohort's journey day (e.g.
  joins on day 30 → sees "اليوم ٣٠") and the stats start from their join date.
- **No habits yet**: «يومك» invites the member to create their first habit or plan instead of
  showing ٠/٠.
- **No challenge for today**: the challenge card is hidden rather than showing an empty card.
- **Journey end**: after day 365 the member keeps read access to their history, plan, reviews, and
  stats; new daily entries stop unless they join a new cohort.
- **Member moved between groups**: personal history stays with the member; group stats count them
  in their new group from the move date.
- **Facilitator removed from a group**: they immediately lose access to that group's members and
  data.
- **Archived habit**: does not count in today's total or in overall completion rate going forward;
  its past completions remain in history.
- **Connectivity loss**: if the member checks a habit while offline, the app shows it as pending
  and saves it once the connection returns, without losing or duplicating it.
- **Same person, two devices**: checking a habit on one device shows on the other on next open.

## Requirements *(mandatory)*

### Functional Requirements

**Accounts, roles, and onboarding**

- **FR-001**: The system MUST let a person join only with a valid invitation or access code created
  by an admin. Each code is linked to one cohort and one group and has an expiry and a use limit.
- **FR-002**: Joining MUST follow three steps: code → personal data (at least full name and email;
  optionally phone, gender, and city) → welcome screen.
- **FR-003**: Returning users MUST sign in with their email and a one-time code sent to it; sessions
  stay signed in on a device until the user signs out.
- **FR-004**: The system MUST support three roles—member (مشارك), facilitator (ميسّر), admin
  (مدير)—and allow one person to hold several, switching between them without signing out.
- **FR-005**: Every action and every piece of data MUST be permission-checked by role and group
  membership by the system itself; hiding a control in the interface is not sufficient, and a user
  who requests data outside their permissions directly MUST be refused.

**Journey**

- **FR-006**: Each cohort MUST have a start date; a member's journey day equals the number of days
  since their cohort's start date plus one, shown on «يومك» (e.g. "اليوم ١٢").
- **FR-007**: The journey MUST last 365 days and be divided into stages defined by admins, shown on
  the journey map.

**Today (يومك)**

- **FR-010**: «يومك» MUST be the member's home screen and show: a greeting by time of day (morning,
  afternoon, evening), today's date, the journey day, today's habits with progress (done/total),
  the daily challenge, and upcoming activities for the next 7 days.
- **FR-011**: Members MUST be able to check and uncheck each active habit for today and yesterday.
- **FR-012**: «ابدأ يومي» MUST let the member write one short intention for the day, editable that
  day.
- **FR-013**: The daily challenge for each journey day MUST be shown to members, and members MUST be
  able to mark it done. Challenges are authored as defined in [NEEDS CLARIFICATION: who writes the
  daily challenge — one admin-authored challenge per journey day shared by all cohorts, a separate
  set per cohort, or set by each group's facilitator?].
- **FR-014**: «ختام اليوم» MUST show the day's intention, habits done/total, challenge status, an
  optional short reflection, and a closing message from a set of calm Arabic messages (e.g.
  «ما نويته اليوم تمّ. وغدًا يبدأ من حيث توقفت.»).

**My Plan and habits**

- **FR-020**: «خطتي» MUST let the member write and edit a free-text description of their current
  state and create, edit, reorder, and remove yearly focus areas.
- **FR-021**: Members MUST be able to create, edit (name, optional description, focus area), and
  reorder daily habits, and link each habit to at most one focus area.
- **FR-022**: Members MUST be able to archive and restore habits; archived habits are listed in
  «حسابي» and keep their full completion history.
- **FR-023**: The system MUST keep a dated completion record for every habit for the whole journey.
- **FR-024**: «خطتي» MUST show when the plan was last updated.

**Monthly review**

- **FR-030**: From the last 3 days of each calendar month through the 7th day of the next, «يومك»
  MUST show an invitation to that month's review.
- **FR-031**: The review MUST show that month's completion rate per habit, challenges completed,
  and days closed, followed by a set of reflection questions defined by admins, with free-text
  answers.
- **FR-032**: Completed reviews MUST be saved with a snapshot of the month's figures and remain
  readable for the whole journey; unfinished past reviews can still be completed.

**Stats**

- **FR-035**: Members MUST see, for a chosen period (this week, this month, whole journey): overall
  and per-habit completion rate, current and longest streak per habit, and challenges completed.
- **FR-036**: All figures MUST be computed from the actual records, so stats, reviews, and «يومك»
  never disagree.
- **FR-037**: Facilitators MUST see, per group they lead: average habit completion, challenge
  completion, and members active in the last 7 days. Group stats MUST NOT expose any member's
  written intentions, reflections, plan text, or review answers.

**Community and groups**

- **FR-040**: Members MUST see their group (name, facilitator, members) and cohort, and interact
  with fellow participants as defined in [NEEDS CLARIFICATION: what does "interact" include — a
  shared group feed with posts and comments, reactions/encouragement only, direct messages between
  members, or a mix?].
- **FR-041**: Members MUST NOT see members or content of groups they do not belong to.
- **FR-042**: «مجموعاتي» MUST list every group the user leads and the group they belong to, with
  their role in each.
- **FR-043**: Facilitators MUST see the members of their groups and each member's participation,
  where participation means [NEEDS CLARIFICATION: what may a facilitator see about an individual
  member — only activity signals (last active, days closed, completion rate), or also their
  habits by name, or also their written intentions, reflections, plan, and reviews?].
- **FR-044**: Facilitators MUST be able to create, edit, and cancel activities for groups they
  lead.

**Resources**

- **FR-050**: «الموارد» MUST contain: the journey map, session recordings (audio or video), files
  for download, suggested references and readings, and the ten «أعراف الرحلة».
- **FR-051**: Each resource MUST be available to the whole program, specific cohorts, or specific
  groups, and MUST NOT be reachable by people outside that audience, including by direct link.

**Admin panel**

- **FR-060**: Admins MUST be able to create and edit cohorts (name, start date) and groups, assign
  and remove facilitators, add members, and move members between groups.
- **FR-061**: Admins MUST be able to generate, view, and revoke invitation codes.
- **FR-062**: Admins MUST be able to schedule, edit, and cancel activities (title, description,
  date, time, location or link) for a group, several groups, or a whole cohort.
- **FR-063**: Admins MUST be able to upload, organize (categories, order), edit, and remove
  recordings, files, and references, and edit the journey stages, the ten guidelines, the monthly
  review questions, and the closing messages.

**Account**

- **FR-070**: «حسابي» MUST let the user view and edit their personal data, see their current cohort
  and group, open archived habits, switch roles, and sign out.
- **FR-071**: Members MUST be able to request an export of their own data and request deletion of
  their account.

**Experience**

- **FR-080**: The entire interface MUST be in Arabic, laid out right-to-left, with no
  untranslated text.
- **FR-081**: The app MUST work in current mobile and desktop browsers and be installable to the
  home screen, opening as a standalone app.
- **FR-082**: The member layout MUST be mobile-first with bottom navigation: يومك، خطتي، الإحصاءات،
  المجتمع، المزيد. «المزيد» MUST give access to الموارد، مجموعاتي، حسابي, and—for those who hold the
  role—لوحة الإدارة.
- **FR-083**: Copy MUST be calm, reflective, and warm: no points, badges, leaderboards, or alarming
  language; reminders, if any, MUST be optional and adjustable by the user.
- **FR-084**: Interfaces MUST meet WCAG 2.1 AA, including Arabic screen-reader support.

### Key Entities *(include if feature involves data)*

- **User**: a person with personal data (name, email, optional phone, gender, city), time zone, and
  one or more roles.
- **Cohort (دفعة)**: a program run with a name and start date; contains groups.
- **Group (مجموعة)**: belongs to one cohort; has one or more facilitators and many members.
- **Membership**: links a user to a group as member or facilitator, with start and end dates
  (keeps history when moved).
- **Invitation code**: linked to a cohort and group; expiry, use limit, uses, revoked flag.
- **Plan (خطتي)**: one per member per journey; current-state text, last updated date.
- **Focus area (مجال)**: belongs to a plan; title, optional description, order.
- **Habit (عادة)**: belongs to a member; name, optional description, optional focus area, order,
  active or archived.
- **Habit completion**: a habit marked done on a given date.
- **Daily challenge (تحدّي اليوم)**: content for a journey day; members can mark it done.
- **Day entry**: a member's intention, closing reflection, and closed status for a date.
- **Monthly review (مراجعة الشهر)**: a member's answers for a month plus a snapshot of that month's
  figures; done or not done.
- **Activity (نشاط)**: title, description, date and time, location or link, audience (groups or
  cohort), created by admin or facilitator.
- **Resource (مورد)**: type (recording, file, reference), title, category, order, audience.
- **Journey stage (مرحلة)**: name, description, day range on the journey map.
- **Guideline (عُرف)**: one of the ten «أعراف الرحلة», with order and text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new member goes from entering an invitation code to «يومك» in under 3 minutes.
- **SC-002**: A member checks off a habit in at most 2 taps from opening the app, and completes a
  whole day's routine (intention, habits, challenge, close) in under 2 minutes.
- **SC-003**: «يومك» is usable within 3 seconds of opening on a mid-range phone over a typical
  mobile connection.
- **SC-004**: 100% of figures shown in stats and monthly reviews match a manual count of the
  member's records in testing.
- **SC-005**: 0 cases, in permission testing, of a user seeing data from a group, cohort, or role
  they do not belong to.
- **SC-006**: An admin sets up a new cohort with 5 groups, facilitators, and invitation codes in
  under 30 minutes without outside help.
- **SC-007**: At least 70% of active members close their day with «ختام اليوم» at least 4 days a
  week during the first month.
- **SC-008**: At least 80% of members complete each monthly review within its window.
- **SC-009**: In usability sessions, at least 90% of participants describe the experience as calm
  and clear, and no screen shows untranslated or left-to-right text.
- **SC-010**: Facilitators report spending under 15 minutes a week to know how each member of
  their group is doing.

## Assumptions

- One member belongs to exactly one group (and so one cohort) at a time; one facilitator may lead
  several groups; a group may have more than one facilitator.
- Habits are daily only in this version (no weekly or custom schedules).
- Journey day is counted from the cohort's start date, not each member's join date.
- Monthly reviews follow the calendar month; the review window runs from the last 3 days of the
  month to the 7th day of the next.
- Members can log habits for today and yesterday only.
- Sign-in uses email plus a one-time code; no social sign-in in this version.
- Time of day for the greeting: morning until 12:00, afternoon until 17:00, evening after.
- Dates are shown in the Gregorian calendar with Arabic month names; the Hijri date may be shown
  alongside it.
- Push or email reminders are optional and off by default; their exact design is left to a later
  feature.
- Recordings are hosted by the app; links to outside platforms are also allowed as references.
- Programme content (stages, guidelines, review questions, closing messages, challenges) is entered
  by admins; the app ships with editable defaults.
- Out of scope: payments and subscriptions, languages other than Arabic, native app-store apps.
