-- T012: allow/deny for users, user_roles, cohorts, groups, group_memberships, journey_stages.
begin;
\ir _helpers.psql
select plan(26);

-- Setup (as superuser)
create temp table ids (k text primary key, v uuid) on commit drop;
grant select on ids to anon, authenticated;
insert into cohorts (id, name, start_date) values (gen_random_uuid(), 'الدفعة أ', current_date - 11);
insert into ids select 'c1', id from cohorts where name = 'الدفعة أ';
insert into groups (cohort_id, name) select v, 'مجموعة ١' from ids where k = 'c1';
insert into groups (cohort_id, name) select v, 'مجموعة ٢' from ids where k = 'c1';
insert into ids select 'g1', id from groups where name = 'مجموعة ١';
insert into ids select 'g2', id from groups where name = 'مجموعة ٢';
insert into ids values ('admin', tests.create_user('admin@t.test', '{admin,member}'));
insert into ids values ('fac', tests.create_user('fac@t.test', '{facilitator,member}'));
insert into ids values ('m1', tests.create_user('m1@t.test'));
insert into ids values ('m2', tests.create_user('m2@t.test'));
select tests.join_group((select v from ids where k='fac'), (select v from ids where k='g1'), 'facilitator');
select tests.join_group((select v from ids where k='m1'), (select v from ids where k='g1'));
select tests.join_group((select v from ids where k='m2'), (select v from ids where k='g2'));

-- Anonymous
select tests.as_anon();
select throws_ok($$ select count(*) from users $$, '42501', null, 'anon cannot read users');
select throws_ok($$ select count(*) from cohorts $$, '42501', null, 'anon cannot read cohorts');

-- Member m1
select tests.as_superuser(); select tests.authenticate_as((select v from ids where k='m1'));
select is((select count(*) from users), 1::bigint, 'member sees only own profile');
select is((select count(*) from user_roles), 1::bigint, 'member sees only own roles');
select is((select count(*) from cohorts), 1::bigint, 'member sees own cohort');
select is((select array_agg(name) from groups), array['مجموعة ١'], 'member sees only own group');
select is((select count(*) from group_memberships), 1::bigint, 'member sees only own membership');
select is((select count(*) from journey_stages), 0::bigint, 'member can read journey stages (none yet)');
select lives_ok($$ update users set full_name = 'اسم جديد' where id = auth.uid() $$, 'member can edit own name');
select is((select full_name from users where id = (select v from ids where k='m1')), 'اسم جديد', 'name updated');
update users set full_name = 'محاولة' where id = (select v from ids where k='m2');
select tests.as_superuser();
select isnt((select full_name from users where id = (select v from ids where k='m2')), 'محاولة', 'member cannot edit another profile');
select tests.authenticate_as((select v from ids where k='m1'));
select throws_ok($$ update users set deletion_requested_at = now() where id = auth.uid() $$, '42501', null, 'member cannot set deletion_requested_at directly');
select throws_ok($$ insert into user_roles (user_id, role) values (auth.uid(), 'admin') $$, '42501', null, 'member cannot grant self a role');
select throws_ok($$ insert into cohorts (name, start_date) values ('x', current_date) $$, '42501', null, 'member cannot create cohorts');
select throws_ok($$ insert into journey_stages (title, from_day, to_day) values ('x', 1, 10) $$, '42501', null, 'member cannot create journey stages');
set constraints all immediate;
select throws_ok($$ update users set active_role = 'admin' where id = auth.uid() $$, '23514', null, 'active_role must be a held role');

-- Member m2 (other group)
select tests.as_superuser(); select tests.authenticate_as((select v from ids where k='m2'));
select is((select array_agg(name) from groups), array['مجموعة ٢'], 'other member sees only their group');

-- Facilitator of g1
select tests.as_superuser(); select tests.authenticate_as((select v from ids where k='fac'));
select is((select count(*) from group_memberships where group_id = (select v from ids where k='g1')), 2::bigint, 'facilitator sees memberships of own group');
select is((select count(*) from group_memberships where group_id = (select v from ids where k='g2')), 0::bigint, 'facilitator cannot see other group memberships');
select throws_ok($$ insert into groups (cohort_id, name) values ((select v from ids where k='c1'), 'y') $$, '42501', null, 'facilitator cannot create groups');

-- Admin
select tests.as_superuser(); select tests.authenticate_as((select v from ids where k='admin'));
select is((select count(*) from users where email like '%@t.test'), 4::bigint, 'admin sees all profiles');
select lives_ok($$ insert into cohorts (name, start_date) values ('الدفعة ب', current_date) $$, 'admin can create cohorts');
select lives_ok($$ insert into journey_stages (title, from_day, to_day) values ('البداية', 1, 30) $$, 'admin can create stages');
select throws_ok($$ insert into journey_stages (title, from_day, to_day) values ('تداخل', 20, 40) $$, '23P01', null, 'stages cannot overlap');

-- Constraints and functions (superuser)
select tests.as_superuser();
select throws_ok($$ select tests.join_group((select v from ids where k='m1'), (select v from ids where k='g2')) $$, '23505', null, 'one active member membership per user');
select is(journey_day((select v from ids where k='m1'), current_date), 12, 'journey day counts from cohort start');

select * from finish();
rollback;
