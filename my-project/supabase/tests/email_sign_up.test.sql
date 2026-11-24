-- 0024: registering with an email; one account per email; the server-only login lookup.
begin;
\ir _helpers.psql
select plan(7);

insert into cohorts (id, name, start_date) values ('00000000-0000-4000-8000-00000000fc01', 'دفعة البريد', current_date);
insert into groups (cohort_id, name) values ('00000000-0000-4000-8000-00000000fc01', 'مجموعة البريد');
create temp table k (name text primary key, id uuid) on commit drop;
insert into k values ('a', gen_random_uuid()), ('b', gen_random_uuid()), ('c', gen_random_uuid());
insert into auth.users (id, email, email_confirmed_at) values
  ((select id from k where name='a'), 'new.member@example.test', now()),
  ((select id from k where name='b'), 'second@example.test', null),
  ((select id from k where name='c'), 'third@example.test', now());

select register_member((select id from k where name='a'), 'عضو بالبريد', '+966512340001', 'Asia/Riyadh', ' New.Member@Example.test ');
select is((select email from users where id = (select id from k where name='a')), 'new.member@example.test', 'email stored, trimmed and lower-case');
select throws_ok(format($$ select register_member(%L, 'آخر', '+966512340002', 'Asia/Riyadh', 'NEW.member@example.test') $$, (select id from k where name='c')),
  'P0001', 'conflict: email', 'an email registers only once');
select is((select count(*) from users where id = (select id from k where name='c')), 0::bigint, 'nothing created on conflict');

select is((select row(confirmed, has_profile)::text from auth_login_by_email('NEW.MEMBER@example.test')), '(t,t)', 'lookup: confirmed member');
select is((select row(confirmed, has_profile)::text from auth_login_by_email('second@example.test')), '(f,f)', 'lookup: unconfirmed login without profile');
select is((select count(*) from auth_login_by_email('nobody@example.test')), 0::bigint, 'lookup: unknown email');

select tests.authenticate_as((select id from k where name='a'));
select throws_ok($$ select * from auth_login_by_email('second@example.test') $$, '42501', null, 'members cannot look up logins');

select * from finish();
rollback;
