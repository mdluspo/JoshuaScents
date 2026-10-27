create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists addresses_one_default_per_user
  on public.addresses (user_id)
  where is_default;

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.addresses enable row level security;
alter table public.favorites enable row level security;
alter table public.integration_events enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy "users see their addresses"
on public.addresses for select
using (auth.uid() = user_id);

create policy "users add their addresses"
on public.addresses for insert
with check (auth.uid() = user_id);

create policy "users update their addresses"
on public.addresses for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users delete their addresses"
on public.addresses for delete
using (auth.uid() = user_id);

create policy "users see their favorites"
on public.favorites for select
using (auth.uid() = user_id);

create policy "users add their favorites"
on public.favorites for insert
with check (auth.uid() = user_id);

create policy "users delete their favorites"
on public.favorites for delete
using (auth.uid() = user_id);

create policy "admins see all profiles"
on public.profiles for select
using (public.is_admin());

create policy "admins see all orders"
on public.orders for select
using (public.is_admin());

create policy "admins update all orders"
on public.orders for update
using (public.is_admin())
with check (public.is_admin());

create policy "admins see all order items"
on public.order_items for select
using (public.is_admin());

create policy "admins manage products"
on public.products for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage variants"
on public.product_variants for all
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on public.addresses to authenticated;
grant select, insert, delete on public.favorites to authenticated;

update public.orders as store_order
set user_id = auth_user.id
from auth.users as auth_user
where store_order.user_id is null
  and lower(store_order.customer_email) = lower(auth_user.email);

