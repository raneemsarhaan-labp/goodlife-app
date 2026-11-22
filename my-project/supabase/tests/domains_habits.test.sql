-- T003 (spec 004): life domains, plan-domain cap, habit shape, schedule-aware figures.
begin;
\ir _helpers.psql
select plan(32);

create temp table k (name text primary key, id uuid) on commit drop;
grant select, insert on k to authenticated;
-- Cohort started 20 days ago; member joined at the start.
insert into cohorts (id, name, start_date) values ('d4000000-0000-4000-8000-0000000000c1', 'دفعة المجالات', current_date - 20);
insert into groups (id, cohort_id, name) values ('d4000000-0000-4000-8000-0000000000a1', 'd4000000-0000-4000-8000-0000000000c1', 'مجموعة المجالات');
insert into k values ('admin', tests.create_user('admin@t.test', '{admin,member}', 'UTC')), ('m1', tests.create_user('m1@t.test', '{member}', 'UTC'));
select tests.join_group((select id from k where name='m1'), 'd4000000-0000-4000-8000-0000000000a1', 'member', current_date - 20);
insert into plans (id, user_id, cohort_id) values ('d4000000-0000-4000-8000-0000000000b1', (select id from k where name='m1'), 'd4000000-0000-4000-8000-0000000000c1');

-- ── Schedule helpers ───────────────────────────────────────────────────────
select ok(habit_on(127::smallint, current_date), 'daily habit is on every day');
select ok(habit_on(1::smallint, date '2026-11-22'), 'bit 0 = Sunday (2026-11-22 is a Sunday)');
select ok(not habit_on(1::smallint, date '2026-11-23'), 'Sunday-only habit is off on Monday');
select is(scheduled_ord(127::smallint, date '2026-11-28') - scheduled_ord(127::smallint, date '2026-11-21'), 7, 'daily: 7 scheduled days in a week');
select is(scheduled_ord(31::smallint, date '2026-11-28') - scheduled_ord(31::smallint, date '2026-11-21'), 5, 'Sunday–Thursday: 5 in a week');
select is(scheduled_ord(64::smallint, date '2026-12-31') - scheduled_ord(64::smallint, date '2026-11-30'), 4, 'Saturdays in December 2026: 4');

-- ── Domains and library: read for members, write for admins ────────────────
select tests.authenticate_as((select id from k where name='m1'));
select is((select count(*) from life_domains where active), 7::bigint, 'members read the seven domains');
update life_domains set name = 'تغيير' where key = 'faith';
select is((select name from life_domains where key = 'faith'), 'الصلة بالله', 'members cannot edit domains');
select tests.as_superuser();
insert into habit_library (domain_id, name, amount, sort_order, active)
  select id, 'اقتراح مفعّل', '١٠ دقائق', 1, true from life_domains where key = 'self'
  union all select id, 'اقتراح موقوف', null, 2, false from life_domains where key = 'self';
select tests.authenticate_as((select id from k where name='m1'));
select is((select count(*) from habit_library where name like 'اقتراح%'), 1::bigint, 'members see only active suggestions');
select throws_ok($$ insert into habit_library (domain_id, name) select id, 'من عضو' from life_domains limit 1 $$, '42501', null, 'members cannot add suggestions');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select lives_ok($$ update life_domains set sort_order = sort_order where key = 'faith' $$, 'admin edits domains');
select is((select count(*) from habit_library where name like 'اقتراح%'), 2::bigint, 'admin sees inactive suggestions');

-- ── Plan domains: up to three ─────────────────────────────────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m1'));
select lives_ok($$ select add_plan_domain((select id from life_domains where key = k)) from unnest(array['faith','self','family']) k $$, 'three plan domains');
select is((select count(*) from focus_areas where domain_id is not null), 3::bigint, 'three domain-linked focus areas');
select throws_like($$ select add_plan_domain((select id from life_domains where key = 'work')) $$, 'limit_reached%', 'a fourth is refused');
select lives_ok($$ insert into focus_areas (plan_id, title) values ('d4000000-0000-4000-8000-0000000000b1', 'مجال حرّ') $$, 'free-text areas are not counted');
select is(add_plan_domain((select id from life_domains where key = 'faith')),
  (select id from focus_areas where domain_id = (select id from life_domains where key = 'faith')), 'adding an existing domain returns its area');

-- ── Habit shape: domain follows the area; days; time ───────────────────────
insert into habits (id, plan_id, name, focus_area_id, created_at) values
  ('d4000000-0000-4000-8000-00000000d001', 'd4000000-0000-4000-8000-0000000000b1', 'ورد',
   (select id from focus_areas where domain_id = (select id from life_domains where key = 'faith')), now() - interval '20 days');
