-- 0026: «رحلة البداية» status, finishing the setup, hiding the card, adding library habits.
begin;
\ir _helpers.psql
select plan(11);

insert into cohorts (id, name, start_date) values ('00000000-0000-4000-8000-00000000ab01', 'دفعة البداية', current_date - 1);
insert into groups (cohort_id, name, is_default) select '00000000-0000-4000-8000-00000000ab01', 'مجموعة البداية', false;
update groups set is_default = (cohort_id = '00000000-0000-4000-8000-00000000ab01');
create temp table k (name text primary key, id uuid) on commit drop;
insert into k values ('new', gen_random_uuid());
insert into auth.users (id, email) values ((select id from k), 'starter@example.test');
select register_member((select id from k), 'عضو جديد', '+966512349999', 'Asia/Riyadh', 'starter@example.test');
select tests.authenticate_as((select id from k));

select is(onboarding_status() ->> 'setup_completed', 'false', 'a new member has not done the setup');
select is((select count(*) from jsonb_each(onboarding_status()) where value = 'true'), 0::bigint, 'nothing is done yet');

update plans set current_state = 'بداية', desired_state = 'أن أكون أهدأ' where id = current_plan_id();
select add_plan_domain((select id from life_domains where key = 'self'));
select is(onboarding_status() ->> 'current_state', 'true', 'current state counts once written');
select is(onboarding_status() ->> 'domains', 'true', 'a chosen domain counts');

select is(add_library_habits(array(select id from habit_library where domain_id = (select id from life_domains where key = 'self') order by sort_order limit 2)), 2,
  'adds the chosen library habits');
select is(add_library_habits(array(select id from habit_library where domain_id = (select id from life_domains where key = 'self') order by sort_order limit 2)), 0,
  'does not add the same habit twice');
select is((select count(*) from habits h join focus_areas f on f.id = h.focus_area_id where h.plan_id = current_plan_id() and f.domain_id = h.domain_id), 2::bigint,
  'each habit sits under its domain');
select is(onboarding_status() ->> 'habit', 'true', 'a habit counts');

select finish_setup();
select is(onboarding_status() ->> 'setup_completed', 'true', 'finishing the setup is remembered');
select dismiss_onboarding();
select is(onboarding_status() ->> 'dismissed', 'true', 'the card can be hidden');

select throws_ok($$ select add_library_habits(array(select id from habit_library limit 13)) $$, 'P0001', 'invalid_input: too many', 'a few habits at a time');

select * from finish();
rollback;
