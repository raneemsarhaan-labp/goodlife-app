-- T002 (spec 006): streaks with weekly grace, consecutive days, buckets, plan vs others, life areas.
begin;
\ir _helpers.psql
select plan(14);

create temp table k (name text primary key, id uuid) on commit drop;
grant select on k to authenticated;
insert into cohorts (id, name, start_date) values ('f6000000-0000-4000-8000-0000000000c1', 'دفعة الأثر', current_date - 60);
insert into groups (id, cohort_id, name) values ('f6000000-0000-4000-8000-0000000000a1', 'f6000000-0000-4000-8000-0000000000c1', 'مجموعة الأثر');
insert into k values ('m1', tests.create_user('m1@t.test', '{member}', 'UTC')), ('m2', tests.create_user('m2@t.test', '{member}', 'UTC'));
select tests.join_group((select id from k where name=n), 'f6000000-0000-4000-8000-0000000000a1', 'member', current_date - 60) from unnest(array['m1','m2']) n;
insert into plans (id, user_id, cohort_id) values ('f6000000-0000-4000-8000-0000000000b1', (select id from k where name='m1'), 'f6000000-0000-4000-8000-0000000000c1');
insert into focus_areas (id, plan_id, title, domain_id) values
  ('f6000000-0000-4000-8000-0000000000f1', 'f6000000-0000-4000-8000-0000000000b1', 'النفس', (select id from life_domains where key = 'self'));
-- Three daily habits created 30 days ago: one in the plan domain, two outside.
insert into habits (id, plan_id, name, focus_area_id, domain_id, created_at) values
  ('f6000000-0000-4000-8000-00000000d001', 'f6000000-0000-4000-8000-0000000000b1', 'نعمة الغفران', 'f6000000-0000-4000-8000-0000000000f1', null, now() - interval '30 days'),
  ('f6000000-0000-4000-8000-00000000d002', 'f6000000-0000-4000-8000-0000000000b1', 'انقطاع مرتين', null, (select id from life_domains where key = 'work'), now() - interval '30 days'),
  ('f6000000-0000-4000-8000-00000000d003', 'f6000000-0000-4000-8000-0000000000b1', 'لا شيء', null, null, now() - interval '30 days');
select set_config('goodlife.seeding', 'on', true);
-- d001: done the last 10 days except one day this week (not today) → grace keeps the streak.
-- The skipped day is yesterday when today is not Saturday (the week's first day), else none skipped.
create function pg_temp.skip() returns date language sql as $$
  select case when extract(dow from current_date)::int = 6 then null else current_date - 1 end $$;
insert into habit_completions (habit_id, user_id, local_date, client_mutation_id)
  select 'f6000000-0000-4000-8000-00000000d001', (select id from k where name='m1'), current_date - i, gen_random_uuid()
  from generate_series(0, 9) i where current_date - i is distinct from pg_temp.skip();
-- d002: done 4–13 days ago, then missed 3, 2 and 1 days ago: at most one of those can be forgiven,
-- so the streak is broken whichever weeks they fall in.
insert into habit_completions (habit_id, user_id, local_date, client_mutation_id)
  select 'f6000000-0000-4000-8000-00000000d002', (select id from k where name='m1'), current_date - i, gen_random_uuid()
  from generate_series(4, 13) i;

-- Internal streak function, checked as the test superuser.
select ok((select current_streak from habit_streak_details((select id from k where name='m1'), 'f6000000-0000-4000-8000-0000000000c1')
           where habit_id = 'f6000000-0000-4000-8000-00000000d001') >= 9, 'one missed day this week is forgiven');
select is((select grace_this_week from habit_streak_details((select id from k where name='m1'), 'f6000000-0000-4000-8000-0000000000c1')
           where habit_id = 'f6000000-0000-4000-8000-00000000d001'), pg_temp.skip() is not null, '«استُعمل الغفران» flag this week');
select is((select current_streak from habit_streak_details((select id from k where name='m1'), 'f6000000-0000-4000-8000-0000000000c1')
           where habit_id = 'f6000000-0000-4000-8000-00000000d002'), 0, 'three missed days break the streak');
select is((select longest_streak from habit_streak_details((select id from k where name='m1'), 'f6000000-0000-4000-8000-0000000000c1')
           where habit_id = 'f6000000-0000-4000-8000-00000000d002'), 10, 'longest streak kept');
select tests.authenticate_as((select id from k where name='m1'));
select is((member_stats(current_date - 6, current_date)->'habits'->0->>'grace_this_week') is not null, true, 'member stats carry the grace flag');

-- Insights
select is((member_insights(current_date - 6, current_date)->>'consecutive_days')::int,
  case when pg_temp.skip() is null then 14 else 1 end, 'consecutive days with at least one habit done');
select is((member_insights(current_date - 6, current_date)->>'active_habits')::int, 3, 'active habits');
select is(jsonb_array_length(member_insights(current_date - 6, current_date)->'buckets'), 7, 'week → 7 daily buckets');
select ok(jsonb_array_length(member_insights(current_date - 29, current_date)->'buckets') between 5 and 6, 'month-sized range → weekly buckets');
select ok(jsonb_array_length(member_insights(current_date - 60, current_date)->'buckets') between 2 and 3, 'longer range → monthly buckets');
select is((member_insights(current_date - 6, current_date)->'buckets'->6->>'possible')::int, 3, 'a day''s bucket counts each scheduled habit');
select ok((select (p->>'plan_possible')::int > 0 and (p->>'other_possible')::int > 0 from (select member_insights(current_date - 6, current_date)->'plan_vs_other' p) x),
  'plan vs others split');
select is((select count(*) from jsonb_array_elements(member_insights(current_date - 6, current_date)->'domains')), 7::bigint, 'all seven domains listed, empty ones too');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m2'));
select is(member_insights(current_date - 6, current_date)->>'active_habits', '0', 'each member sees only their own figures');

select * from finish();
rollback;