select is((select domain_id from habits where id = 'd4000000-0000-4000-8000-00000000d001'), (select id from life_domains where key = 'faith'),
  'a habit in a domain area carries the domain');
-- Habit scheduled on every weekday except today's.
insert into habits (id, plan_id, name, days, time_of_day, amount, created_at) values
  ('d4000000-0000-4000-8000-00000000d002', 'd4000000-0000-4000-8000-0000000000b1', 'مشي',
   127 - (1 << extract(dow from current_date)::int), 'evening', '٢٠ دقيقة', now() - interval '20 days');
select throws_ok($$ update habits set days = 0 where id = 'd4000000-0000-4000-8000-00000000d002' $$, '23514', null, 'at least one day');
select throws_ok($$ update habits set amount = repeat('x', 61) where id = 'd4000000-0000-4000-8000-00000000d002' $$, '23514', null, 'amount limited to 60');

-- ── «يومك» lists scheduled habits only ─────────────────────────────────────
select is((select count(*) from jsonb_array_elements(get_today()->'habits')), 1::bigint, '«يومك» skips a habit not scheduled today');
select is((get_today()->>'habits_total')::int, 1, 'total counts scheduled habits only');
select ok((get_today()->'habits'->0) ?& array['amount', 'time_of_day', 'week', 'week_scheduled'], '«يومك» includes shape and week');
select is(jsonb_array_length(get_today()->'habits'->0->'week'), 7, 'week has seven days');
select is((get_today()->'habits'->0->'week'->0->>'date')::date, current_date - ((extract(dow from current_date)::int + 1) % 7), 'week starts on Saturday');

-- ── Figures over scheduled days ────────────────────────────────────────────
-- «مشي»: done on every scheduled day of the last 14 days except today (not scheduled).
select tests.as_superuser();
select set_config('goodlife.seeding', 'on', true);
insert into habit_completions (habit_id, user_id, local_date, client_mutation_id)
  select 'd4000000-0000-4000-8000-00000000d002', (select id from k where name='m1'), d::date, gen_random_uuid()
  from generate_series(current_date - 14, current_date - 1, interval '1 day') d
  where habit_on((127 - (1 << extract(dow from current_date)::int))::smallint, d::date);
-- A stray completion on an unscheduled day (two weeks ago, same weekday as today) is not counted.
insert into habit_completions (habit_id, user_id, local_date, client_mutation_id)
  values ('d4000000-0000-4000-8000-00000000d002', (select id from k where name='m1'), current_date - 14, gen_random_uuid())
  on conflict do nothing;
select is((select possible_days from habit_rates((select id from k where name='m1'), 'd4000000-0000-4000-8000-0000000000c1', current_date - 13, current_date)
           where habit_id = 'd4000000-0000-4000-8000-00000000d002'), 12, 'possible = scheduled days (12 of 14)');
select is((select done_days from habit_rates((select id from k where name='m1'), 'd4000000-0000-4000-8000-0000000000c1', current_date - 14, current_date)
           where habit_id = 'd4000000-0000-4000-8000-00000000d002'), 12, 'done counts scheduled days only');
select is((select current_streak from habit_streaks((select id from k where name='m1'), 'd4000000-0000-4000-8000-0000000000c1')
           where habit_id = 'd4000000-0000-4000-8000-00000000d002'), 12, 'streak skips unscheduled days');
select is((select longest_streak from habit_streaks((select id from k where name='m1'), 'd4000000-0000-4000-8000-0000000000c1')
           where habit_id = 'd4000000-0000-4000-8000-00000000d002'), 12, 'longest streak over scheduled days');

-- ── Removing a plan domain keeps the habit and its domain ──────────────────
select tests.authenticate_as((select id from k where name='m1'));
select lives_ok($$ select remove_plan_domain((select id from life_domains where key = 'faith')) $$, 'member removes a plan domain');
select ok((select focus_area_id is null and domain_id = (select id from life_domains where key = 'faith')
           from habits where id = 'd4000000-0000-4000-8000-00000000d001'), 'its habit stays with the domain, outside the plan');
insert into k select 'faith_area', add_plan_domain((select id from life_domains where key = 'faith'));
select is((select focus_area_id from habits where id = 'd4000000-0000-4000-8000-00000000d001'), (select id from k where name = 'faith_area'),
  'adding the domain back gathers its habits');

select * from finish();
rollback;
