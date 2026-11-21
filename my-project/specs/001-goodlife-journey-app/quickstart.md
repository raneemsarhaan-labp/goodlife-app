# Quickstart & Validation: الحياة الطيبة Journey App

How to run the app locally and prove each user story works end to end. Details of data and
interfaces live in [data-model.md](./data-model.md) and [contracts/](./contracts/).

## Prerequisites

- Node.js 22 LTS or newer, npm
- Docker (for the local Supabase stack)
- Supabase CLI (`npx supabase`)

## Setup

```bash
npm install
npx supabase start            # local Postgres, Auth (with Inbucket mail), Storage
cp .env.example .env.local    # fill with values printed by `supabase start`
npx supabase db reset         # apply migrations + seed (supabase/seed.sql)
npm run dev                   # http://localhost:3000
```

Seed data: cohort «الدفعة التجريبية» starting 11 days ago, groups «مجموعة النور» and
«مجموعة الأمل», one admin (`admin@example.test`), one facilitator (`facilitator@example.test`),
two members, invitation code `TAYBAH26`, journey challenges for days 1–30, ten guidelines, review
questions, closing messages, encouragement phrases. One-time codes arrive in the local mail
viewer (Mailpit) at the URL `supabase start` prints. Codes use an unambiguous alphabet (no 0/O/1/I/L).

## Automated checks (all must pass before merge)

```bash
npm run lint && npm run typecheck
npm run test             # Vitest: journey day, streaks, formatters, validation
npx supabase test db     # pgTAP: RLS allow/deny per role and table, SQL stats functions
npm run db:test:local    # same pgTAP suite on a plain local PostgreSQL + pgTAP (no Docker)
npm run test:e2e         # Playwright (mobile RTL viewport) + axe WCAG 2.1 AA
```

## Manual validation scenarios

Use a phone-sized viewport (or a real phone on the LAN).

1. **Join and Today (US1)**: `/join` → `TAYBAH26` → personal data → welcome → «يومك» shows a
   greeting, today's date, "اليوم ١٢", habits empty-state invitation. Create 3 habits, check 2
   → progress ٢/٣. Tap «ابدأ يومي», write an intention. Journey challenge shows labelled
   «تحدّي الرحلة»; add an own challenge, shown as «تحدّي ذاتي» with a distinct style. Mark both
   done. «ختام اليوم» shows the summary and a closing message.
2. **Offline check-off (US1, research §4)**: with the app open, go offline in dev tools, check a
   habit (shows pending), go online → it saves once; reload confirms one completion.
3. **Admin setup (US2)**: sign in as admin → create cohort with a start date, two groups, assign
   the facilitator, generate 5 codes, schedule a cohort-wide activity → a member sees it on
   «يومك». Move a member to the other group → their habits and plan are unchanged.
4. **Plan and habits (US3)**: «خطتي» → write current state, add 3 focus areas, link habits,
   reorder, archive one → it leaves «يومك», appears in «حسابي» › archived habits, restore works.
5. **Monthly review (US4)**: set the device date to the 3rd-last day of the month → «يومك»
   shows the review invitation; complete it; it appears in `/reviews` with its figures.
6. **Stats (US5)**: seeded member with known history → completion rates and streaks match the
   expected values in `supabase/tests/fixtures/stats_expected.json`.
7. **Facilitator privacy (US5, US6)**: as facilitator open `/groups/[id]` → see only last active,
   days closed, completion rate per member; try `/plan`-data endpoints or another group's URL →
   not available.
8. **Encouragement (US6)**: member A sends member B «بارك الله في سعيك» → B sees it in
   «المجتمع»; a second send the same day is refused calmly; no free-text field exists.
9. **Resources (US7)**: as admin upload a recording limited to the seed cohort → member plays
   it; a user outside the cohort gets "not available", including via the copied link after it
   expires.
10. **Account, roles, install (US8)**: user with member + facilitator roles switches role
    without signing out; on Android Chrome / iOS Safari "Add to Home Screen" opens standalone
    with bottom navigation يومك · خطتي · الإحصاءات · المجتمع · المزيد.

## Expected outcome

All automated checks green; every manual scenario behaves as described with Arabic RTL text and
no untranslated strings (constitution I, quality gates).
