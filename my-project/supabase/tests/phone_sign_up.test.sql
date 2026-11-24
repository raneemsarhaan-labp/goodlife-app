-- 0022: sign up with mobile + password joins the default group; one account per mobile.
begin;
\ir _helpers.psql
select plan(10);

create temp table k (name text primary key, id uuid) on commit drop;
insert into cohorts (id, name, start_date) values
  ('00000000-0000-4000-8000-00000000dc01', 'دفعة قديمة', current_date - 400),
  ('00000000-0000-4000-8000-00000000dc02', 'دفعة جديدة', current_date - 3);
insert into groups (id, cohort_id, name) values
  ('00000000-0000-4000-8000-00000000da01', '00000000-0000-4000-8000-00000000dc01', 'مجموعة قديمة'),
  ('00000000-0000-4000-8000-00000000da02', '00000000-0000-4000-8000-00000000dc02', 'مجموعة جديدة أ'),
  ('00000000-0000-4000-8000-00000000da03', '00000000-0000-4000-8000-00000000dc02', 'مجموعة جديدة ب');
update groups set created_at = now() + interval '1 minute' where id = '00000000-0000-4000-8000-00000000da03';
update groups set is_default = false;

-- Without a marked default: the first open group of the newest cohort.
select is(default_signup_group(),
  (select g.id from groups g join cohorts c on c.id = g.cohort_id where g.status = 'open'
   order by c.start_date desc, g.created_at, g.id limit 1),
  'no default marked: first open group of the newest cohort');
update groups set is_default = true where id = '00000000-0000-4000-8000-00000000da01';
select is(default_signup_group(), '00000000-0000-4000-8000-00000000da01'::uuid, 'the marked default group wins');

insert into k values ('a', gen_random_uuid());
insert into auth.users (id, email) values ((select id from k where name='a'), 'p966500000101@phone.goodlife.invalid');
select is(register_member((select id from k where name='a'), 'عضو جديد', '+966500000101', 'Asia/Riyadh'), (select id from k where name='a'), 'registers the member');
select is((select phone from users where id = (select id from k where name='a')), '+966500000101', 'profile keeps the mobile');
select is((select email from users where id = (select id from k where name='a')), null, 'no email needed');
select is((select group_id from group_memberships where user_id = (select id from k where name='a') and ended_on is null),
  '00000000-0000-4000-8000-00000000da01'::uuid, 'joined the default group');
select is((select count(*) from plans where user_id = (select id from k where name='a')), 1::bigint, 'has a plan');

insert into k values ('b', gen_random_uuid());
insert into auth.users (id, email) values ((select id from k where name='b'), 'second@phone.goodlife.invalid');
select throws_ok(format($$ select register_member(%L, 'آخر', '+966500000101', 'Asia/Riyadh') $$, (select id from k where name='b')),
  'P0001', 'conflict: phone', 'a mobile registers only once');

select tests.authenticate_as((select id from k where name='a'));
select throws_ok($$ select register_member(auth.uid(), 'x', '+966500000102', 'Asia/Riyadh') $$, '42501', null, 'members cannot call register_member');
select throws_ok($$ select set_default_group('00000000-0000-4000-8000-00000000da02') $$, 'P0001', 'forbidden', 'only admins choose the default group');

select * from finish();
rollback;
