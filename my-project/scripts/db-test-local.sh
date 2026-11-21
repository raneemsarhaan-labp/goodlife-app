#!/usr/bin/env bash
# Run migrations, seed, and pgTAP tests against a local plain PostgreSQL (no Docker).
# Usage: npm run db:test:local   (env: PGHOST, PGUSER, PGPORT as needed; default local socket)
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${GOODLIFE_TEST_DB:-goodlife_test}"
PSQL=(psql -v ON_ERROR_STOP=1 -q -X)

dropdb --if-exists "$DB"
createdb "$DB"
"${PSQL[@]}" -d "$DB" -f scripts/local-db/auth_shim.sql
for f in supabase/migrations/*.sql; do
  "${PSQL[@]}" -d "$DB" -f "$f"
done
if [[ "${1:-}" != "--no-seed" && -f supabase/seed.sql ]]; then
  "${PSQL[@]}" -d "$DB" -f supabase/seed.sql
fi
shopt -s nullglob
tests=(supabase/tests/*.test.sql)
if (( ${#tests[@]} )); then
  pg_prove -d "$DB" "${tests[@]}"
else
  echo "No pgTAP tests found."
fi
