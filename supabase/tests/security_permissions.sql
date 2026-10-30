-- Run after all migrations against a disposable Supabase test project as the
-- database operator. This checks deployed grants; a JS build cannot check RLS.
begin;
do $$
begin
  if has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') then raise exception 'Customers must not update profile roles'; end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE') then raise exception 'Customers must be able to update their name'; end if;
  if has_table_privilege('authenticated', 'public.orders', 'UPDATE') then raise exception 'Orders must be updated through the protected API'; end if;
  if has_table_privilege('anon', 'public.integration_events', 'SELECT') or has_table_privilege('authenticated', 'public.integration_events', 'SELECT') then raise exception 'Integration events must not be public'; end if;
  if not has_table_privilege('service_role', 'public.orders', 'UPDATE') then raise exception 'Trusted server role requires order updates'; end if;
  if has_function_privilege('anon', 'public.is_admin()', 'EXECUTE') then raise exception 'Anonymous callers must not execute the admin helper'; end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'protect_profile_role' and not tgisinternal) then raise exception 'Role protection trigger is missing'; end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_variants' and policyname = 'active variants are public') then raise exception 'Active-product variant policy is missing'; end if;
end;
$$;
rollback;
