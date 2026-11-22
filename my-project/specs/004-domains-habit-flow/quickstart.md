# Quickstart & Validation: Life Domains, Habit Shape and the Add-Habit Flow

Setup as spec 001. The seed adds the seven domains, the library, links member1's focus areas to domains,
and gives one of member1's habits Sunday–Thursday days and «الصباح».

```bash
npm run lint && npm run typecheck && npm test
npm run db:test:local            # includes domains_habits.test.sql (schedule math, cap, RLS)
npm run build && npm run check:bundle
npm run test:e2e                 # includes us-add-habit-flow.spec.ts
```

Manual: + → «عادة جديدة» → «النفس والبدن» → «مشي ٢٠ دقيقة» → «المساء», 5 days → save → «يومك» shows it
under «المساء» on a scheduled day only; expand it: week circles and «سجّل اليوم»; «الإحصاءات» rates count
scheduled days. Admin → المحتوى → «مكتبة العادات»: add a suggestion; it appears in step 2.
