-- T104: community — peers of the current group only; preset encouragements between group
-- members, once per person per day; readable by sender and recipient only.
begin;
\ir _helpers.psql
select plan(15);

create temp table k (name text primary key, id uuid) on commit drop;
grant select on k to authenticated;
insert into cohorts (id, name, start_date) values ('80000000-0000-4000-8000-0000000000c1', 'دفعة المجتمع', current_date - 10);
insert into groups (id, cohort_id, name) values
  ('80000000-0000-4000-8000-0000000000a1', '80000000-0000-4000-8000-0000000000c1', 'مجموعة ١'),
  ('80000000-0000-4000-8000-0000000000a2', '80000000-0000-4000-8000-0000000000c1', 'مجموعة ٢');
insert into k values ('m1', tests.create_user('m1@t.test')), ('m2', tests.create_user('m2@t.test')),
  ('m3', tests.create_user('m3@t.test')), ('fac', tests.create_user('fac@t.test', '{facilitator,member}'));
select tests.join_group((select id from k where name='m1'), '80000000-0000-4000-8000-0000000000a1');
select tests.join_group((select id from k where name='m2'), '80000000-0000-4000-8000-0000000000a1');
select tests.join_group((select id from k where name='fac'), '80000000-0000-4000-8000-0000000000a1', 'facilitator');
select tests.join_group((select id from k where name='m3'), '80000000-0000-4000-8000-0000000000a2');
insert into encouragement_phrases (id, text, active) values
  ('80000000-0000-4000-8000-0000000000e1', 'بارك الله في سعيك', true),
  ('80000000-0000-4000-8000-0000000000e2', 'عبارة متوقفة', false);

select tests.authenticate_as((select id from k where name='m1'));
select is((select count(*) from group_peers()), 2::bigint, 'peers: the other member and the facilitator');
select ok(not exists (select 1 from group_peers() where user_id = (select id from k where name='m3')), 'peers exclude other groups');
select is((select count(*) from users), 1::bigint, 'profiles are still self-only outside group_peers');
select lives_ok($$ select send_encouragement((select id from k where name='m2'), '80000000-0000-4000-8000-0000000000e1') $$, 'encourage a group member');
select throws_like($$ select send_encouragement((select id from k where name='m2'), '80000000-0000-4000-8000-0000000000e1') $$, 'limit_reached%', 'once per person per day');
select throws_like($$ select send_encouragement((select id from k where name='m3'), '80000000-0000-4000-8000-0000000000e1') $$, 'forbidden%', 'not across groups');
select throws_like($$ select send_encouragement(auth.uid(), '80000000-0000-4000-8000-0000000000e1') $$, 'invalid_input%', 'not to oneself');
select throws_like($$ select send_encouragement((select id from k where name='fac'), '80000000-0000-4000-8000-0000000000e2') $$, 'invalid_input%', 'inactive phrases are refused');
select throws_ok($$ insert into encouragements (sender_id, recipient_id, phrase_id, local_date) values (auth.uid(), (select id from k where name='m2'), '80000000-0000-4000-8000-0000000000e1', current_date - 1) $$,
  '42501', null, 'no direct writes (no free text possible)');
select is((select count(*) from encouragements), 1::bigint, 'sender sees what they sent');

select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m2'));
select is((select count(*) from received_encouragements()), 1::bigint, 'recipient sees it');
select is((select sender_name from received_encouragements() limit 1), 'مستخدم m1', 'with the sender''s name');
select is((select phrase from received_encouragements() limit 1), 'بارك الله في سعيك', 'and the phrase');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='fac'));
select is((select count(*) from encouragements), 0::bigint, 'others (even the facilitator) cannot read it');
select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m3'));
select is((select count(*) from group_peers()), 0::bigint, 'alone in their group: no peers');

select * from finish();
rollback;
