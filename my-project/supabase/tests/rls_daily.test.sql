-- T033: daily practice tables are self-only; date rules (data-model.md "Journey scoping and
-- date rules"); a member in two cohorts sees and writes only the current one.
begin;
\ir _helpers.psql
select plan(37);

-- ── Setup (superuser) ──────────────────────────────────────────────────────
create temp table k (name text primary key, id uuid, d date) on commit drop;
grant select on k to authenticated;
insert into k (name, d) values ('today', (now() at time zone 'Asia/Riyadh')::date);

insert into cohorts (id, name, start_date) values
  ('20000000-0000-4000-8000-0000000000c1', 'الدفعة الحالية', (select d from k where name='today') - 11),
  ('20000000-0000-4000-8000-0000000000c0', 'دفعة سابقة', (select d from k where name='today') - 400),
  ('20000000-0000-4000-8000-0000000000c3', 'دفعة منتهية', (select d from k where name='today') - 365),
  ('20000000-0000-4000-8000-0000000000c4', 'دفعة لم تبدأ', (select d from k where name='today') + 1);
insert into groups (id, cohort_id, name) values
  ('20000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-0000000000c1', 'المجموعة'),
  ('20000000-0000-4000-8000-0000000000a0', '20000000-0000-4000-8000-0000000000c0', 'المجموعة القديمة'),
  ('20000000-0000-4000-8000-0000000000a3', '20000000-0000-4000-8000-0000000000c3', 'مجموعة منتهية'),
  ('20000000-0000-4000-8000-0000000000a4', '20000000-0000-4000-8000-0000000000c4', 'مجموعة لاحقة');

insert into k (name, id) values
  ('m1', tests.create_user('m1@t.test')), ('m2', tests.create_user('m2@t.test')),
  ('fac', tests.create_user('fac@t.test', '{facilitator,member}')),
  ('admin', tests.create_user('admin@t.test', '{admin,member}')),
  ('m3', tests.create_user('m3@t.test')), ('m4', tests.create_user('m4@t.test'));

-- m1: past membership (ended) in the old cohort, current membership now.
insert into group_memberships (group_id, user_id, role, started_on, ended_on) values
  ('20000000-0000-4000-8000-0000000000a0', (select id from k where name='m1'), 'member', (select d from k where name='today') - 400, (select d from k where name='today') - 36);
select tests.join_group((select id from k where name='m1'), '20000000-0000-4000-8000-0000000000a1', 'member', (select d from k where name='today') - 11);
select tests.join_group((select id from k where name='m2'), '20000000-0000-4000-8000-0000000000a1');
select tests.join_group((select id from k where name='fac'), '20000000-0000-4000-8000-0000000000a1', 'facilitator');
select tests.join_group((select id from k where name='m3'), '20000000-0000-4000-8000-0000000000a3', 'member', (select d from k where name='today') - 365);
select tests.join_group((select id from k where name='m4'), '20000000-0000-4000-8000-0000000000a4', 'member', (select d from k where name='today'));

insert into plans (id, user_id, cohort_id) values
  ('20000000-0000-4000-8000-0000000000b1', (select id from k where name='m1'), '20000000-0000-4000-8000-0000000000c1'),
  ('20000000-0000-4000-8000-0000000000b0', (select id from k where name='m1'), '20000000-0000-4000-8000-0000000000c0'),
  ('20000000-0000-4000-8000-0000000000b2', (select id from k where name='m2'), '20000000-0000-4000-8000-0000000000c1'),
  ('20000000-0000-4000-8000-0000000000b3', (select id from k where name='m3'), '20000000-0000-4000-8000-0000000000c3'),
  ('20000000-0000-4000-8000-0000000000b4', (select id from k where name='m4'), '20000000-0000-4000-8000-0000000000c4');
insert into habits (id, plan_id, name, sort_order) values
  ('20000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-0000000000b1', 'قراءة', 1),
  ('20000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-0000000000b1', 'مشي', 2),
  ('20000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-0000000000b0', 'عادة قديمة', 1),
  ('20000000-0000-4000-8000-000000000021', '20000000-0000-4000-8000-0000000000b2', 'عادة م٢', 1),
  ('20000000-0000-4000-8000-000000000031', '20000000-0000-4000-8000-0000000000b3', 'عادة م٣', 1),
  ('20000000-0000-4000-8000-000000000041', '20000000-0000-4000-8000-0000000000b4', 'عادة م٤', 1);
insert into journey_challenges (journey_day, text) select n, 'تحدّي اليوم ' || n from generate_series(1, 15) n on conflict (journey_day) do nothing;
insert into closing_messages (text) values ('ما نويته اليوم تمّ. وغدًا يبدأ من حيث توقفت.');

-- ── Member m1 ──────────────────────────────────────────────────────────────
select tests.authenticate_as((select id from k where name='m1'));

select is(jsonb_array_length(get_today()->'habits'), 2, 'today lists only the current cohort''s habits');
select is((get_today()->>'journey_day')::int, 12, 'journey day 12');
select is((get_today('yesterday')->>'local_date')::date, (select d from k where name='today') - 1, 'yesterday view');
select is((select count(*) from journey_challenges), 12::bigint, 'journey challenges visible only up to today''s journey day');

select is((set_habit_done('20000000-0000-4000-8000-000000000011', (select d from k where name='today'), true, '20000000-0000-4000-8000-00000000aa01'))->>'done_count', '1', 'check a habit today');
select is((set_habit_done('20000000-0000-4000-8000-000000000011', (select d from k where name='today'), true, '20000000-0000-4000-8000-00000000aa01'))->>'done_count', '1', 'replaying the same mutation is idempotent');
select is((get_today()->>'habits_total')::int, 2, 'total counts active habits');
select lives_ok($$ select set_habit_done('20000000-0000-4000-8000-000000000011', (select d from k where name='today') - 1, true, gen_random_uuid()) $$, 'can log yesterday');
select throws_like($$ select set_habit_done('20000000-0000-4000-8000-000000000011', (select d from k where name='today') - 2, true, gen_random_uuid()) $$, 'date_not_editable%', 'cannot log two days ago online');
select lives_ok($$ select set_habit_done('20000000-0000-4000-8000-000000000012', ((now() - interval '2 days') at time zone 'Asia/Riyadh')::date, true, gen_random_uuid(), now() - interval '2 days') $$,
  'offline tap from 2 days ago is saved for its day');
select throws_like($$ select set_habit_done('20000000-0000-4000-8000-000000000012', ((now() - interval '8 days') at time zone 'Asia/Riyadh')::date, true, gen_random_uuid(), now() - interval '8 days') $$, 'date_not_editable%', 'offline tap older than 7 days is refused');
select throws_like($$ select set_habit_done('20000000-0000-4000-8000-000000000012', (select d from k where name='today') + 1, true, gen_random_uuid(), now() + interval '1 day') $$, 'date_not_editable%', 'future taps are refused');
select throws_like($$ select set_habit_done('20000000-0000-4000-8000-000000000010', (select d from k where name='today'), true, gen_random_uuid()) $$, 'date_not_editable%', 'cannot write to a past cohort''s habit');
select throws_ok($$ select set_habit_done('20000000-0000-4000-8000-000000000021', (select d from k where name='today'), true, gen_random_uuid()) $$,
  'P0001', 'not_found', 'cannot check another member''s habit');
select is((set_habit_done('20000000-0000-4000-8000-000000000011', (select d from k where name='today'), false, gen_random_uuid()))->>'done_count', '0', 'uncheck');
select is((select count(*) from habits), 3::bigint, 'member reads own habits incl. past journey');
select throws_ok($$ insert into habit_completions (habit_id, user_id, local_date, client_mutation_id) values ('20000000-0000-4000-8000-000000000011', auth.uid(), current_date, gen_random_uuid()) $$,
  '42501', null, 'no direct writes to completions');
select throws_ok($$ insert into habits (plan_id, name) values ('20000000-0000-4000-8000-0000000000b0', 'جديدة') $$,
  '42501', null, 'cannot add habits to a past journey''s plan');
select lives_ok($$ insert into habits (plan_id, name) values ('20000000-0000-4000-8000-0000000000b1', 'جديدة') $$, 'can add habits to the current plan');
select throws_ok($$ insert into habits (plan_id, name) values ('20000000-0000-4000-8000-0000000000b2', 'دخيلة') $$,
  '42501', null, 'cannot add habits to another member''s plan');

select lives_ok($$ select set_challenge_done('journey', (select d from k where name='today'), true, gen_random_uuid()) $$, 'mark journey challenge done');
select is((get_today()->'journey_challenge'->>'done')::boolean, true, 'journey challenge shows done');
select lives_ok($$ select set_own_challenge('أمشي ربع ساعة بعد العصر') $$, 'write own challenge');
select lives_ok($$ select set_challenge_done('own', (select d from k where name='today'), true, gen_random_uuid()) $$, 'mark own challenge done');
select is(get_today()->'own_challenge'->>'text', 'أمشي ربع ساعة بعد العصر', 'own challenge shown');
select throws_ok($$ select set_challenge_done('own', (select d from k where name='today') - 1, true, gen_random_uuid()) $$,
  'P0001', 'not_found', 'no own challenge yesterday');
select lives_ok($$ select set_intention('أن أكون حاضرًا مع أهلي') $$, 'set intention');
select is(get_today()->'day'->>'intention', 'أن أكون حاضرًا مع أهلي', 'intention shown');
select isnt((close_day('يوم هادئ'))->>'closing_message', null, 'closing the day returns a closing message');
select isnt((select closed_at from day_entries where user_id = auth.uid()), null, 'day recorded as closed');

-- ── Others cannot read m1's daily data ─────────────────────────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
select is((select count(*) from habits h join plans p on p.id = h.plan_id where p.user_id = (select id from k where name='m1')), 0::bigint, 'facilitator cannot read member habits');
select is((select count(*) from day_entries) + (select count(*) from own_challenges) + (select count(*) from habit_completions) + (select count(*) from challenge_completions) + (select count(*) from plans),
  0::bigint, 'facilitator cannot read entries, challenges, completions, plans');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m2'));
select is((select count(*) from day_entries) + (select count(*) from own_challenges) + (select count(*) from habits), 1::bigint, 'another member sees only own habit');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select is((select count(*) from day_entries) + (select count(*) from habits), 0::bigint, 'admin cannot read members'' personal entries');

-- ── Journey window ─────────────────────────────────────────────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m3'));
select throws_like($$ select set_habit_done('20000000-0000-4000-8000-000000000031', (select d from k where name='today'), true, gen_random_uuid()) $$, 'date_not_editable%', 'no writes after the journey ended');
select is((get_today()->>'journey_status'), 'ended', 'today reports the journey ended');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m4'));
select throws_like($$ select set_habit_done('20000000-0000-4000-8000-000000000041', (select d from k where name='today'), true, gen_random_uuid()) $$, 'date_not_editable%', 'no writes before the journey starts');

select * from finish();
rollback;
