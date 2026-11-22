# Quickstart & Validation (spec 005)

Seed: challenge library (~14), member1 plan domains with texts, member1 next review = today.

```bash
npm run lint && npm run typecheck && npm test
npm run db:test:local      # plan_domains_review.test.sql
npm run build && npm run check:bundle
npm run test:e2e           # us-plan-domains.spec.ts, us-plan-review.spec.ts, us-challenge-library.spec.ts
```

Manual: «خطتي» → «هويّتي», domain cards; «حان موعد مراجعتك» → review → «بعد شهر»; «يومك» on a day without a
journey challenge → «تحدّي اليوم» from the plan's domains → ↻ → done → stats count it.
