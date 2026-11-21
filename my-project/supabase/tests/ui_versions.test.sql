-- T006 (spec 002): appearance preferences, habit icons, daily quotes, opening ritual.
begin;
\ir _helpers.psql
select plan(22);

create temp table k (name text primary key, id uuid) on commit drop;
grant select on k to authenticated;
insert into cohorts (id, name, start_date) values ('b0000000-0000-4000-8000-0000000000c1', 'دفعة المظهر', current_date - 3);
insert into groups (id, cohort_id, name) values ('b0000000-0000-4000-8000-0000000000a1', 'b0000000-0000-4000-8000-0000000000c1', 'مجموعة المظهر');
insert into k values ('m1', tests.create_user('m1@t.test')), ('m2', tests.create_user('m2@t.test')),
  ('admin', tests.create_user('admin@t.test', '{admin,member}'));
select tests.join_group((select id from k where name='m1'), 'b0000000-0000-4000-8000-0000000000a1');
insert into plans (id, user_id, cohort_id) values ('b0000000-0000-4000-8000-0000000000b1', (select id from k where name='m1'), 'b0000000-0000-4000-8000-0000000000c1');
insert into habits (plan_id, name, sort_order) values ('b0000000-0000-4000-8000-0000000000b1', 'قراءة', 0);
delete from quotes;
insert into quotes (text, sort_order) values ('الاقتباس الأول للاختبار', 1), ('الاقتباس الثاني للاختبار', 2), ('الاقتباس الثالث للاختبار', 3);

-- Defaults
select is((select ui_version::text from users where id = (select id from k where name='m1')), 'journey', 'default version is «رحلة يومي»');
select is((select ui_ritual from users where id = (select id from k where name='m1')), true, 'ritual on by default');
select is((select ui_chosen_at from users where id = (select id from k where name='m1')), null, 'no choice yet');

-- Self-service preferences
select tests.authenticate_as((select id from k where name='m1'));
select lives_ok($$ update users set ui_version = 'full_glass', ui_chosen_at = now() where id = auth.uid() $$, 'member sets own version');
update users set ui_version = 'glass' where id = (select id from k where name='m2');
select throws_ok($$ update users set ui_version = 'neon' where id = auth.uid() $$, '22P02', null, 'unknown version rejected');
select lives_ok($$ update habits set icon = 'menu_book' where true $$, 'curated habit icon accepted');
select lives_ok($$ insert into habits (plan_id, name, icon) values ('b0000000-0000-4000-8000-0000000000b1', 'نوم', 'bedtime') $$, 'icon on new habit');
select throws_ok($$ insert into habits (plan_id, name, icon) values ('b0000000-0000-4000-8000-0000000000b1', 'غريب', 'not_an_icon') $$, '23514', null, 'icon outside the curated list rejected');

select is((select h->>'icon' from jsonb_array_elements(get_today()->'habits') h where h->>'name' = 'قراءة'), 'menu_book', '«يومك» includes the habit icon');
select ok((get_today()->'habits'->0) ?& array['week_done', 'current_streak', 'description'], '«يومك» includes weekly progress and streak');

-- Quotes
select is((select count(*) from quotes), 3::bigint, 'members read active quotes');
select throws_ok($$ insert into quotes (text) values ('اقتباس من عضو غير مسموح') $$, '42501', null, 'members cannot write quotes');
select is((quote_for_date('2026-01-01')).text, 'الاقتباس الأول للاختبار', 'day 0 → first quote');
select is((quote_for_date('2026-01-02')).text, 'الاقتباس الثاني للاختبار', 'next day → next quote');
select is((quote_for_date('2026-01-04')).text, 'الاقتباس الأول للاختبار', 'rotates through the list');

-- Ritual (m1 is on full_glass, which shows it)
select is((today_ritual()->>'show')::boolean, true, 'ritual shows on first open of the day');
select lives_ok($$ select mark_ritual_seen() $$, 'mark the ritual seen');
select is((today_ritual()->>'show')::boolean, false, 'not shown again today');
select is((select count(*) from ritual_seen), 1::bigint, 'member sees own ritual record');
update users set ui_version = 'glass' where id = auth.uid();

select tests.as_superuser();
delete from ritual_seen where user_id = (select id from k where name='m1');
select is((select ui_version::text from users where id = (select id from k where name='m2')), 'journey', 'cannot change another member''s version');
select tests.authenticate_as((select id from k where name='m1'));
select is((today_ritual()->>'show')::boolean, false, '«زجاجي» has no ritual by default');

select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select lives_ok($$ insert into quotes (text, source) values ('اقتباس جديد من الإدارة', 'المصدر') $$, 'admin writes quotes');

select * from finish();
rollback;
