#!/usr/bin/env node
// Applies database migrations to the deployment's Supabase project before the build (Vercel).
//
// Runs only when a direct database URL is present (the Vercel ↔ Supabase integration provides
// POSTGRES_URL_NON_POOLING; DATABASE_URL also works). Locally and in CI there is none, so it does
// nothing and the build carries on.
//
// 1. Each file in supabase/migrations is applied once, in order, inside a transaction, and recorded in
//    public.goodlife_migrations.
// 2. supabase/content.sql (starter content) is applied once, recorded as "content.sql".
// 3. With BOOTSTRAP_ADMIN_EMAIL set and no admin yet: that email is stored for 0021_bootstrap, and a
//    starter cohort, group and invitation code are created. The code is printed in the build log.
//    Whoever joins with that email becomes the first admin.
import { readdirSync, readFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import path from "node:path";
import postgres from "postgres";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const url = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] No database URL (POSTGRES_URL_NON_POOLING / DATABASE_URL): skipping.");
  process.exit(0);
}

// Keep only the parameters a direct connection needs (pooler hints such as `supa=` are dropped).
const clean = new URL(url);
for (const key of [...clean.searchParams.keys()]) if (key !== "sslmode") clean.searchParams.delete(key);
// TLS always, except an explicit sslmode=disable (local testing against a plain PostgreSQL).
const ssl = clean.searchParams.get("sslmode") === "disable" ? false : "require";
clean.searchParams.delete("sslmode");
const sql = postgres(clean.toString(), { ssl, max: 1, onnotice: () => {}, connect_timeout: 30 });

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // matches invitation_codes.code (no 0/O, 1/I/L)
const newCode = () => Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

async function apply(name, body) {
  const [done] = await sql`select 1 from public.goodlife_migrations where name = ${name}`;
  if (done) return false;
  await sql.begin(async (tx) => {
    await tx.unsafe(body);
    await tx`insert into public.goodlife_migrations (name) values (${name})`;
  });
  console.log(`[migrate] applied ${name}`);
  return true;
}

try {
  await sql`create table if not exists public.goodlife_migrations (name text primary key, applied_at timestamptz not null default now())`;
  await sql`alter table public.goodlife_migrations enable row level security`;
  await sql`revoke all on public.goodlife_migrations from anon, authenticated`;

  const dir = path.join(root, "supabase", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  let applied = 0;
  for (const f of files) if (await apply(f, readFileSync(path.join(dir, f), "utf8"))) applied++;
  if (await apply("content.sql", readFileSync(path.join(root, "supabase", "content.sql"), "utf8"))) applied++;
  console.log(`[migrate] ${applied} applied, ${files.length + 1 - applied} already in place.`);

  // Accounts created before joining confirmed the address up front were left unconfirmed, and
  // Supabase answers a sign-in request for those with a "confirm your signup" link, not the code.
  // Every app member joined with an invitation code, so their addresses are confirmed here.
  try {
    const fixed = await sql`update auth.users set email_confirmed_at = now()
                            where email_confirmed_at is null and id in (select id from public.users)`;
    if (fixed.count) console.log(`[migrate] confirmed ${fixed.count} member email(s).`);
  } catch (error) {
    console.warn("[migrate] could not confirm member emails:", error.message);
  }

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const [{ admins }] = await sql`select count(*)::int as admins from public.user_roles where role = 'admin'`;
  if (email && admins === 0) {
    await sql`insert into public.app_bootstrap (admin_email) values (${email})
              on conflict (id) do update set admin_email = excluded.admin_email`;
    // Already joined with that email? Grant now.
    const [user] = await sql`select id from public.users where lower(email) = ${email}`;
    if (user) {
      await sql`select public.bootstrap_admin(${user.id}::uuid)`;
      console.log(`[migrate] ${email} is now admin.`);
    } else {
      let [invite] = await sql`select code from public.invitation_codes where revoked_at is null and expires_at > now() and uses < max_uses order by created_at limit 1`;
      if (!invite) {
        const [cohort] = await sql`insert into public.cohorts (name, start_date)
                                   values ('الدفعة الأولى', (now() at time zone 'Asia/Riyadh')::date)
                                   on conflict (name) do update set name = excluded.name returning id`;
        const [group] = await sql`insert into public.groups (cohort_id, name) values (${cohort.id}, 'المجموعة الأولى')
                                  on conflict (cohort_id, name) do update set name = excluded.name returning id`;
        [invite] = await sql`insert into public.invitation_codes (code, cohort_id, group_id, expires_at, max_uses)
                             values (${newCode()}, ${cohort.id}, ${group.id}, now() + interval '30 days', 20) returning code`;
      }
      console.log(`[migrate] First admin: join at /join with invitation code ${invite.code} using ${email}.`);
    }
  } else if (admins === 0) {
    console.log("[migrate] No admin yet. Set BOOTSTRAP_ADMIN_EMAIL and redeploy to create the first one.");
  }
} catch (error) {
  console.error("[migrate] failed:", error.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
