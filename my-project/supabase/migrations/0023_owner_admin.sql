-- 0023 Owner admin: accounts whose mobile matches a stored fingerprint (SHA-256 of the number in
-- +E.164 form) are admins: now if they already exist, and on sign-up otherwise. Only the hash is
-- kept here, never the number. Add a row to make another owner.
create table owner_phones (phone_sha256 text primary key check (phone_sha256 ~ '^[0-9a-f]{64}$'));
alter table owner_phones enable row level security;
revoke all on owner_phones from anon, authenticated;

insert into owner_phones (phone_sha256) values ('fd6c8fcf6f249e00baec280199463cb3ea12ab9a3f2365605181ac62e8056bd3');

create function grant_owner_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.phone is not null
     and exists (select 1 from owner_phones where phone_sha256 = encode(sha256(convert_to(new.phone, 'UTF8')), 'hex')) then
    insert into user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
revoke execute on function grant_owner_admin() from public, anon, authenticated;

create trigger users_owner_admin after insert or update of phone on users
  for each row execute function grant_owner_admin();

insert into user_roles (user_id, role)
select u.id, 'admin' from users u
where u.phone is not null
  and exists (select 1 from owner_phones o where o.phone_sha256 = encode(sha256(convert_to(u.phone, 'UTF8')), 'hex'))
on conflict do nothing;
