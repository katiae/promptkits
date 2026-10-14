CREATE OR REPLACE FUNCTION public.claim_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare ok boolean;
begin
  if auth.uid() is null then return false; end if;
  -- Read the verified email from the auth record, not the token claim.
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and lower(u.email) = 'hello@katiadejuan.com'
  ) into ok;
  if not ok then return false; end if;
  insert into public.user_roles(user_id, role) values (auth.uid(),'admin') on conflict do nothing;
  return true;
end $function$;