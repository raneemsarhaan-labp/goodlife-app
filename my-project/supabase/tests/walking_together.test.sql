-- T002 (spec 007): sharing (peers only), private habits, group challenge without ranks, community list,
-- closed groups.
begin;
\ir _helpers.psql
select plan(24);

create temp table k (name text primary key, id uuid) on commit drop;
grant select, insert on k to authenticated;
insert into cohorts (id, name, start_date) values ('a7000000-0000-4000-8000-0000000000c1', 'دفعة المشي معًا', current_date - 10);
insert into groups (id, cohort_id, name) values
  ('a7000000-0000-4000-8000-0000000000a1', 'a7000000-0000-4000-8000-0000000000c1', 'مجموعة أ'),
  ('a7000000-0000-4000-8000-0000000000a2', 'a7000000-0000-4000-8000-0000000000c1', 'مجموعة ب');
insert into k values ('admin', tests.create_user('admin@t.test', '{admin,member}')), ('fac', tests.create_user('fac@t.test', '{facilitator,member}')),
  ('m1', tests.create_user('m1@t.test')), ('m2', tests.create_user('m2@t.test')), ('m3', tests.create_user('m3@t.test'));
select tests.join_group((select id from k where name='fac'), 'a7000000-0000-4000-8000-0000000000a1', 'facilitator');
select tests.join_group((select id from k where name=n), 'a7000000-0000-4000-8000-0000000000a1') from unnest(array['m1','m2']) n;
select tests.join_group((select id from k where name='m3'), 'a7000000-0000-4000-8000-0000000000a2');
insert into plans (id, user_id, cohort_id) select gen_random_uuid(), id, 'a7000000-0000-4000-8000-0000000000c1' from k where name in ('m1','m2','m3');
insert into habits (id, plan_id, name, shared_with_group) values
  ('a7000000-0000-4000-8000-00000000d001', (select p.id from plans p join k on k.id = p.user_id where k.name='m1'), 'أذكار الصباح', true),
  ('a7000000-0000-4000-8000-00000000d002', (select p.id from plans p join k on k.id = p.user_id where k.name='m1'), 'سرّ لا يُشارك', false),
  ('a7000000-0000-4000-8000-00000000d003', (select p.id from plans p join k on k.id = p.user_id where k.name='m2'), 'أذكار  الصباح', true),
  ('a7000000-0000-4000-8000-00000000d004', (select p.id from plans p join k on k.id = p.user_id where k.name='m3'), 'مشاركة من مجموعة أخرى', true);

-- ── Sharing: peers only ────────────────────────────────────────────────────
select tests.authenticate_as((select id from k where name='m2'));
select ok(group_together()->'items' @> '[{"habit": "أذكار الصباح"}]', 'a peer sees a shared habit');
select ok(not (group_together()::text like '%سرّ لا يُشارك%'), 'unshared habits never appear');
select ok(not (group_together()::text like '%مجموعة أخرى%'), 'other groups'' shared habits never appear');
select is((select max((i->>'together')::int) from jsonb_array_elements(group_together()->'items') i where i->>'habit' like 'أذكار%'), 2,
  'same habit (normalised name) counts «٢ منكم»');
select is((group_together()->'group'->>'members')::int, 2, 'hero counts members only');
select is((select count(*) from habits where name = 'أذكار الصباح'), 0::bigint, 'no table access to peers'' habits');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
select is(group_together(), null, 'facilitator is not a peer: nothing returned');
select tests.as_superuser();
update groups set features = features || '{"sharing": false}' where id = 'a7000000-0000-4000-8000-0000000000a1';
select tests.authenticate_as((select id from k where name='m2'));
select is(jsonb_array_length(group_together()->'items'), 0, 'sharing off for the group hides peers');
select tests.as_superuser();
update groups set features = features || '{"sharing": true}' where id = 'a7000000-0000-4000-8000-0000000000a1';

