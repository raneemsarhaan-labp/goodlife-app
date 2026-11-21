-- T072: «خطتي» — plans and focus areas are self-only; habits link only to the same plan's areas;
-- deleting an area unlinks habits; reorder, archive, copy from the previous journey.
begin;
\ir _helpers.psql
select plan(20);

create temp table k (name text primary key, id uuid) on commit drop;
grant select on k to authenticated;
insert into cohorts (id, name, start_date) values
  ('50000000-0000-4000-8000-0000000000c1', 'دفعة الخطة', current_date - 20),
  ('50000000-0000-4000-8000-0000000000c0', 'دفعة الخطة السابقة', current_date - 400);
insert into groups (id, cohort_id, name) values
  ('50000000-0000-4000-8000-0000000000a1', '50000000-0000-4000-8000-0000000000c1', 'مجموعة الخطة'),
  ('50000000-0000-4000-8000-0000000000a0', '50000000-0000-4000-8000-0000000000c0', 'مجموعة سابقة');
insert into k values ('m1', tests.create_user('m1@t.test')), ('m2', tests.create_user('m2@t.test')),
  ('fac', tests.create_user('fac@t.test', '{facilitator,member}'));
insert into group_memberships (group_id, user_id, role, started_on, ended_on) values
  ('50000000-0000-4000-8000-0000000000a0', (select id from k where name='m1'), 'member', current_date - 400, current_date - 36);
select tests.join_group((select id from k where name='m1'), '50000000-0000-4000-8000-0000000000a1', 'member', current_date - 20);
select tests.join_group((select id from k where name='m2'), '50000000-0000-4000-8000-0000000000a1');
select tests.join_group((select id from k where name='fac'), '50000000-0000-4000-8000-0000000000a1', 'facilitator');
insert into plans (id, user_id, cohort_id, current_state) values
  ('50000000-0000-4000-8000-0000000000b1', (select id from k where name='m1'), '50000000-0000-4000-8000-0000000000c1', ''),
  ('50000000-0000-4000-8000-0000000000b0', (select id from k where name='m1'), '50000000-0000-4000-8000-0000000000c0', 'قديم'),
  ('50000000-0000-4000-8000-0000000000b2', (select id from k where name='m2'), '50000000-0000-4000-8000-0000000000c1', '');
insert into habits (id, plan_id, name, sort_order) values
  ('50000000-0000-4000-8000-000000000011', '50000000-0000-4000-8000-0000000000b1', 'قراءة', 1),
  ('50000000-0000-4000-8000-000000000012', '50000000-0000-4000-8000-0000000000b1', 'مشي', 2),
  ('50000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-0000000000b0', 'عادة سابقة', 1);
insert into habits (plan_id, name, sort_order, archived_at) values ('50000000-0000-4000-8000-0000000000b0', 'عادة مؤرشفة', 2, now());
insert into focus_areas (id, plan_id, title) values ('50000000-0000-4000-8000-0000000000f2', '50000000-0000-4000-8000-0000000000b2', 'مجال م٢');

-- ── m1 ─────────────────────────────────────────────────────────────────────
select tests.authenticate_as((select id from k where name='m1'));
select lives_ok($$ update plans set current_state = 'أريد يومًا أهدأ' where id = '50000000-0000-4000-8000-0000000000b1' $$, 'write current state');
update plans set current_state = 'تعديل قديم' where id = '50000000-0000-4000-8000-0000000000b0';
select is((select current_state from plans where id = '50000000-0000-4000-8000-0000000000b0'), 'قديم', 'past journey''s plan is read-only');
select lives_ok($$ insert into focus_areas (id, plan_id, title, sort_order) values ('50000000-0000-4000-8000-0000000000f1', '50000000-0000-4000-8000-0000000000b1', 'الصحة', 1) $$, 'add focus area to current plan');
select lives_ok($$ insert into focus_areas (plan_id, title, sort_order) values ('50000000-0000-4000-8000-0000000000b1', 'الأسرة', 2) $$, 'add second focus area');
select throws_ok($$ insert into focus_areas (plan_id, title) values ('50000000-0000-4000-8000-0000000000b0', 'قديم') $$, '42501', null, 'cannot add areas to a past plan');
select throws_ok($$ insert into focus_areas (plan_id, title) values ('50000000-0000-4000-8000-0000000000b2', 'دخيل') $$, '42501', null, 'cannot add areas to another member''s plan');
select is((select count(*) from focus_areas), 2::bigint, 'member sees only own focus areas');
select lives_ok($$ update habits set focus_area_id = '50000000-0000-4000-8000-0000000000f1' where id = '50000000-0000-4000-8000-000000000011' $$, 'link a habit to own area');
select throws_ok($$ update habits set focus_area_id = '50000000-0000-4000-8000-0000000000f2' where id = '50000000-0000-4000-8000-000000000012' $$, '23514', null, 'cannot link to another plan''s area');
select lives_ok($$ select reorder_habits(array['50000000-0000-4000-8000-000000000012', '50000000-0000-4000-8000-000000000011']::uuid[]) $$, 'reorder habits');
select is((select array_agg(name order by sort_order) from habits where plan_id = '50000000-0000-4000-8000-0000000000b1'), array['مشي', 'قراءة'], 'new order saved');
select is((get_today()->'habits'->0->>'name'), 'مشي', '«يومك» follows the new order');
select lives_ok($$ update habits set archived_at = now() where id = '50000000-0000-4000-8000-000000000012' $$, 'archive a habit');
select is((get_today()->>'habits_total')::int, 1, 'archived habit leaves «يومك»');
select lives_ok($$ delete from focus_areas where id = '50000000-0000-4000-8000-0000000000f1' $$, 'delete a focus area');
select is((select focus_area_id from habits where id = '50000000-0000-4000-8000-000000000011'), null, 'its habits are kept, unlinked');
select is(copy_habits_from_previous_plan(), 1, 'copies the previous journey''s active habits');
select ok(exists (select 1 from habits where plan_id = '50000000-0000-4000-8000-0000000000b1' and name = 'عادة سابقة'), 'copied habit is in the current plan');

-- ── Others ─────────────────────────────────────────────────────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
select is((select count(*) from plans) + (select count(*) from focus_areas), 0::bigint, 'facilitator cannot read plans or focus areas');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m2'));
update habits set name = 'تخريب' where id = '50000000-0000-4000-8000-000000000011';
select tests.as_superuser();
select is((select name from habits where id = '50000000-0000-4000-8000-000000000011'), 'قراءة', 'another member cannot edit my habit');

select * from finish();
rollback;
