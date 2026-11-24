-- 0025 Owner admin also by email: owner_phones fingerprints may be of a mobile (+E.164) or of an
-- email (lower-case). Matching accounts are admins now and on sign-up. Only hashes are stored.
insert into owner_phones (phone_sha256) values ('a0678edea4767ad8d369d7396952fdd26a0babe7863ef116f9f88726eebdf6c6') on conflict do nothing;

create or replace function grant_owner_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from owner_phones
    where phone_sha256 in (encode(sha256(convert_to(coalesce(new.phone, ''), 'UTF8')), 'hex'),
                           encode(sha256(convert_to(lower(coalesce(new.email, '')), 'UTF8')), 'hex'))
  ) then
    insert into user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger users_owner_admin on users;
create trigger users_owner_admin after insert or update of phone, email on users
  for each row execute function grant_owner_admin();

insert into user_roles (user_id, role)
select u.id, 'admin' from users u
where exists (
  select 1 from owner_phones o
  where o.phone_sha256 in (encode(sha256(convert_to(coalesce(u.phone, ''), 'UTF8')), 'hex'),
                           encode(sha256(convert_to(lower(coalesce(u.email, '')), 'UTF8')), 'hex'))
)
on conflict do nothing;
