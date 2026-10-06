create or replace function public.claim_admin() returns boolean language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then return false; end if;
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'hello@katiadejuan.com' then return false; end if;
  insert into public.user_roles(user_id, role) values (auth.uid(),'admin') on conflict do nothing;
  return true;
end $$;
delete from public.user_roles where role='admin' and user_id not in (select id from auth.users where lower(email)='hello@katiadejuan.com');