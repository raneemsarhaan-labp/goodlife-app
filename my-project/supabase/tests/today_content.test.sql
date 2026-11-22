-- T003 (spec 003): desired state, «وقفة تأمل», activity sessions and registration, «يومك» card, export.
-- Constitution III (a test per permission rule) and IV (reflections stay private).
begin;
\ir _helpers.psql
select plan(45);

create temp table k (name text primary key, id uuid) on commit drop;
grant select, insert on k to authenticated;
insert into cohorts (id, name, start_date) values ('c3000000-0000-4000-8000-0000000000c1', 'دفعة المحتوى', current_date - 5);
insert into groups (id, cohort_id, name) values
  ('c3000000-0000-4000-8000-0000000000a1', 'c3000000-0000-4000-8000-0000000000c1', 'مجموعة الميسّر'),
  ('c3000000-0000-4000-8000-0000000000a2', 'c3000000-0000-4000-8000-0000000000c1', 'مجموعة أخرى');
insert into k values
  ('admin', tests.create_user('admin@t.test', '{admin,member}')),
  ('fac', tests.create_user('fac@t.test', '{facilitator,member}')),
  ('m1', tests.create_user('m1@t.test')), ('m2', tests.create_user('m2@t.test')),
  ('m3', tests.create_user('m3@t.test')), ('m4', tests.create_user('m4@t.test'));
select tests.join_group((select id from k where name='fac'), 'c3000000-0000-4000-8000-0000000000a1', 'facilitator');
select tests.join_group((select id from k where name=n), 'c3000000-0000-4000-8000-0000000000a1') from unnest(array['m1','m2','m3']) n;
select tests.join_group((select id from k where name='m4'), 'c3000000-0000-4000-8000-0000000000a2');
insert into plans (user_id, cohort_id) select id, 'c3000000-0000-4000-8000-0000000000c1' from k where name in ('m1','m2','m3','m4');

-- Activity open for registration: group a1, online, capacity 2, four weekly sessions from tomorrow.
insert into activities (id, title, starts_at, registration_open, capacity, mode, created_by)
  values ('c3000000-0000-4000-8000-0000000000e1', 'نشاط قراءة: أمراض القلوب', now() + interval '1 day', true, 2, 'online', (select id from k where name='admin'));
insert into activity_audiences (activity_id, group_id) values ('c3000000-0000-4000-8000-0000000000e1', 'c3000000-0000-4000-8000-0000000000a1');
delete from activity_sessions where activity_id = 'c3000000-0000-4000-8000-0000000000e1';
insert into activity_sessions (activity_id, starts_at, ends_at)
  select 'c3000000-0000-4000-8000-0000000000e1', now() + (i * 7 + 1) * interval '1 day', now() + (i * 7 + 1) * interval '1 day' + interval '1 hour'
  from generate_series(0, 3) i;
insert into activity_links (activity_id, meeting_url) values ('c3000000-0000-4000-8000-0000000000e1', 'https://meet.example.test/qulub');
-- Cohort-wide open activity (for facilitator scoping), closed activity, started-but-not-over activity, finished activity.
insert into activities (id, title, starts_at, registration_open, created_by) values
  ('c3000000-0000-4000-8000-0000000000e2', 'لقاء الدفعة', now() + interval '2 days', true, (select id from k where name='admin')),
  ('c3000000-0000-4000-8000-0000000000e3', 'لقاء بلا تسجيل', now() + interval '2 days', false, (select id from k where name='admin')),
  ('c3000000-0000-4000-8000-0000000000e4', 'سلسلة بدأت', now() - interval '1 day', true, (select id from k where name='admin')),
  ('c3000000-0000-4000-8000-0000000000e5', 'سلسلة انتهت', now() - interval '3 days', true, (select id from k where name='admin'));
insert into activity_audiences (activity_id, cohort_id)
  select id, 'c3000000-0000-4000-8000-0000000000c1' from activities where id::text like 'c3000000-0000-4000-8000-0000000000e_' and id <> 'c3000000-0000-4000-8000-0000000000e1';