-- ── Private habits cannot be shared ───────────────────────────────────────
select throws_ok($$ update habits set is_private = true where id = 'a7000000-0000-4000-8000-00000000d001' $$, '23514', null, 'a private habit cannot be shared');

-- ── Group challenge ────────────────────────────────────────────────────────
select tests.authenticate_as((select id from k where name='admin'));
select lives_ok($$ insert into group_challenges (id, title, habit_name, amount, starts_on, duration_days, cohort_id)
  values ('a7000000-0000-4000-8000-0000000000e1', 'أسبوع الصلة', 'وردي من القرآن', 'صفحة', current_date - 2, 7, 'a7000000-0000-4000-8000-0000000000c1') $$,
  'admin creates a cohort challenge');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m1'));
select throws_ok($$ insert into group_challenges (title, habit_name, starts_on, duration_days, cohort_id)
  values ('تحدٍّ من عضو', 'عادة', current_date, 7, 'a7000000-0000-4000-8000-0000000000c1') $$, '42501', null, 'members cannot create challenges');
select is((my_group_challenges()->0->>'status'), 'active', 'challenge listed as active');
select is((my_group_challenges()->0->>'day')::int, 3, 'day X of Y');
insert into k select 'ch_habit', join_group_challenge('a7000000-0000-4000-8000-0000000000e1');
select is((select group_challenge_id from habits where id = (select id from k where name='ch_habit')), 'a7000000-0000-4000-8000-0000000000e1'::uuid,
  'joining creates the challenge habit');
select ok((select (h->'challenge'->>'day')::int = 3 from jsonb_array_elements(get_today()->'habits') h where h->>'name' = 'وردي من القرآن'),
  '«يومك» flags the habit with the challenge day');
select throws_like($$ update habits set name = 'اسم آخر' where id = (select id from k where name='ch_habit') $$, 'forbidden%', 'the challenge habit is locked');
select lives_ok($$ select set_habit_done((select id from k where name='ch_habit'), current_date, true, gen_random_uuid()) $$, 'member does it today');
select is((my_group_challenges()->0->>'group_done_today')::int, 1, 'group count of done today');
select ok(not (my_group_challenges()::text like '%m1@%') and not (my_group_challenges()::text like '%مستخدم%'), 'no names or ranks in the challenge view');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m2'));
select is((select count(*) from group_challenge_participants), 0::bigint, 'members cannot see others'' participation rows');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m1'));
select lives_ok($$ select withdraw_group_challenge('a7000000-0000-4000-8000-0000000000e1') $$, 'member withdraws');
select isnt((select archived_at from habits where id = (select id from k where name='ch_habit')), null, 'withdrawing archives the habit');

-- ── Community list ─────────────────────────────────────────────────────────
select tests.as_superuser();
insert into activities (id, title, starts_at, presenter, created_by) values
  ('a7000000-0000-4000-8000-0000000000f1', 'لقاء بعد ثلاثة أسابيع', now() + interval '21 days', 'د. أحمد', (select id from k where name='admin'));
insert into activity_audiences (activity_id, cohort_id) values ('a7000000-0000-4000-8000-0000000000f1', 'a7000000-0000-4000-8000-0000000000c1');
select tests.authenticate_as((select id from k where name='m1'));
select ok(community_activities() @> '[{"title": "لقاء بعد ثلاثة أسابيع", "presenter": "د. أحمد", "is_new": true}]', 'activities beyond seven days, with presenter and «جديد»');

-- ── Closed group ───────────────────────────────────────────────────────────
select tests.as_superuser();
update groups set status = 'closed' where id = 'a7000000-0000-4000-8000-0000000000a2';
insert into invitation_codes (code, cohort_id, group_id, expires_at, max_uses, created_by)
  values ('CRWD7777', 'a7000000-0000-4000-8000-0000000000c1', 'a7000000-0000-4000-8000-0000000000a2', now() + interval '7 days', 5, (select id from k where name='admin'));
select throws_like($$ select * from check_invitation('CRWD7777') $$, 'code_invalid%', 'a closed group''s codes stop working');

select * from finish();
rollback;
