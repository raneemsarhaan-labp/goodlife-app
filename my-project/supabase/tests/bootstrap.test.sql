-- 0021: the launch admin is granted only while there is no admin, and only to the bootstrap email.
begin;
\ir _helpers.psql
select plan(5);

delete from user_roles where role = 'admin';
insert into app_bootstrap (admin_email) values ('Launch@Example.test');
create temp table k (name text primary key, id uuid) on commit drop;
insert into k values ('other', tests.create_user('someone@example.test'));
select is((select count(*) from user_roles where user_id = (select id from k where name='other') and role = 'admin'), 0::bigint,
  'another email does not become admin');
insert into k values ('launch', tests.create_user('launch@example.test'));
select is((select count(*) from user_roles where user_id = (select id from k where name='launch') and role = 'admin'), 1::bigint,
  'the bootstrap email becomes admin on joining (case-insensitive)');
select is(bootstrap_admin((select id from k where name='other')), false, 'no second bootstrap once an admin exists');
select tests.authenticate_as((select id from k where name='launch'));
select throws_ok($$ select count(*) from app_bootstrap $$, '42501', null, 'members cannot read the bootstrap table');
select throws_ok($$ select bootstrap_admin(auth.uid()) $$, '42501', null, 'members cannot call bootstrap_admin');

select * from finish();
rollback;
