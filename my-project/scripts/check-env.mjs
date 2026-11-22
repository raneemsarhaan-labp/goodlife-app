#!/usr/bin/env node
// Fails the build early, with a plain explanation, when the Supabase settings are missing.
// On Vercel each environment (Production, Preview) has its own variables; a branch that is not the
// production branch builds as Preview and needs them switched on for Preview too.
const env = process.env;
const missing = [
  ["NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)", env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY],
].filter(([, value]) => !value).map(([name]) => name);

if (missing.length && env.VERCEL) {
  const where = env.VERCEL_ENV ? `${env.VERCEL_ENV} (branch ${env.VERCEL_GIT_COMMIT_REF ?? "?"})` : "this environment";
  console.error(`\n[env] Missing for ${where}: ${missing.join(", ")}.`);
  console.error("[env] Vercel → Settings → Environment Variables: tick this environment for the Supabase variables");
  console.error("[env] (or reconnect Storage → Supabase for it), then redeploy. See docs/DEPLOY.md.\n");
  process.exit(1);
}
