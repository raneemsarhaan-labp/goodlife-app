# Quickstart & Validation: «يومك» Content

Setup as spec 001 ([quickstart](../001-goodlife-journey-app/quickstart.md)):
`npx supabase start && npx supabase db reset && npm run dev`. The seed adds a desired state for member1,
one registration-open online activity with four weekly sessions and capacity 2, and its meeting link.

## Automated checks

```bash
npm run lint && npm run typecheck && npm test
npm run db:test:local                 # includes today_content.test.sql (RLS, functions)
bash scripts/db-concurrency-check.sh  # 25 parallel registrations for 2 places → exactly 2 (SC-004)
npm run test:e2e                      # includes us-desired-state, us-activity-registration, us-make-habit
npm run build && npm run check:bundle # «يومك» stays within 200 KB
```

## Manual scenarios (phone viewport, each visual version)

1. **Desired state (US1)**: as member1, «يومك» shows «حالي المنشود»; write a reflection → «تمّ حفظ تأمّلك»;
   open the history: it is there under today, next to yesterday's «ختام اليوم». Sign in as the
   facilitator: no trace of either.
2. **Empty state (US1)**: as member2 (no desired state) the card invites writing it and opens «خطتي».
3. **Offline (US1)**: go offline, save a reflection (pending badge), go online → saved once.
4. **Registration (US2)**: as member1 open the seeded activity from upcoming activities → «سجّلني»; the
   link appears; «يومك» shows «نشاط سجّلت فيه · أونلاين»; close it → hidden today. As member2 register;
   as a third member: full. Cancel as member2 → third member can register.
5. **Organizers (US2)**: admin sees 2 registered; facilitator sees only their group's registered members.
6. **«اجعلها عادة» (US3)**: tap it on today's journey challenge → form prefilled → save → habit on «يومك».
7. **Export**: «حسابي» → export includes desired state, reflections and registrations.

## Expected outcome

All automated checks green in the three versions; scenarios match the spec's acceptance criteria.