insert into activity_sessions (activity_id, starts_at) values ('c3000000-0000-4000-8000-0000000000e4', now() + interval '6 days');

-- ── Sessions keep the activity's start and end ────────────────────────────
select is((select count(*) from activity_sessions where activity_id = 'c3000000-0000-4000-8000-0000000000e3'), 1::bigint,
  'an activity created without sessions gets one session');
select is((select starts_at from activities where id = 'c3000000-0000-4000-8000-0000000000e1'),
  (select min(starts_at) from activity_sessions where activity_id = 'c3000000-0000-4000-8000-0000000000e1'), 'starts_at follows the first session');
select is((select ends_at from activities where id = 'c3000000-0000-4000-8000-0000000000e1'),
  (select max(ends_at) from activity_sessions where activity_id = 'c3000000-0000-4000-8000-0000000000e1'), 'ends_at follows the last session');

-- ── Desired state and reflections (m1) ─────────────────────────────────────
select tests.authenticate_as((select id from k where name='m1'));
select lives_ok($$ update plans set desired_state = 'أستيقظ ولي وقتٌ لنفسي قبل أن يبدأ يومي مع الناس.' where user_id = auth.uid() $$, 'member writes own desired state');
select throws_ok($$ update plans set desired_state = repeat('أ', 2001) where user_id = auth.uid() $$, '23514', null, 'desired state limited to 2,000 characters');
select lives_ok($$ insert into k select 'r1', add_reflection('اليوم أخذت وقتًا لنفسي بعد الفجر.', 'c3000000-0000-4000-8000-00000000f001') $$, 'member saves a reflection');
select is(add_reflection('نص مكرر', 'c3000000-0000-4000-8000-00000000f001'), (select id from k where name='r1'), 'same client id is saved once');
select is((select count(*) from reflections), 1::bigint, 'one reflection stored');
select is((select desired_state_snapshot from reflections), 'أستيقظ ولي وقتٌ لنفسي قبل أن يبدأ يومي مع الناس.', 'reflection keeps the desired-state wording');
select is((select local_date from reflections), user_local_date(auth.uid()), 'dated with the member''s local date');
insert into k select 'r2', add_reflection('من الأمس', gen_random_uuid(), user_local_date(auth.uid()) - 2);
insert into k select 'r3', add_reflection('قديم جدًا', gen_random_uuid(), user_local_date(auth.uid()) - 30);
select is((select local_date from reflections where id = (select id from k where name='r2')),
  user_local_date(auth.uid()) - 2, 'offline replay keeps a date within 7 days');
select is((select local_date from reflections where id = (select id from k where name='r3')),
  user_local_date(auth.uid()), 'older dates fall back to today');
select throws_like($$ select add_reflection('   ', gen_random_uuid()) $$, 'invalid_input%', 'empty reflection rejected');
select throws_like($$ select add_reflection(repeat('ت', 501), gen_random_uuid()) $$, 'invalid_input%', 'reflection limited to 500 characters');
select throws_ok($$ insert into reflections (user_id, cohort_id, local_date, text, client_mutation_id)
  values (auth.uid(), 'c3000000-0000-4000-8000-0000000000c1', current_date, 'مباشر', gen_random_uuid()) $$, '42501', null, 'no direct insert');
select ok(exists (select 1 from my_reflections() where kind = 'pause'), 'history lists «وقفة تأمل»');

select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
select is((select count(*) from reflections), 0::bigint, 'facilitator sees no reflections');
select is((select count(*) from plans where desired_state <> ''), 0::bigint, 'facilitator sees no desired state');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select is((select count(*) from reflections), 0::bigint, 'admin sees no reflections');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m2'));
select is((select count(*) from reflections), 0::bigint, 'another member sees no reflections');

