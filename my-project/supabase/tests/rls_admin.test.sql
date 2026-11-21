-- T056: admin-only program management; facilitator removal; moving a member keeps their data.
begin;
\ir _helpers.psql
select plan(30);

create temp table k (name text primary key, id uuid) on commit drop;
grant select on k to authenticated;
insert into cohorts (id, name, start_date) values
  ('30000000-0000-4000-8000-0000000000c1', 'دفعة الإدارة', current_date - 5),
  ('30000000-0000-4000-8000-0000000000c2', 'دفعة ثانية', current_date - 5);
insert into groups (id, cohort_id, name) values
  ('30000000-0000-4000-8000-0000000000a1', '30000000-0000-4000-8000-0000000000c1', 'المجموعة أ'),
  ('30000000-0000-4000-8000-0000000000a2', '30000000-0000-4000-8000-0000000000c1', 'المجموعة ب'),
  ('30000000-0000-4000-8000-0000000000a3', '30000000-0000-4000-8000-0000000000c2', 'مجموعة الدفعة الثانية');
insert into k values
  ('admin', tests.create_user('admin@t.test', '{admin,member}')),
  ('fac', tests.create_user('fac@t.test', '{facilitator,member}')),
  ('m1', tests.create_user('m1@t.test')),
  ('newbie', tests.create_user('newbie@t.test')),
  ('m2', tests.create_user('m2@t.test'));
select tests.join_group((select id from k where name='fac'), '30000000-0000-4000-8000-0000000000a1', 'facilitator');
select tests.join_group((select id from k where name='m1'), '30000000-0000-4000-8000-0000000000a1');
select tests.join_group((select id from k where name='m2'), '30000000-0000-4000-8000-0000000000a2');
insert into plans (id, user_id, cohort_id, current_state) values
  ('30000000-0000-4000-8000-0000000000b1', (select id from k where name='m1'), '30000000-0000-4000-8000-0000000000c1', 'واقعي الآن');
insert into habits (plan_id, name) values ('30000000-0000-4000-8000-0000000000b1', 'قراءة'), ('30000000-0000-4000-8000-0000000000b1', 'مشي');

-- ── Member and facilitator are refused every admin write ───────────────────
select tests.authenticate_as((select id from k where name='m1'));
select throws_ok($$ insert into groups (cohort_id, name) values ('30000000-0000-4000-8000-0000000000c1', 'x') $$, '42501', null, 'member cannot create groups');
select throws_ok($$ insert into group_memberships (group_id, user_id, role) values ('30000000-0000-4000-8000-0000000000a2', auth.uid(), 'facilitator') $$, '42501', null, 'member cannot add memberships');
select throws_ok($$ insert into invitation_codes (code, cohort_id, group_id, expires_at) values ('MMBRCDE2', '30000000-0000-4000-8000-0000000000c1', '30000000-0000-4000-8000-0000000000a1', now() + interval '1 day') $$, '42501', null, 'member cannot create invitations');
select is((select count(*) from invitation_codes), 0::bigint, 'member cannot list invitations');
select throws_ok($$ insert into journey_challenges (journey_day, text) values (200, 'تحدٍّ') $$, '42501', null, 'member cannot write journey challenges');
select throws_ok($$ insert into closing_messages (text) values ('رسالة') $$, '42501', null, 'member cannot write closing messages');
select throws_ok($$ insert into user_roles (user_id, role) values (auth.uid(), 'facilitator') $$, '42501', null, 'member cannot grant roles');
select throws_like($$ select move_member(auth.uid(), '30000000-0000-4000-8000-0000000000a2') $$, 'forbidden%', 'member cannot move members');
select throws_like($$ select grant_admin(auth.uid()) $$, 'forbidden%', 'member cannot grant admin');

select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
update cohorts set name = 'تغيير' where id = '30000000-0000-4000-8000-0000000000c1';
select is((select count(*) from cohorts where name = 'تغيير'), 0::bigint, 'cohort unchanged by facilitator');
select throws_like($$ select assign_facilitator(auth.uid(), '30000000-0000-4000-8000-0000000000a2') $$, 'forbidden%', 'facilitator cannot assign facilitators');
select throws_like($$ select move_member((select id from k where name='m1'), '30000000-0000-4000-8000-0000000000a2') $$, 'forbidden%', 'facilitator cannot move members');

-- ── Admin manages roles and memberships ────────────────────────────────────
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select lives_ok($$ select assign_facilitator((select id from k where name='newbie'), '30000000-0000-4000-8000-0000000000a2') $$, 'admin assigns a facilitator');
select ok(exists (select 1 from user_roles where user_id = (select id from k where name='newbie') and role = 'facilitator'), 'facilitator role granted');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='newbie'));
select is((select count(*) from group_memberships where group_id = '30000000-0000-4000-8000-0000000000a2' and user_id <> auth.uid()), 1::bigint, 'new facilitator sees their group''s members');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select lives_ok($$ select remove_facilitator((select id from k where name='newbie'), '30000000-0000-4000-8000-0000000000a2') $$, 'admin removes the facilitator');
select ok(not exists (select 1 from user_roles where user_id = (select id from k where name='newbie') and role = 'facilitator'), 'facilitator role revoked when no groups remain');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='newbie'));
select is((select count(*) from group_memberships where group_id = '30000000-0000-4000-8000-0000000000a2' and user_id <> auth.uid()), 0::bigint, 'removed facilitator immediately loses access to members');
select is((select count(*) from groups where id = '30000000-0000-4000-8000-0000000000a2'), 0::bigint, 'removed facilitator no longer sees the group');

-- Move a member within the cohort: personal data unchanged, new group active.
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select lives_ok($$ select move_member((select id from k where name='m1'), '30000000-0000-4000-8000-0000000000a2') $$, 'admin moves a member');
select throws_like($$ select move_member((select id from k where name='m1'), '30000000-0000-4000-8000-0000000000a3') $$, 'invalid_input%', 'cannot move to another cohort''s group');
select tests.as_superuser();
select is((select group_id from group_memberships where user_id = (select id from k where name='m1') and role = 'member' and ended_on is null),
  '30000000-0000-4000-8000-0000000000a2'::uuid, 'member is now in the new group');
select is((select count(*) from group_memberships where user_id = (select id from k where name='m1') and ended_on is not null), 1::bigint, 'old membership kept as history');
select is((select count(*) from habits h join plans p on p.id = h.plan_id where p.user_id = (select id from k where name='m1')), 2::bigint, 'habits unchanged after move');
select is((select current_state from plans where id = '30000000-0000-4000-8000-0000000000b1'), 'واقعي الآن', 'plan unchanged after move');
select tests.authenticate_as((select id from k where name='fac'));
select is((select count(*) from group_memberships where user_id = (select id from k where name='m1') and ended_on is null), 0::bigint, 'old group''s facilitator no longer sees the moved member');

-- add_member refuses a user who already has an active membership.
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select throws_like($$ select add_member((select id from k where name='m1'), '30000000-0000-4000-8000-0000000000a1') $$, 'conflict%', 'add_member refuses users already in a group');

-- Admin roles: grant, and never remove the last admin.
select lives_ok($$ select grant_admin((select id from k where name='fac')) $$, 'admin grants admin');
select lives_ok($$ select revoke_admin((select id from k where name='fac')) $$, 'admin revokes admin');
select tests.as_superuser();
delete from user_roles where role = 'admin' and user_id <> (select id from k where name='admin');
select tests.authenticate_as((select id from k where name='admin'));
select throws_like($$ select revoke_admin(auth.uid()) $$, 'forbidden%', 'the last admin cannot be removed');

select * from finish();
rollback;
