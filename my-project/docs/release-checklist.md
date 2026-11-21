# Release checklist

Constitution v1.2.0 › Constraints › البيانات: migrations are forward-only and reviewed; a backup is
taken before every release that changes the database schema.

## Before merging

- [ ] CI is green: lint, typecheck, unit tests, `supabase test db`, Playwright e2e (incl. axe).
- [ ] RTL screenshots (CI artifact `rtl-screenshots`) reviewed by someone other than the author.
- [ ] The PR names the constitution principles it touches.
- [ ] New migrations are **new files**. No merged migration in `supabase/migrations/` was edited.

## Releasing a change that includes new migrations

1. **Back up first.** In the Supabase dashboard: *Database → Backups*. Take an on-demand backup
   (or confirm point-in-time recovery is enabled and note the current time).
2. Apply migrations to production: `npx supabase db push` (linked project).
3. Deploy the app (Vercel deploys `main` automatically).
4. Smoke test: sign in as a test member, open «يومك», check and uncheck a habit, open «الإحصاءات».

## If something goes wrong

- **Never edit or delete a merged migration.** Write a new migration that corrects the problem,
  review it, and release it the same way.
- If data was damaged, restore from the backup taken in step 1 (or point-in-time recovery), then
  apply the corrective migration.

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` lives only in the hosting provider's environment settings, never in
  the repository or in client code (`src/lib/supabase/admin.ts` is server-only).
