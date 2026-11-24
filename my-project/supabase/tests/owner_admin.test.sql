-- 0023: a mobile whose fingerprint is in owner_phones becomes admin on sign-up; others do not.
begin;
\ir _helpers.psql
select plan(4);

insert into owner_phones (phone_sha256) values (encode(sha256(convert_to('+966511112222', 'UTF8')), 'hex'));
create temp table k (name text primary key, id uuid) on commit drop;
insert into k values ('owner', gen_random_uuid()), ('other', gen_random_uuid());
insert into auth.users (id, email) select id, name || '@phone.goodlife.invalid' from k;
select register_member((select id from k where name='owner'), 'المالك', '+966511112222', 'Asia/Riyadh');
select register_member((select id from k where name='other'), 'عضو', '+966511113333', 'Asia/Riyadh');

select is((select count(*) from user_roles where user_id = (select id from k where name='owner') and role = 'admin'), 1::bigint,
  'the owner''s mobile becomes admin on sign-up');
select is((select count(*) from user_roles where user_id = (select id from k where name='other') and role = 'admin'), 0::bigint,
  'another mobile does not');
select tests.authenticate_as((select id from k where name='other'));
select throws_ok($$ select count(*) from owner_phones $$, '42501', null, 'members cannot read owner fingerprints');
select throws_ok($$ insert into owner_phones values (repeat('a', 64)) $$, '42501', null, 'members cannot add owners');

select * from finish();
rollback;
