-- T097: member_stats, group_stats, group_member_signals (expected values: fixtures/stats_expected.json).
begin;
\ir _helpers.psql
select plan(22);

set local goodlife.seeding = 'on';
create temp table k (name text primary key, id uuid, d date) on commit drop;
grant select on k to authenticated;
insert into k (name, d) values ('T', (now() at time zone 'Asia/Riyadh')::date);
create function pg_temp.T() returns date language sql as $$ select d from k where name = 'T' $$;
grant execute on function pg_temp.T() to authenticated;

insert into cohorts (id, name, start_date) values ('70000000-0000-4000-8000-0000000000c1', 'دفعة الإحصاءات', pg_temp.T() - 40);
insert into groups (id, cohort_id, name) values
  ('70000000-0000-4000-8000-0000000000a1', '70000000-0000-4000-8000-0000000000c1', 'المجموعة ١'),
  ('70000000-0000-4000-8000-0000000000a2', '70000000-0000-4000-8000-0000000000c1', 'المجموعة ٢');
insert into k (name, id) values
  ('m1', tests.create_user('m1@t.test')), ('m2', tests.create_user('m2@t.test')), ('m3', tests.create_user('m3@t.test')),
  ('fac', tests.create_user('fac@t.test', '{facilitator,member}')), ('fac2', tests.create_user('fac2@t.test', '{facilitator,member}')),
  ('admin', tests.create_user('admin@t.test', '{admin,member}'));
select tests.join_group((select id from k where name='m1'), '70000000-0000-4000-8000-0000000000a1', 'member', pg_temp.T() - 40);
select tests.join_group((select id from k where name='m2'), '70000000-0000-4000-8000-0000000000a1', 'member', pg_temp.T() - 40);
insert into group_memberships (group_id, user_id, role, started_on, ended_on) values
  ('70000000-0000-4000-8000-0000000000a2', (select id from k where name='m3'), 'member', pg_temp.T() - 40, pg_temp.T() - 10);
select tests.join_group((select id from k where name='m3'), '70000000-0000-4000-8000-0000000000a1', 'member', pg_temp.T() - 9);
select tests.join_group((select id from k where name='fac'), '70000000-0000-4000-8000-0000000000a1', 'facilitator');
select tests.join_group((select id from k where name='fac2'), '70000000-0000-4000-8000-0000000000a2', 'facilitator');

insert into plans (id, user_id, cohort_id) values
  ('70000000-0000-4000-8000-0000000000b1', (select id from k where name='m1'), '70000000-0000-4000-8000-0000000000c1'),
  ('70000000-0000-4000-8000-0000000000b2', (select id from k where name='m2'), '70000000-0000-4000-8000-0000000000c1'),
  ('70000000-0000-4000-8000-0000000000b3', (select id from k where name='m3'), '70000000-0000-4000-8000-0000000000c1');
insert into habits (id, plan_id, name, sort_order, created_at) values
  ('70000000-0000-4000-8000-0000000000d1', '70000000-0000-4000-8000-0000000000b1', 'قراءة', 1, now() - interval '40 days'),
  ('70000000-0000-4000-8000-0000000000d2', '70000000-0000-4000-8000-0000000000b1', 'مشي', 2, now() - interval '40 days'),
  ('70000000-0000-4000-8000-0000000000d3', '70000000-0000-4000-8000-0000000000b1', 'نوم مبكر', 3, now() - interval '40 days'),
  ('70000000-0000-4000-8000-0000000000d4', '70000000-0000-4000-8000-0000000000b2', 'تأمل', 1, now() - interval '40 days'),
  ('70000000-0000-4000-8000-0000000000d5', '70000000-0000-4000-8000-0000000000b3', 'رياضة', 1, now() - interval '40 days');
update habits set archived_at = ((pg_temp.T() - 10) + time '12:00') at time zone 'Asia/Riyadh' where id = '70000000-0000-4000-8000-0000000000d3';

create function pg_temp.done(p_habit uuid, p_user text, p_from int, p_to int) returns void language sql as $$
  insert into habit_completions (habit_id, user_id, local_date, client_mutation_id)
  select p_habit, (select id from k where name = p_user), pg_temp.T() - i, gen_random_uuid() from generate_series(p_to, p_from) i;
$$;
select pg_temp.done('70000000-0000-4000-8000-0000000000d1', 'm1', 29, 10);  -- reading: 20 days
select pg_temp.done('70000000-0000-4000-8000-0000000000d2', 'm1', 4, 0);    -- walking: last 5 days
select pg_temp.done('70000000-0000-4000-8000-0000000000d2', 'm1', 20, 14);  -- walking: an earlier 7-day run
select pg_temp.done('70000000-0000-4000-8000-0000000000d3', 'm1', 15, 11);  -- sleep: 5 days before archive
select pg_temp.done('70000000-0000-4000-8000-0000000000d4', 'm2', 29, 20);  -- m2: 10 days, none recent
select pg_temp.done('70000000-0000-4000-8000-0000000000d5', 'm3', 29, 0);   -- m3: every day
insert into journey_challenges (journey_day, text) select n, 'تحدٍّ ' || n from generate_series(1, 41) n on conflict (journey_day) do nothing;
insert into challenge_completions (user_id, cohort_id, local_date, kind, journey_challenge_id, client_mutation_id)
select (select id from k where name='m1'), '70000000-0000-4000-8000-0000000000c1', pg_temp.T() - i, 'journey',
       (select id from journey_challenges where journey_day = 41 - i), gen_random_uuid() from generate_series(1, 3) i;
