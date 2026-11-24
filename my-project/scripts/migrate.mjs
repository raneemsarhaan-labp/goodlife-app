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
// 3. Makes sure there is an open group for sign-ups (creates a first cohort and group if none).
// 4. With BOOTSTRAP_ADMIN_PHONE set: the account with that mobile is made admin.
import { readdirSync, readFileSync } from "node:fs";
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
// Same rules as normalizePhone in src/lib/validation/onboarding.ts.
const COUNTRY_CODES = ["966", "20", "971", "965", "974", "973", "968", "962", "961", "963", "964", "970", "967", "249", "218", "212", "213", "216", "222", "90", "44", "1"];
function normalizePhone(raw) {
  let v = raw.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/[\s\-().\u200e\u200f]/g, "");
  if (v.startsWith("+")) return v;
  if (v.startsWith("00")) return `+${v.slice(2)}`;
  if (/^05\d{8}$/.test(v)) return `+966${v.slice(1)}`;
  if (/^5\d{8}$/.test(v)) return `+966${v}`;
  if (/^01[0125]\d{8}$/.test(v)) return `+20${v.slice(1)}`;
  if (v.startsWith("0")) v = v.slice(1);
  return COUNTRY_CODES.some((c) => v.startsWith(c)) && v.length >= 10 && v.length <= 15 ? `+${v}` : v;
}

const sql = postgres(clean.toString(), { ssl, max: 1, onnotice: () => {}, connect_timeout: 30 });

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

  // Sign-up needs an open group to join (0022 register_member). On a fresh project, create one.
  const [{ groups }] = await sql`select count(*)::int as groups from public.groups where status = 'open'`;
  if (groups === 0) {
    const [cohort] = await sql`insert into public.cohorts (name, start_date)
                               values ('الدفعة الأولى', (now() at time zone 'Asia/Riyadh')::date)
                               on conflict (name) do update set name = excluded.name returning id`;
    await sql`insert into public.groups (cohort_id, name, is_default) values (${cohort.id}, 'المجموعة الأولى', true)
              on conflict (cohort_id, name) do update set status = 'open', is_default = true`;
    console.log("[migrate] Created «الدفعة الأولى» / «المجموعة الأولى» for new sign-ups.");
  }

  // The owner's account becomes admin: sign up in the app first, then set BOOTSTRAP_ADMIN_PHONE to
  // that mobile and redeploy.
  const rawPhone = process.env.BOOTSTRAP_ADMIN_PHONE?.trim();
  if (rawPhone) {
    const phone = normalizePhone(rawPhone);
    const [user] = await sql`select id from public.users where phone = ${phone}`;
    if (!user) {
      console.log(`[migrate] BOOTSTRAP_ADMIN_PHONE: no account with ${phone} yet. Sign up with it, then redeploy.`);
    } else {
      const granted = await sql`insert into public.user_roles (user_id, role) values (${user.id}, 'admin') on conflict do nothing`;
      console.log(granted.count ? `[migrate] ${phone} is now admin.` : `[migrate] ${phone} is already admin.`);
    }
  } else {
    const [{ admins }] = await sql`select count(*)::int as admins from public.user_roles where role = 'admin'`;
    if (admins === 0) console.log("[migrate] No admin yet. Sign up in the app, set BOOTSTRAP_ADMIN_PHONE to that mobile and redeploy.");
  }
} catch (error) {
  console.error("[migrate] failed:", error.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
