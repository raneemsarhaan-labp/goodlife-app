-- T126: «حسابي» — active role must be held; export contains only the caller's data;
-- deletion requests are self-service and visible to admins.
begin;
\ir _helpers.psql
select plan(11);

create temp table k (name text primary key, id uuid) on commit drop;
grant select on k to authenticated;
insert into cohorts (id, name, start_date) values ('a0000000-0000-4000-8000-0000000000c1', 'دفعة الحساب', current_date - 5);
insert into groups (id, cohort_id, name) values ('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000c1', 'مجموعة الحساب');
insert into k values ('m1', tests.create_user('m1@t.test', '{member,facilitator}')), ('m2', tests.create_user('m2@t.test')),
  ('admin', tests.create_user('admin@t.test', '{admin,member}'));
select tests.join_group((select id from k where name='m1'), 'a0000000-0000-4000-8000-0000000000a1');
select tests.join_group((select id from k where name='m2'), 'a0000000-0000-4000-8000-0000000000a1');
insert into plans (id, user_id, cohort_id) values
  ('a0000000-0000-4000-8000-0000000000b1', (select id from k where name='m1'), 'a0000000-0000-4000-8000-0000000000c1'),
  ('a0000000-0000-4000-8000-0000000000b2', (select id from k where name='m2'), 'a0000000-0000-4000-8000-0000000000c1');
insert into habits (plan_id, name) values ('a0000000-0000-4000-8000-0000000000b1', 'عادتي'), ('a0000000-0000-4000-8000-0000000000b2', 'عادة غيري');

select tests.authenticate_as((select id from k where name='m1'));
set constraints all immediate;
select lives_ok($$ update users set active_role = 'facilitator' where id = auth.uid() $$, 'switch to a held role');
select throws_ok($$ update users set active_role = 'admin' where id = auth.uid() $$, '23514', null, 'cannot switch to a role not held');
select lives_ok($$ update users set full_name = 'اسمي الجديد', city = 'جدة', time_zone = 'Asia/Dubai' where id = auth.uid() $$, 'edit own profile');
select throws_ok($$ update users set time_zone = 'Mars/Olympus' where id = auth.uid() $$, '23514', null, 'time zone must be valid');
create temp view x as select export_my_data() as j;
select is((select j->'profile'->>'email' from x), 'm1@t.test', 'export contains the profile');
select is((select jsonb_array_length(j->'habits') from x), 1, 'export contains only my habits');
select ok((select j::text not like '%عادة غيري%' from x), 'no one else''s data in the export');
select lives_ok($$ select request_account_deletion() $$, 'request account deletion');
select isnt((select deletion_requested_at from users where id = auth.uid()), null, 'request recorded');

select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select is((select count(*) from users where deletion_requested_at is not null and email like '%@t.test'), 1::bigint, 'admin sees the deletion request');
select tests.as_anon();
select throws_ok($$ select export_my_data() $$, '42501', null, 'anonymous cannot export');

select * from finish();
rollback;