insert into own_challenges (id, user_id, cohort_id, local_date, text) values
  ('70000000-0000-4000-8000-0000000000e1', (select id from k where name='m1'), '70000000-0000-4000-8000-0000000000c1', pg_temp.T() - 1, 'تحدٍّ ذاتي'),
  ('70000000-0000-4000-8000-0000000000e2', (select id from k where name='m1'), '70000000-0000-4000-8000-0000000000c1', pg_temp.T() - 2, 'تحدٍّ ذاتي ٢');
insert into challenge_completions (user_id, cohort_id, local_date, kind, own_challenge_id, client_mutation_id) values
  ((select id from k where name='m1'), '70000000-0000-4000-8000-0000000000c1', pg_temp.T() - 1, 'own', '70000000-0000-4000-8000-0000000000e1', gen_random_uuid());
insert into day_entries (user_id, cohort_id, local_date, closed_at)
select (select id from k where name='m1'), '70000000-0000-4000-8000-0000000000c1', pg_temp.T() - i, now() from generate_series(1, 4) i;
reset goodlife.seeding;

-- ── Member stats (m1, last 30 days) ────────────────────────────────────────
select tests.authenticate_as((select id from k where name='m1'));
create temp view s as select member_stats(pg_temp.T() - 29, pg_temp.T()) as j;
create function pg_temp.h(p_name text, p_key text) returns text language sql as $$
  select h ->> p_key from s, jsonb_array_elements(j -> 'habits') h where h ->> 'name' = p_name
$$;
select is(pg_temp.h('قراءة', 'done_days')::int, 20, 'reading: 20 days done');
select is(pg_temp.h('قراءة', 'possible_days')::int, 30, 'reading: 30 possible days');
select is(round(pg_temp.h('قراءة', 'done_days')::numeric / pg_temp.h('قراءة', 'possible_days')::numeric, 2), 0.67, 'reading: 67%');
select is(pg_temp.h('مشي', 'current_streak')::int, 5, 'walking: current streak 5');
select is(pg_temp.h('مشي', 'longest_streak')::int, 7, 'walking: longest streak 7');
select is(pg_temp.h('نوم مبكر', 'possible_days')::int, 20, 'archived habit counts until its archive day');
select is(pg_temp.h('نوم مبكر', 'done_days')::int, 5, 'archived habit: 5 days done');
select is((select (j->>'journey_done')::int from s), 3, 'journey challenges done');
select is((select (j->>'own_written')::int from s), 2, 'own challenges written');
select is((select (j->>'own_done')::int from s), 1, 'own challenges done');
select is((select (j->>'days_closed')::int from s), 4, 'days closed');
select throws_like($$ select group_stats('70000000-0000-4000-8000-0000000000a1', pg_temp.T() - 29, pg_temp.T()) $$, 'forbidden%', 'a member cannot read group stats');

-- ── Facilitator of G1 ──────────────────────────────────────────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
create temp view g as select group_stats('70000000-0000-4000-8000-0000000000a1', pg_temp.T() - 29, pg_temp.T()) as j;
select is((select (j->>'members')::int from g), 3, 'group has 3 members in the period');
select is((select round((j->>'avg_completion')::numeric, 2) from g), 0.60, 'average completion across members (moved member counted from the move date)');
select is((select (j->>'active_7d')::int from g), 2, 'members active in the last 7 days');
select is((select round(completion_rate, 2) from group_member_signals('70000000-0000-4000-8000-0000000000a1', pg_temp.T() - 29, pg_temp.T())
           where user_id = (select id from k where name='m1')), 0.46, 'member signal: completion rate');
select is((select days_closed from group_member_signals('70000000-0000-4000-8000-0000000000a1', pg_temp.T() - 29, pg_temp.T())
           where user_id = (select id from k where name='m1')), 4, 'member signal: days closed');
select is((select last_active from group_member_signals('70000000-0000-4000-8000-0000000000a1', pg_temp.T() - 29, pg_temp.T())
           where user_id = (select id from k where name='m1')), pg_temp.T(), 'member signal: last active');
select is((select count(*) from group_member_signals('70000000-0000-4000-8000-0000000000a1', pg_temp.T() - 29, pg_temp.T())), 3::bigint, 'signals for each current member');
select is((select count(*) from habits h join plans p on p.id = h.plan_id where p.user_id = (select id from k where name='m1')), 0::bigint,
  'facilitator still cannot read habit names');

-- ── Other group's facilitator and admin ────────────────────────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac2'));
select throws_like($$ select group_member_signals('70000000-0000-4000-8000-0000000000a1', pg_temp.T() - 29, pg_temp.T()) $$, 'forbidden%', 'another group''s facilitator is refused');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select lives_ok($$ select group_stats('70000000-0000-4000-8000-0000000000a1', pg_temp.T() - 29, pg_temp.T()) $$, 'admin can read group stats');

select * from finish();
rollback;
