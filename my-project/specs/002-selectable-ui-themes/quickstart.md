# Quickstart & Validation: Selectable Visual Versions

Prerequisites and setup are the same as spec 001 ([quickstart](../001-goodlife-journey-app/quickstart.md)):
`npx supabase start && npx supabase db reset && npm run dev`. The seed adds daily quotes and sets
member1 to «زجاجي», member2 to «زجاج كامل», everyone else to the default «رحلة يومي».

## Automated checks

```bash
npm run lint && npm run typecheck && npm test
npm run db:test:local                       # includes ui_versions.test.sql
npm run test:e2e                            # all spec 001 + 002 specs, in each of the 3 versions
npm run test:e2e -- --project=ui-glass      # one version only
```

## Manual scenarios (phone-sized viewport)

1. **Choose during setup (US1)**: join with `TAYBAH26` → after «أهلًا بك» the "choose your look" step
   shows three previews → pick «زجاج كامل» → «يومك» opens in Full Glass. Sign in on a second browser:
   same version.
2. **Skip (US1)**: join again, skip the step → «رحلة يومي».
3. **Parity (US2)**: as member1 («زجاجي») check two habits, mark the journey challenge done, close the
   day. Switch to «رحلة يومي» and «زجاج كامل»: the same state shows; «الإحصاءات» figures identical.
4. **Habit row (US2)**: tap a habit circle (check mark, count and «تقدمك اليوم» update); expand the row
   (description, ٥/٧ أيام-style weekly progress, streak); tap + (quick actions).
5. **Change later (US3)**: «حسابي» → المظهر → switch version; every screen restyles without sign-out.
6. **Ritual (US4)**: first open of the day in «رحلة يومي» shows the quote card; «ابدأ يومي» → intention;
   reopen (and on a second device): not shown again. Turn the ritual off: never shown.
7. **Accessibility (US5)**: enable "reduce transparency" (device or in-app) → glass becomes solid;
   enable "reduce motion" → no blur/animations; run the axe sweep per version.
8. **Every screen (FR-006)**: visit admin and facilitator screens in each version; tables and forms
   stay on solid surfaces.
9. **Slow network**: throttle to 3G with "save data" → content appears first, no background image.

## Expected outcome

All automated checks green in all three versions; manual scenarios match; «يومك» usable within 3 s
per version (perf test).
