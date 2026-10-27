create extension if not exists pgcrypto;

create type public.order_status as enum (
  'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);

create type public.payment_method as enum ('paymongo', 'cod');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id bigint primary key,
  name text not null,
  brand text not null,
  family text not null,
  category text not null,
  notes text not null,
  description text not null,
  image_url text,
  is_best_seller boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  size_label text not null,
  price_centavos integer not null check (price_centavos > 0),
  stock integer not null default 0 check (stock >= 0),
  unique (product_id, size_label)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  status public.order_status not null default 'pending_payment',
  payment_method public.payment_method not null,
  payment_provider_id text unique,
  subtotal_centavos integer not null check (subtotal_centavos >= 0),
  shipping_centavos integer not null default 0 check (shipping_centavos >= 0),
  total_centavos integer not null check (total_centavos >= 0),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address_line text not null,
  city text not null,
  postal_code text not null,
  latitude numeric,
  longitude numeric,
  delivery_provider text,
  delivery_quote_id text,
  delivery_order_id text,
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id),
  product_name text not null,
  size_label text not null,
  unit_price_centavos integer not null check (unit_price_centavos > 0),
  quantity integer not null check (quantity > 0),
  line_total_centavos integer not null check (line_total_centavos > 0)
);

create table public.integration_events (
  id text primary key,
  provider text not null,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb not null
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "catalog is public" on public.products for select using (is_active = true);
create policy "variants are public" on public.product_variants for select using (true);
create policy "users see their profile" on public.profiles for select using (auth.uid() = id);
create policy "users update their profile" on public.profiles for update using (auth.uid() = id);
create policy "users see their orders" on public.orders for select using (auth.uid() = user_id);
create policy "users see their order items" on public.order_items for select using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.create_store_order(
  p_reference text,
  p_payment_method public.payment_method,
  p_subtotal_centavos integer,
  p_shipping_centavos integer,
  p_total_centavos integer,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_address_line text,
  p_city text,
  p_postal_code text,
  p_latitude numeric,
  p_longitude numeric,
  p_delivery_quote_id text,
  p_items jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_order_id uuid;
begin
  insert into public.orders (
    reference, payment_method, subtotal_centavos, shipping_centavos, total_centavos,
    customer_name, customer_email, customer_phone, address_line, city, postal_code,
    latitude, longitude, delivery_provider, delivery_quote_id
  ) values (
    p_reference, p_payment_method, p_subtotal_centavos, p_shipping_centavos, p_total_centavos,
    p_customer_name, p_customer_email, p_customer_phone, p_address_line, p_city, p_postal_code,
    p_latitude, p_longitude, case when p_delivery_quote_id is null then null else 'lalamove' end, p_delivery_quote_id
  ) returning id into new_order_id;

  insert into public.order_items (order_id, product_id, product_name, size_label, unit_price_centavos, quantity, line_total_centavos)
  select new_order_id, product_id, product_name, size_label, unit_price_centavos, quantity, line_total_centavos
  from jsonb_to_recordset(p_items) as item(
    product_id bigint, product_name text, size_label text,
    unit_price_centavos integer, quantity integer, line_total_centavos integer
  );

  return new_order_id;
end;
$$;

revoke all on function public.create_store_order from public, anon, authenticated;
grant execute on function public.create_store_order to service_role;

insert into public.products (id, name, brand, family, category, notes, description, is_best_seller) values
  (1, 'Bleu de Chanel', 'Creed', 'Fresh', 'FRESH', 'Fresh, Woody', 'A clean woody aromatic fragrance.', true),
  (2, 'Sauvage EDP', 'Creed', 'Fresh', 'FRESH', 'Fresh, Spicy', 'A fresh spicy fragrance.', true),
  (3, 'Aventus', 'Creed', 'Fresh', 'FRESH', 'Fruity, Chypre, Smoky', 'A fruity smoky composition.', true),
  (4, 'Y EDP', 'HSI', 'Woody', 'TIMBER & SMOKE', 'Fresh, Fougere', 'A modern fresh woody fragrance.', false),
  (5, 'Oud Wood', 'HSI', 'Woody', 'TIMBER & SMOKE', 'Woody, Oud, Spicy', 'A quiet woody oud fragrance.', false),
  (6, 'La Nuit de L''Homme', 'JEM', 'Woody', 'TIMBER & SMOKE', 'Spicy, Woody, Warm', 'A warm evening fragrance.', false),
  (7, 'Grand Soir', 'JEM', 'Warm & Spicy', 'GOLDEN VANILLA', 'Amber, Vanilla, Warm', 'An elegant amber vanilla fragrance.', true),
  (8, 'Black Orchid', 'PRMNKY', 'Warm & Spicy', 'GOLDEN VANILLA', 'Dark, Floral, Earthy', 'A bold dark floral fragrance.', false),
  (9, 'Baccarat Rouge 540', 'PRMNKY', 'Floral', 'GOLDEN VANILLA', 'Floral, Woody, Musky', 'A luminous woody floral fragrance.', true),
  (10, 'Dior Homme Intense', 'ZENIN', 'Floral', 'AFTER HOURS', 'Iris, Lavender, Leather', 'A refined iris fragrance.', false),
  (11, 'Tobacco Vanille', 'ZENIN', 'Warm & Spicy', 'AFTER HOURS', 'Tobacco, Vanilla, Spice', 'A rich tobacco vanilla fragrance.', true),
  (12, 'Terre d''Hermes', 'ZENIN', 'Woody', 'EVERYDAY', 'Woody, Earthy, Citrus', 'A grounded woody citrus fragrance.', false)
on conflict (id) do nothing;

insert into public.product_variants (product_id, size_label, price_centavos, stock) values
  (1,'2ml',25000,50),(1,'5ml',48000,50),(1,'10ml',85000,50),
  (2,'2ml',28000,50),(2,'5ml',53000,50),(2,'10ml',92000,50),
  (3,'2ml',65000,50),(3,'5ml',120000,50),(3,'10ml',210000,50),
  (4,'2ml',26000,50),(4,'5ml',49000,50),(4,'10ml',88000,50),
  (5,'2ml',58000,50),(5,'5ml',110000,50),(5,'10ml',190000,50),
  (6,'2ml',29000,50),(6,'5ml',55000,50),(6,'10ml',95000,50),
  (7,'2ml',42000,50),(7,'5ml',79000,50),(7,'10ml',138000,50),
  (8,'2ml',37000,50),(8,'5ml',70000,50),(8,'10ml',120000,50),
  (9,'2ml',85000,50),(9,'5ml',160000,50),(9,'10ml',280000,50),
  (10,'2ml',32000,50),(10,'5ml',61000,50),(10,'10ml',105000,50),
  (11,'2ml',59000,50),(11,'5ml',112000,50),(11,'10ml',195000,50),
  (12,'2ml',30000,50),(12,'5ml',57000,50),(12,'10ml',99000,50)
on conflict (product_id, size_label) do nothing;