-- ── Registration (m1, m2, m3 in group a1; m4 in group a2) ─────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m1'));
select is((activity_details('c3000000-0000-4000-8000-0000000000e1')->>'places_left')::int, 2, 'details show places left');
select is(activity_details('c3000000-0000-4000-8000-0000000000e1')->>'meeting_url', null, 'no link before registering');
select is((select count(*) from activity_links), 0::bigint, 'link table hidden before registering');
select lives_ok($$ select register_for_activity('c3000000-0000-4000-8000-0000000000e1') $$, 'member registers');
select is(activity_details('c3000000-0000-4000-8000-0000000000e1')->>'meeting_url', 'https://meet.example.test/qulub', 'link shown after registering');
select is(jsonb_array_length(get_today()->'registered_activities'), 1, '«يومك» lists the registered activity');
select lives_ok($$ select dismiss_activity_card('c3000000-0000-4000-8000-0000000000e1') $$, 'member closes the card');
select is((get_today()->'registered_activities'->0->>'dismissed_on')::date, user_local_date(auth.uid()), 'closing is recorded for today');

select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m2'));
select lives_ok($$ select register_for_activity('c3000000-0000-4000-8000-0000000000e1') $$, 'second member takes the last place');
select is((select count(*) from activity_registrations), 1::bigint, 'member sees only own registration rows');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m3'));
select throws_like($$ select register_for_activity('c3000000-0000-4000-8000-0000000000e1') $$, 'limit_reached%', 'full activity refuses registration');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m2'));
select lives_ok($$ select cancel_activity_registration('c3000000-0000-4000-8000-0000000000e1') $$, 'member cancels');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m3'));
select lives_ok($$ select register_for_activity('c3000000-0000-4000-8000-0000000000e1') $$, 'freed place can be taken');
select throws_like($$ select register_for_activity('c3000000-0000-4000-8000-0000000000e3') $$, 'conflict%', 'activity without registration refuses');
select lives_ok($$ select register_for_activity('c3000000-0000-4000-8000-0000000000e4') $$, 'can join after the first session, before the last');
select throws_like($$ select register_for_activity('c3000000-0000-4000-8000-0000000000e5') $$, 'conflict%', 'cannot join after the last session started');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m4'));
select throws_like($$ select register_for_activity('c3000000-0000-4000-8000-0000000000e1') $$, 'not_found%', 'outside the audience: not found');
select lives_ok($$ select register_for_activity('c3000000-0000-4000-8000-0000000000e2') $$, 'other group joins the cohort-wide activity');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m1'));
select lives_ok($$ select register_for_activity('c3000000-0000-4000-8000-0000000000e2') $$, 'm1 joins the cohort-wide activity');
select throws_like($$ select * from activity_registrations('c3000000-0000-4000-8000-0000000000e2') $$, 'forbidden%', 'members cannot list registrations');

-- ── Organizers ─────────────────────────────────────────────────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
select is((select count(*) from activity_registrations('c3000000-0000-4000-8000-0000000000e2')), 1::bigint, 'facilitator sees only own group''s registrations');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select is((select count(*) from activity_registrations('c3000000-0000-4000-8000-0000000000e2')), 2::bigint, 'admin sees all registrations');

select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
insert into k select 'two', save_activity(null, 'حلقة من جلستين', null, null, null, null,
  array['c3000000-0000-4000-8000-0000000000a1']::uuid[], null,
  jsonb_build_array(jsonb_build_object('starts_at', now() + interval '1 day'), jsonb_build_object('starts_at', now() + interval '8 days')),
  true, 10, 'online', 'https://meet.example.test/halaqa');
select is((select count(*) from activity_sessions where activity_id = (select id from k where name='two')), 2::bigint,
  'facilitator saves a two-session activity for own group');
select is((select meeting_url from activity_links where activity_id = (select id from k where name='two')), 'https://meet.example.test/halaqa',
  'organizer sees the meeting link');

-- ── Export ─────────────────────────────────────────────────────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m1'));
select ok(export_my_data() ?& array['reflections', 'activity_registrations'] and export_my_data()->'plans'->0 ? 'desired_state',
  'export includes desired state, reflections and registrations');

select * from finish();
rollback;
