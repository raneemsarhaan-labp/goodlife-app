-- T034: check_invitation / redeem_invitation.
begin;
\ir _helpers.psql
select plan(14);

insert into cohorts (id, name, start_date) values ('10000000-0000-4000-8000-0000000000c1', 'دفعة الدعوات', current_date - 3);
insert into groups (id, cohort_id, name) values ('10000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000c1', 'مجموعة الدعوات');
insert into invitation_codes (code, cohort_id, group_id, expires_at, max_uses) values
  ('GDCDE234', '10000000-0000-4000-8000-0000000000c1', '10000000-0000-4000-8000-0000000000a1', now() + interval '7 days', 1),
  ('EXPRDCDE', '10000000-0000-4000-8000-0000000000c1', '10000000-0000-4000-8000-0000000000a1', now() - interval '1 day', 5),
  ('RVKDCDE2', '10000000-0000-4000-8000-0000000000c1', '10000000-0000-4000-8000-0000000000a1', now() + interval '7 days', 5);
update invitation_codes set revoked_at = now() where code = 'RVKDCDE2';

-- Codes must use the unambiguous alphabet (no 0/O/1/I/L).
select throws_ok($$ insert into invitation_codes (code, cohort_id, group_id, expires_at, max_uses)
  values ('BAD0CODE', '10000000-0000-4000-8000-0000000000c1', '10000000-0000-4000-8000-0000000000a1', now(), 1) $$,
  '23514', null, 'code alphabet is enforced');

-- Group must belong to the code's cohort.
insert into cohorts (id, name, start_date) values ('10000000-0000-4000-8000-0000000000c2', 'دفعة أخرى', current_date);
select throws_ok($$ insert into invitation_codes (code, cohort_id, group_id, expires_at, max_uses)
  values ('MSMTCHGP', '10000000-0000-4000-8000-0000000000c2', '10000000-0000-4000-8000-0000000000a1', now() + interval '1 day', 1) $$,
  '23503', null, 'group must belong to the cohort');

-- check_invitation is callable before sign-in, normalizes input, and explains failures.
select tests.as_anon();
select is((check_invitation(' gd-cde234 ')).group_name, 'مجموعة الدعوات', 'valid code returns its group (input normalized)');
select throws_ok($$ select check_invitation('NOSUCHCD') $$, 'P0001', 'code_invalid', 'unknown code');
select throws_ok($$ select check_invitation('EXPRDCDE') $$, 'P0001', 'code_expired', 'expired code');
select throws_ok($$ select check_invitation('RVKDCDE2') $$, 'P0001', 'code_invalid', 'revoked code');
-- Only the server (service role) may redeem.
select throws_ok($$ select redeem_invitation('GDCDE234', gen_random_uuid(), 'اسم', 'x@t.test', 'Asia/Riyadh') $$,
  '42501', null, 'anon cannot redeem');

-- Redeem as the server.
select tests.as_superuser();
insert into auth.users (id, email) values ('10000000-0000-4000-8000-000000000001', 'new@t.test');
select lives_ok($$ select redeem_invitation('GDCDE234', '10000000-0000-4000-8000-000000000001', 'عضو جديد', 'new@t.test', 'Asia/Riyadh', '+966500000000', 'female', 'الرياض') $$,
  'valid code redeems');
select is((select count(*) from users where id = '10000000-0000-4000-8000-000000000001'), 1::bigint, 'profile created');
select is((select array_agg(role) from user_roles where user_id = '10000000-0000-4000-8000-000000000001'), array['member'::app_role], 'member role granted');
select is((select group_id from group_memberships where user_id = '10000000-0000-4000-8000-000000000001' and ended_on is null),
  '10000000-0000-4000-8000-0000000000a1'::uuid, 'active membership in the code''s group');
select is((select count(*) from plans where user_id = '10000000-0000-4000-8000-000000000001' and cohort_id = '10000000-0000-4000-8000-0000000000c1'),
  1::bigint, 'empty plan created for the cohort');

-- A 1-use code cannot be redeemed twice (row lock serializes concurrent attempts).
insert into auth.users (id, email) values ('10000000-0000-4000-8000-000000000002', 'second@t.test');
select throws_ok($$ select redeem_invitation('GDCDE234', '10000000-0000-4000-8000-000000000002', 'عضو ثانٍ', 'second@t.test', 'Asia/Riyadh') $$,
  'P0001', 'code_used_up', 'used-up code is refused');
select is((select count(*) from users where id = '10000000-0000-4000-8000-000000000002'), 0::bigint, 'nothing created for a refused redemption');

select * from finish();
rollback;
