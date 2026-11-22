#!/usr/bin/env bash
# Spec 003 SC-004: capacity is never exceeded when many members register at the same moment.
# Starts N parallel sessions, each registering a different member for an activity with C places,
# and checks that exactly C registrations exist. Runs against the local test database built by
# `npm run db:test:local` (env GOODLIFE_TEST_DB, default goodlife_test).
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${GOODLIFE_TEST_DB:-goodlife_test}"
N="${N:-25}"; C="${C:-2}"
PSQL=(psql -v ON_ERROR_STOP=1 -q -X -t -A -d "$DB")
ACT=c0ffee00-0000-4000-8000-0000000000e9; GROUP=c0ffee00-0000-4000-8000-0000000000a9; COHORT=c0ffee00-0000-4000-8000-0000000000c9

cleanup() {
  "${PSQL[@]}" <<SQL >/dev/null
delete from activities where id = '$ACT';
delete from auth.users where email like 'race-%@t.test';
delete from users where email like 'race-%@t.test';
delete from groups where id = '$GROUP';
delete from cohorts where id = '$COHORT';
SQL
}
cleanup
"${PSQL[@]}" <<SQL >/dev/null
begin;
insert into cohorts (id, name, start_date) values ('$COHORT', 'سباق', current_date - 1);
insert into groups (id, cohort_id, name) values ('$GROUP', '$COHORT', 'سباق');
with u as (
  insert into auth.users (id, email) select gen_random_uuid(), 'race-' || i || '@t.test' from generate_series(1, $N) i returning id, email
), p as (
  insert into users (id, full_name, email, time_zone, active_role) select id, email, email, 'Asia/Riyadh', 'member' from u returning id
), r as (
  insert into user_roles (user_id, role) select id, 'member' from p returning user_id
)
insert into group_memberships (group_id, user_id, role, started_on) select '$GROUP', user_id, 'member', current_date - 1 from r;
insert into activities (id, title, starts_at, registration_open, capacity) values ('$ACT', 'سباق على المقاعد', now() + interval '1 day', true, $C);
insert into activity_audiences (activity_id, group_id) values ('$ACT', '$GROUP');
commit;
SQL

mapfile -t USERS < <("${PSQL[@]}" -c "select id from users where email like 'race-%@t.test'")
for u in "${USERS[@]}"; do
  "${PSQL[@]}" >/dev/null 2>&1 <<SQL &
begin;
select set_config('request.jwt.claims', json_build_object('sub', '$u', 'role', 'authenticated')::text, true);
set local role authenticated;
select register_for_activity('$ACT');
commit;
SQL
done
wait || true

COUNT=$("${PSQL[@]}" -c "select count(*) from activity_registrations where activity_id = '$ACT' and cancelled_at is null")
cleanup
echo "$N concurrent registrations for $C places → $COUNT registered"
if [[ "$COUNT" != "$C" ]]; then echo "FAIL: capacity not respected"; exit 1; fi
echo "PASS"
