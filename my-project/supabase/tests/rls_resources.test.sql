-- T116: resources reach only their audience (program, cohorts, groups), including stored files;
-- admin-only writes for resources, stages, guidelines.
begin;
\ir _helpers.psql
select plan(17);

create temp table k (name text primary key, id uuid) on commit drop;
grant select on k to authenticated;
insert into cohorts (id, name, start_date) values
  ('90000000-0000-4000-8000-0000000000c1', 'دفعة الموارد ١', current_date - 10),
  ('90000000-0000-4000-8000-0000000000c2', 'دفعة الموارد ٢', current_date - 10);
insert into groups (id, cohort_id, name) values
  ('90000000-0000-4000-8000-0000000000a1', '90000000-0000-4000-8000-0000000000c1', 'ج١'),
  ('90000000-0000-4000-8000-0000000000a2', '90000000-0000-4000-8000-0000000000c1', 'ج٢'),
  ('90000000-0000-4000-8000-0000000000a3', '90000000-0000-4000-8000-0000000000c2', 'ج٣');
delete from guidelines; -- start without the seeded guidelines
insert into k values ('m1', tests.create_user('m1@t.test')), ('m2', tests.create_user('m2@t.test')),
  ('admin', tests.create_user('admin@t.test', '{admin,member}'));
select tests.join_group((select id from k where name='m1'), '90000000-0000-4000-8000-0000000000a1');
select tests.join_group((select id from k where name='m2'), '90000000-0000-4000-8000-0000000000a3');

insert into resources (id, type, title, storage_path, audience) values
  ('90000000-0000-4000-8000-000000000011', 'recording', 'تسجيل للبرنامج', 'program/r1.mp3', 'program'),
  ('90000000-0000-4000-8000-000000000012', 'file', 'ملف للدفعة ١', 'c1/r2.pdf', 'cohorts'),
  ('90000000-0000-4000-8000-000000000013', 'recording', 'تسجيل لمجموعة ج٢', 'g2/r3.mp3', 'groups'),
  ('90000000-0000-4000-8000-000000000014', 'file', 'ملف للدفعة ٢', 'c2/r4.pdf', 'cohorts');
insert into resource_audiences (resource_id, cohort_id, group_id) values
  ('90000000-0000-4000-8000-000000000012', '90000000-0000-4000-8000-0000000000c1', null),
  ('90000000-0000-4000-8000-000000000013', null, '90000000-0000-4000-8000-0000000000a2'),
  ('90000000-0000-4000-8000-000000000014', '90000000-0000-4000-8000-0000000000c2', null);
insert into storage.objects (bucket_id, name) values
  ('resources', 'program/r1.mp3'), ('resources', 'c1/r2.pdf'), ('resources', 'g2/r3.mp3'), ('resources', 'c2/r4.pdf');

select tests.authenticate_as((select id from k where name='m1'));
select is((select array_agg(title order by title) from resources where id::text like '90000000%'), array['تسجيل للبرنامج', 'ملف للدفعة ١'], 'member sees program and own-cohort resources only');
select is((select count(*) from storage.objects where bucket_id = 'resources'), 2::bigint, 'member can read only those files (direct links outside the audience fail)');
select is((select count(*) from resource_audiences), 1::bigint, 'audience rows follow the same rule');
select throws_ok($$ insert into resources (type, title, url, audience) values ('reference', 'مرجع', 'https://example.org', 'program') $$, '42501', null, 'member cannot add resources');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('resources', 'x/evil.pdf') $$, '42501', null, 'member cannot upload files');
select throws_ok($$ insert into guidelines (number, text) values (1, 'عرف') $$, '42501', null, 'member cannot write guidelines');
update journey_stages set title = 'تغيير' where true;
select is((select count(*) from journey_stages where title = 'تغيير'), 0::bigint, 'member cannot edit journey stages');

select tests.as_superuser(); select tests.authenticate_as((select id from k where name='m2'));
select is((select array_agg(title order by title) from resources where id::text like '90000000%'), array['تسجيل للبرنامج', 'ملف للدفعة ٢'], 'another cohort''s member sees their own set');
select is((select count(*) from storage.objects where bucket_id = 'resources' and name = 'c1/r2.pdf'), 0::bigint, 'and cannot read cohort ١''s file');

select tests.as_superuser(); select tests.authenticate_as((select id from k where name='admin'));
select is((select count(*) from resources where id::text like '90000000%'), 4::bigint, 'admin sees every resource');
select lives_ok($$ select save_resource(null, 'reference', 'مرجع مقترح', 'وصف', 'كتب', null, 'https://example.org/book', 'groups', null,
  array['90000000-0000-4000-8000-0000000000a1']::uuid[]) $$, 'admin saves a resource with a group audience');
select throws_ok($$ insert into resources (type, title, audience) values ('reference', 'بلا رابط', 'program') $$, '23514', null, 'a reference needs a link');
select throws_ok($$ insert into resources (type, title, audience) values ('recording', 'بلا ملف', 'program') $$, '23514', null, 'a recording needs a file or link');
select lives_ok($$ insert into guidelines (number, text) values (1, 'العرف الأول') $$, 'admin writes a guideline');
select throws_ok($$ insert into guidelines (number, text) values (11, 'زائد') $$, '23514', null, 'only ten guidelines');
select throws_ok($$ insert into guidelines (number, text) values (1, 'مكرر') $$, '23505', null, 'one text per guideline number');
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('resources', 'admin/new.pdf') $$, 'admin can upload files');

select * from finish();
rollback;
