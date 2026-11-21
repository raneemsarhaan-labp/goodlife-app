-- T086: month_figures (per-habit rate with archived cut-off, challenge counts, days closed) and
-- monthly_reviews (self-only; draft → completed with a snapshot; completed is read-only).
begin;
\ir _helpers.psql
select plan(16);

set local goodlife.seeding = 'on'; -- back-dated history for the test only
create temp table k (name text primary key, id uuid, d date) on commit drop;
grant select on k to authenticated;
-- m = first day of a full month in the past, entirely inside the cohort window and before today.
insert into k (name, d) values ('m', date_trunc('month', (now() at time zone 'Asia/Riyadh')::date - 35)::date);
insert into k (name, d) values ('len', null);
update k set d = (select (d + interval '1 month')::date - 1 from k where name = 'm') where name = 'len'; -- month end
insert into cohorts (id, name, start_date) values ('60000000-0000-4000-8000-0000000000c1', 'دفعة المراجعة', (select d from k where name='m') - 5);
insert into groups (id, cohort_id, name) values ('60000000-0000-4000-8000-0000000000a1', '60000000-0000-4000-8000-0000000000c1', 'مجموعة المراجعة');
insert into k (name, id) values ('m1', tests.create_user('m1@t.test')), ('m2', tests.create_user('m2@t.test')),
  ('fac', tests.create_user('fac@t.test', '{facilitator,member}'));
select tests.join_group((select id from k where name='m1'), '60000000-0000-4000-8000-0000000000a1', 'member', (select d from k where name='m') - 5);
select tests.join_group((select id from k where name='m2'), '60000000-0000-4000-8000-0000000000a1');
select tests.join_group((select id from k where name='fac'), '60000000-0000-4000-8000-0000000000a1', 'facilitator');
insert into plans (id, user_id, cohort_id) values
  ('60000000-0000-4000-8000-0000000000b1', (select id from k where name='m1'), '60000000-0000-4000-8000-0000000000c1');
insert into habits (id, plan_id, name, sort_order, created_at) values
  ('60000000-0000-4000-8000-0000000000d1', '60000000-0000-4000-8000-0000000000b1', 'قراءة', 1, (select d from k where name='m') - 5),
  ('60000000-0000-4000-8000-0000000000d2', '60000000-0000-4000-8000-0000000000b1', 'مشي', 2, (select d from k where name='m') - 5);
-- Habit «مشي» archived on day 10 of the month (local noon).
update habits set archived_at = ((select d from k where name='m') + 9 + time '12:00') at time zone 'Asia/Riyadh'
where id = '60000000-0000-4000-8000-0000000000d2';
insert into habit_completions (habit_id, user_id, local_date, client_mutation_id)
select '60000000-0000-4000-8000-0000000000d1', (select id from k where name='m1'), (select d from k where name='m') + i, gen_random_uuid() from generate_series(0, 19) i;
insert into habit_completions (habit_id, user_id, local_date, client_mutation_id)
select '60000000-0000-4000-8000-0000000000d2', (select id from k where name='m1'), (select d from k where name='m') + i, gen_random_uuid() from generate_series(0, 4) i;
insert into journey_challenges (journey_day, text) select n, 'تحدٍّ ' || n from generate_series(1, 60) n on conflict (journey_day) do nothing;
insert into challenge_completions (user_id, cohort_id, local_date, kind, journey_challenge_id, client_mutation_id)
select (select id from k where name='m1'), '60000000-0000-4000-8000-0000000000c1', (select d from k where name='m') + i, 'journey',
       (select id from journey_challenges where journey_day = 6 + i), gen_random_uuid() from generate_series(0, 2) i;
insert into own_challenges (id, user_id, cohort_id, local_date, text) values
  ('60000000-0000-4000-8000-0000000000e1', (select id from k where name='m1'), '60000000-0000-4000-8000-0000000000c1', (select d from k where name='m'), 'تحدٍّ ذاتي'),
  ('60000000-0000-4000-8000-0000000000e2', (select id from k where name='m1'), '60000000-0000-4000-8000-0000000000c1', (select d from k where name='m') + 1, 'تحدٍّ ذاتي ٢');
insert into challenge_completions (user_id, cohort_id, local_date, kind, own_challenge_id, client_mutation_id) values
  ((select id from k where name='m1'), '60000000-0000-4000-8000-0000000000c1', (select d from k where name='m'), 'own', '60000000-0000-4000-8000-0000000000e1', gen_random_uuid());
insert into day_entries (user_id, cohort_id, local_date, closed_at)
select (select id from k where name='m1'), '60000000-0000-4000-8000-0000000000c1', (select d from k where name='m') + i, now() from generate_series(0, 3) i;
insert into review_questions (text, sort_order) values ('ما الذي تقدّمت فيه هذا الشهر؟', 1), ('ما الذي تريد تعديله؟', 2);
reset goodlife.seeding;

-- ── Figures ────────────────────────────────────────────────────────────────
select tests.authenticate_as((select id from k where name='m1'));
create temp view f as select month_figures((select d from k where name='m')) as j;
select is((select (h->>'done_days')::int from f, jsonb_array_elements(j->'habits') h where h->>'name' = 'قراءة'), 20, 'reading: 20 days done');
select is((select (h->>'possible_days')::int from f, jsonb_array_elements(j->'habits') h where h->>'name' = 'قراءة'),
  (select d - (select d from k where name='m') + 1 from k where name='len'), 'reading: every day of the month counts');
select is((select (h->>'possible_days')::int from f, jsonb_array_elements(j->'habits') h where h->>'name' = 'مشي'), 10, 'archived habit counts only up to its archive day');
select is((select (h->>'done_days')::int from f, jsonb_array_elements(j->'habits') h where h->>'name' = 'مشي'), 5, 'archived habit: 5 days done');
select is((select (j->>'journey_done')::int from f), 3, 'journey challenges done');
select is((select (j->>'own_written')::int from f), 2, 'own challenges written');
select is((select (j->>'own_done')::int from f), 1, 'own challenges done');
select is((select (j->>'days_closed')::int from f), 4, 'days closed');

-- ── Reviews ────────────────────────────────────────────────────────────────
select lives_ok($$ select save_review((select d from k where name='m'),
  jsonb_build_object((select id from review_questions where text = 'ما الذي تقدّمت فيه هذا الشهر؟')::text, 'القراءة'), false) $$, 'save a draft');
select is((select status::text from monthly_reviews), 'draft', 'draft stored');
select lives_ok($$ select save_review((select d from k where name='m'),
  jsonb_build_object((select id from review_questions where text = 'ما الذي تقدّمت فيه هذا الشهر؟')::text, 'القراءة والمشي',
                     (select id from review_questions where text = 'ما الذي تريد تعديله؟')::text, 'النوم'), true) $$, 'complete the review');
select is((select (figures_snapshot->>'days_closed')::int from monthly_reviews), 4, 'snapshot of the month''s figures stored');
select is((select a->>'question_text' from monthly_reviews, jsonb_array_elements(answers) a where a->>'answer' = 'النوم'), 'ما الذي تريد تعديله؟', 'question text copied into the answers');
select throws_like($$ select save_review((select d from k where name='m'), '{}'::jsonb, true) $$, 'conflict%', 'a completed review is read-only');

select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
select is((select count(*) from monthly_reviews), 0::bigint, 'facilitator cannot read reviews');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m2'));
select is((select count(*) from monthly_reviews), 0::bigint, 'another member cannot read reviews');

select * from finish();
rollback;
