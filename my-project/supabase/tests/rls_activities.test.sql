-- T057: activity permissions (constitution III, FR-044). Facilitators manage activities only for
-- groups they lead; cohort-wide activities are admin-only; members cannot write.
begin;
\ir _helpers.psql
select plan(16);

create temp table k (name text primary key, id uuid) on commit drop;
grant select, insert on k to authenticated;
insert into cohorts (id, name, start_date) values ('40000000-0000-4000-8000-0000000000c1', 'دفعة الأنشطة', current_date - 5);
insert into groups (id, cohort_id, name) values
  ('40000000-0000-4000-8000-0000000000a1', '40000000-0000-4000-8000-0000000000c1', 'مجموعة الميسّر'),
  ('40000000-0000-4000-8000-0000000000a2', '40000000-0000-4000-8000-0000000000c1', 'مجموعة أخرى');
insert into k (name, id) values
  ('admin', tests.create_user('admin@t.test', '{admin,member}')),
  ('fac', tests.create_user('fac@t.test', '{facilitator,member}')),
  ('m1', tests.create_user('m1@t.test')),
  ('m2', tests.create_user('m2@t.test'));
select tests.join_group((select id from k where name='fac'), '40000000-0000-4000-8000-0000000000a1', 'facilitator');
select tests.join_group((select id from k where name='m1'), '40000000-0000-4000-8000-0000000000a1');
select tests.join_group((select id from k where name='m2'), '40000000-0000-4000-8000-0000000000a2');

-- ── Facilitator ────────────────────────────────────────────────────────────
select tests.authenticate_as((select id from k where name='fac'));
select lives_ok($$ insert into k (name, id) select 'fac_act', save_activity(null, 'لقاء المجموعة', null, now() + interval '2 days', null, 'المسجد',
  array['40000000-0000-4000-8000-0000000000a1']::uuid[], null) $$, 'facilitator creates an activity for their group');
select lives_ok($$ select save_activity((select id from k where name='fac_act'), 'لقاء المجموعة (معدّل)', 'وصف', now() + interval '3 days', null, null,
  array['40000000-0000-4000-8000-0000000000a1']::uuid[], null) $$, 'facilitator edits own activity');
select throws_ok($$ select save_activity(null, 'لمجموعة أخرى', null, now() + interval '2 days', null, null,
  array['40000000-0000-4000-8000-0000000000a2']::uuid[], null) $$, '42501', null, 'facilitator cannot target another group');
select throws_ok($$ select save_activity(null, 'مختلط', null, now() + interval '2 days', null, null,
  array['40000000-0000-4000-8000-0000000000a1', '40000000-0000-4000-8000-0000000000a2']::uuid[], null) $$, '42501', null, 'facilitator cannot mix in another group');
select throws_ok($$ select save_activity(null, 'للدفعة', null, now() + interval '2 days', null, null,
  null, '40000000-0000-4000-8000-0000000000c1') $$, '42501', null, 'facilitator cannot create cohort-wide activities');
select throws_like($$ select save_activity(null, 'بلا جمهور', null, now() + interval '2 days', null, null, null, null) $$,
  'invalid_input%', 'an activity needs exactly one kind of audience');

-- Admin's activity: facilitator cannot edit or cancel it.
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select lives_ok($$ insert into k (name, id) select 'admin_act', save_activity(null, 'لقاء الدفعة', null, now() + interval '4 days', null, null,
  null, '40000000-0000-4000-8000-0000000000c1') $$, 'admin creates a cohort-wide activity');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
select throws_like($$ select save_activity((select id from k where name='admin_act'), 'تعديل', null, now() + interval '4 days', null, null,
  array['40000000-0000-4000-8000-0000000000a1']::uuid[], null) $$, 'not_found%', 'facilitator cannot edit an activity they did not create');
select throws_like($$ select cancel_activity((select id from k where name='admin_act')) $$, 'not_found%', 'facilitator cannot cancel an admin activity');

-- ── Members see what is meant for them ─────────────────────────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m1'));
select is((select count(*) from activities), 2::bigint, 'member sees their group''s and cohort''s activities');
select throws_ok($$ select save_activity(null, 'نشاط عضو', null, now() + interval '1 day', null, null,
  array['40000000-0000-4000-8000-0000000000a1']::uuid[], null) $$, '42501', null, 'member cannot create activities');
select throws_ok($$ insert into activities (title, starts_at) values ('مباشر', now()) $$, '42501', null, 'member cannot insert activities directly');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m2'));
select is((select count(*) from activities), 1::bigint, 'another group''s member sees only the cohort-wide activity');

-- Facilitator cancels own activity; admin may edit anything.
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
select lives_ok($$ select cancel_activity((select id from k where name='fac_act')) $$, 'facilitator cancels own activity');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select lives_ok($$ select save_activity((select id from k where name='fac_act'), 'تعديل الإدارة', null, now() + interval '5 days', null, null,
  array['40000000-0000-4000-8000-0000000000a2']::uuid[], null) $$, 'admin edits any activity and audience');
select tests.as_superuser();
select isnt((select cancelled_at from activities where id = (select id from k where name='fac_act')), null, 'cancellation recorded');

select * from finish();
rollback;
