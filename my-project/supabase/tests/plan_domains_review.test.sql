-- T002 (spec 005): plan texts by domain, plan review, challenge library and the daily draw.
begin;
\ir _helpers.psql
select plan(26);

create temp table k (name text primary key, id uuid) on commit drop;
grant select, insert on k to authenticated;
insert into cohorts (id, name, start_date) values ('e5000000-0000-4000-8000-0000000000c1', 'دفعة المراجعة', current_date - 40);
insert into groups (id, cohort_id, name) values ('e5000000-0000-4000-8000-0000000000a1', 'e5000000-0000-4000-8000-0000000000c1', 'مجموعة المراجعة');
insert into k values ('admin', tests.create_user('admin@t.test', '{admin,member}', 'UTC')), ('fac', tests.create_user('fac@t.test', '{facilitator,member}', 'UTC')),
  ('m1', tests.create_user('m1@t.test', '{member}', 'UTC')), ('m2', tests.create_user('m2@t.test', '{member}', 'UTC'));
select tests.join_group((select id from k where name='fac'), 'e5000000-0000-4000-8000-0000000000a1', 'facilitator');
select tests.join_group((select id from k where name=n), 'e5000000-0000-4000-8000-0000000000a1', 'member', current_date - 40) from unnest(array['m1','m2']) n;
insert into plans (id, user_id, cohort_id, created_at) values
  ('e5000000-0000-4000-8000-0000000000b1', (select id from k where name='m1'), 'e5000000-0000-4000-8000-0000000000c1', now() - interval '40 days'),
  ('e5000000-0000-4000-8000-0000000000b2', (select id from k where name='m2'), 'e5000000-0000-4000-8000-0000000000c1', now() - interval '5 days');
-- No journey challenges in this test: every day draws from the library.
delete from journey_challenges;
delete from challenge_library;
insert into challenge_library (domain_id, style, title, prompt, habit_name, sort_order)
  select d.id, 'action', 'تحدٍّ ' || d.key || ' ' || i, 'سؤال', 'عادة ' || i, i
  from life_domains d, generate_series(1, 4) i where d.key in ('faith', 'self', 'work');

-- ── Plan texts are private ────────────────────────────────────────────────
select tests.authenticate_as((select id from k where name='m1'));
select lives_ok($$ update plans set identity = 'أنا طالب علمٍ يحبّ أهله.' where user_id = auth.uid() $$, 'member writes «هويّتي»');
select throws_ok($$ update plans set identity = repeat('ه', 2001) where user_id = auth.uid() $$, '23514', null, 'identity limited to 2,000');
select lives_ok($$ select add_plan_domain((select id from life_domains where key = k)) from unnest(array['faith','self']) k $$, 'two plan domains');
select lives_ok($$ update focus_areas set description = 'من أريد أن أكون', sign = 'العلامة', review_on = current_date + 30 where domain_id is not null $$,
  'member writes domain texts');
select throws_ok($$ update focus_areas set sign = repeat('ع', 301) where domain_id is not null $$, '23514', null, 'sign limited to 300');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
select is((select count(*) from plans where identity <> ''), 0::bigint, 'facilitator sees no identity');
select is((select count(*) from focus_areas where sign is not null), 0::bigint, 'facilitator sees no domain texts');

-- ── Library roles ─────────────────────────────────────────────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m1'));
select is((select count(*) from challenge_library), 12::bigint, 'members read active library challenges');
select throws_ok($$ insert into challenge_library (domain_id, title) select id, 'من عضو' from life_domains limit 1 $$, '42501', null, 'members cannot add');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select lives_ok($$ insert into challenge_library (domain_id, title, active) select id, 'تحدٍّ موقوف', false from life_domains where key = 'faith' $$, 'admin adds');

-- ── The daily draw ─────────────────────────────────────────────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m1'));
insert into k select 'pick1', (get_today()->'library_challenge'->>'id')::uuid;
select isnt((select id from k where name='pick1'), null, '«يومك» shows a library challenge on a day without a journey challenge');
select is((get_today()->'library_challenge'->>'id')::uuid, (select id from k where name='pick1'), 'the same challenge on every open');
select ok((select d.key in ('faith', 'self') from challenge_library c join life_domains d on d.id = c.domain_id where c.id = (select id from k where name='pick1')),
  'drawn from the plan''s domains');
select is((get_today()->'library_challenge'->>'can_refresh')::boolean, true, 'refresh offered');
select lives_ok($$ select refresh_challenge() $$, 'member draws another');
select isnt((get_today()->'library_challenge'->>'id')::uuid, (select id from k where name='pick1'), 'a different challenge after refresh');
select lives_ok($$ select refresh_challenge(); select refresh_challenge(); $$, 'up to three refreshes');
select throws_like($$ select refresh_challenge() $$, 'limit_reached%', 'a fourth refresh is refused');
select is(library_challenge_for((select id from k where name='m2'), current_date), null, 'members cannot see another member''s draw');

-- Done in the day's challenge slot; counts in figures.
insert into k select 'pick4', (get_today()->'library_challenge'->>'id')::uuid;
select lives_ok($$ select set_challenge_done('journey', current_date, true, gen_random_uuid()) $$, 'member completes the library challenge');
select is((select library_challenge_id from challenge_completions where user_id = auth.uid() and local_date = current_date),
  (select id from k where name='pick4'), 'completion records the library challenge');
select ok((select (m->>'journey_done')::int = 1 and (m->>'journey_total')::int = (m->>'days')::int from member_stats(current_date, current_date) m),
  'stats count library days and completions');

-- ── Plan review ────────────────────────────────────────────────────────────
select is((get_today()->>'plan_review_due')::boolean, true, 'due 30+ days after the plan was created');
select throws_like($$ select complete_plan_review(current_date) $$, 'invalid_input%', 'next review must be after today');
select lives_ok($$ select complete_plan_review(current_date + 30) $$, 'review completed with «بعد شهر»');
select is((get_today()->>'plan_review_due')::boolean, false, 'not due after the review');

select * from finish();
rollback;
