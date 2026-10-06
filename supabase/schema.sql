-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Custom Types (safe to re-run)
do $$ begin
  create type user_role as enum ('customer', 'provider');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type requirement_status as enum ('open', 'closed', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type offer_status as enum ('pending', 'shortlisted', 'selected', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type notification_type as enum ('new_offer', 'shortlisted', 'selected', 'closed', 'new_requirement', 'offer_rejected');
exception when duplicate_object then null;
end $$;

-- Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text not null,
  avatar_url text,
  role user_role not null,
  bio text,
  location text,
  website text,
  rating numeric(3,2) default 0.0,
  review_count integer default 0,
  skills text[] default '{}',
  years_experience integer,
  portfolio_urls text[] default '{}',
  projects_completed integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories Table
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  icon text not null,
  description text,
  parent_id uuid references public.categories(id),
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Requirements Table
create table if not exists public.requirements (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete restrict not null,
  title text not null,
  description text not null,
  requirement_type text not null,
  budget_min numeric not null,
  budget_max numeric not null,
  deadline timestamp with time zone not null,
  preferences jsonb default '{}'::jsonb,
  reference_files text[] default '{}',
  status requirement_status default 'open' not null,
  offer_count integer default 0,
  views integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Offers Table
create table if not exists public.offers (
  id uuid default uuid_generate_v4() primary key,
  requirement_id uuid references public.requirements(id) on delete cascade not null,
  provider_id uuid references public.profiles(id) on delete cascade not null,
  price numeric not null,
  delivery_days integer not null,
  proposal text not null,
  portfolio_urls text[] default '{}',
  status offer_status default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(requirement_id, provider_id)
);

-- Offer Scores Table
create table if not exists public.offer_scores (
  id uuid default uuid_generate_v4() primary key,
  offer_id uuid references public.offers(id) on delete cascade not null unique,
  budget_score integer not null,
  delivery_score integer not null,
  relevance_score integer not null,
  total_score integer not null,
  explanation jsonb not null,
  calculated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Shortlists Table
create table if not exists public.shortlists (
  id uuid default uuid_generate_v4() primary key,
  requirement_id uuid references public.requirements(id) on delete cascade not null,
  offer_id uuid references public.offers(id) on delete cascade not null,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(requirement_id, offer_id, customer_id)
);

-- Selections Table
create table if not exists public.selections (
  id uuid default uuid_generate_v4() primary key,
  requirement_id uuid references public.requirements(id) on delete cascade not null unique,
  offer_id uuid references public.offers(id) on delete cascade not null unique,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  provider_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews Table
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  requirement_id uuid references public.requirements(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(requirement_id, reviewer_id, reviewee_id)
);

-- Notifications Table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type notification_type not null,
  title text not null,
  message text not null,
  data jsonb default '{}'::jsonb,
  read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Functions & Triggers
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,''), '@', 1), 'User'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'::user_role)
  )
  on conflict (id) do update set
    email      = excluded.email,
    full_name  = excluded.full_name,
    updated_at = now();
  return new;
exception when others then
  raise warning 'handle_new_user failed: %', sqlerrm;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.increment_offer_count(req_id uuid)
returns void as $$
begin
  update public.requirements
  set offer_count = offer_count + 1
  where id = req_id;
end;
$$ language plpgsql security definer;

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.requirements enable row level security;
alter table public.offers enable row level security;
alter table public.offer_scores enable row level security;
alter table public.shortlists enable row level security;
alter table public.selections enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

-- Drop existing policies before recreating (idempotent)
do $$ declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Profiles
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Categories
create policy "Categories are viewable by everyone" on public.categories for select using (true);

-- Requirements
create policy "Requirements are viewable by everyone" on public.requirements for select using (
  status = 'open' 
  or auth.uid() = customer_id 
  or exists (select 1 from public.selections where requirement_id = public.requirements.id and provider_id = auth.uid())
);
create policy "Customers can insert own requirements" on public.requirements for insert with check (auth.uid() = customer_id);
create policy "Customers can update own requirements" on public.requirements for update using (auth.uid() = customer_id);
create policy "Customers can delete own requirements" on public.requirements for delete using (auth.uid() = customer_id);

-- Offers
create policy "Providers can view own offers" on public.offers for select using (auth.uid() = provider_id);
create policy "Customers can view offers on their requirements" on public.offers for select using (
  exists (select 1 from public.requirements where id = requirement_id and customer_id = auth.uid())
);
create policy "Providers can insert own offers" on public.offers for insert with check (auth.uid() = provider_id);
create policy "Providers can update own offers" on public.offers for update using (auth.uid() = provider_id);
create policy "Customers can update offers on their requirements" on public.offers for update using (
  exists (select 1 from public.requirements where id = requirement_id and customer_id = auth.uid())
);

-- Offer Scores
create policy "Scores viewable if offer is viewable" on public.offer_scores for select using (
  exists (select 1 from public.offers o where o.id = offer_id and (o.provider_id = auth.uid() or exists (select 1 from public.requirements r where r.id = o.requirement_id and r.customer_id = auth.uid())))
);
create policy "Providers can insert scores for own offers" on public.offer_scores for insert with check (
  exists (select 1 from public.offers where id = offer_id and provider_id = auth.uid())
);

-- Shortlists
create policy "Customers can manage own shortlists" on public.shortlists for all using (auth.uid() = customer_id);
create policy "Providers can view shortlists for own offers" on public.shortlists for select using (
  exists (select 1 from public.offers where id = offer_id and provider_id = auth.uid())
);

-- Selections
create policy "Customers can insert selections" on public.selections for insert with check (auth.uid() = customer_id);
create policy "Users can view selections" on public.selections for select using (
  auth.uid() = customer_id or auth.uid() = provider_id
);

-- Reviews
create policy "Reviews are viewable by everyone" on public.reviews for select using (true);
create policy "Users can insert reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);

-- Notifications
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can insert notifications" on public.notifications for insert with check (true);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- Seed Data (Categories) - safe to re-run
insert into public.categories (name, slug, icon, sort_order) values
  ('Web Development',   'web-development',   'ðŸ’»', 1),
  ('Logo & Branding',   'logo-branding',      'ðŸŽ¨', 2),
  ('Mobile App',        'mobile-app',         'ðŸ“±', 3),
  ('Software & Tech',   'software-tech',      'ðŸ”§', 4),
  ('Content Writing',   'content-writing',    'âœï¸', 5),
  ('Electronics',       'electronics',        '🔌', 6),
  ('Clothing & Apparel','clothing-apparel',   '👕', 7),
  ('Home & Furniture',  'home-furniture',     '🛋️', 8),
  ('Health & Beauty',   'health-beauty',      '🧴', 9),
  ('Toys & Games',      'toys-games',         '🎲', 10),
  ('Office Supplies',   'office-supplies',    '📎', 11),
  ('Computer Services', 'computer-services',  'ðŸ–¥ï¸', 7),
  ('Photography',       'photography',        'ðŸ“·', 8)
on conflict (slug) do nothing;

-- Storage Buckets & Policies
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('reference-files', 'reference-files', true) on conflict (id) do update set public = true;

drop policy if exists "Avatars are publicly accessible" on storage.objects;
drop policy if exists "Users can upload avatars" on storage.objects;
drop policy if exists "Users can update avatars" on storage.objects;
drop policy if exists "Users can delete avatars" on storage.objects;
create policy "Avatars are publicly accessible" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload avatars" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Users can update avatars" on storage.objects for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Users can delete avatars" on storage.objects for delete using (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "Users can view reference files" on storage.objects;
drop policy if exists "Users can upload reference files" on storage.objects;
drop policy if exists "Users can update reference files" on storage.objects;
drop policy if exists "Users can delete reference files" on storage.objects;
create policy "Users can view reference files" on storage.objects for select using (bucket_id = 'reference-files' and auth.role() = 'authenticated');
create policy "Users can upload reference files" on storage.objects for insert with check (bucket_id = 'reference-files' and auth.role() = 'authenticated');
create policy "Users can update reference files" on storage.objects for update using (bucket_id = 'reference-files' and auth.role() = 'authenticated');
create policy "Users can delete reference files" on storage.objects for delete using (bucket_id = 'reference-files' and auth.role() = 'authenticated');

-- ============================================================
-- ReverseMarket v2 â€” Orders, Payments, Delivery, Escrow
-- ADDITIVE ONLY â€” does not modify any existing tables
-- Safe to run multiple times (idempotent)
-- ============================================================

-- â”€â”€â”€ New Enums â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

do $$ begin
  create type order_status as enum (
    'pending', 'paid', 'escrowed', 'in_progress', 'delivered',
    'revision_requested', 'approved', 'completed', 'cancelled', 'refunded', 'disputed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_method as enum ('upi', 'card', 'net_banking', 'wallet', 'demo');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_status as enum ('pending', 'completed', 'failed', 'refunded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type escrow_status as enum ('held', 'released', 'refunded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type delivery_type as enum ('digital', 'physical');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type physical_delivery_status as enum (
    'packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type delivery_review_status as enum (
    'pending', 'approved', 'revision_requested', 'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type transaction_type as enum (
    'payment', 'escrow_hold', 'escrow_release', 'refund', 'fee'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type dispute_status as enum ('open', 'resolved', 'escalated');
exception when duplicate_object then null;
end $$;

-- â”€â”€â”€ Extend notification_type enum â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- NOTE: Postgres cannot remove enum values, only add
alter type notification_type add value if not exists 'payment_received';
alter type notification_type add value if not exists 'order_created';
alter type notification_type add value if not exists 'delivery_submitted';
alter type notification_type add value if not exists 'delivery_approved';
alter type notification_type add value if not exists 'delivery_revision_requested';
alter type notification_type add value if not exists 'order_completed';
alter type notification_type add value if not exists 'refund_issued';
alter type notification_type add value if not exists 'dispute_raised';

-- â”€â”€â”€ Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table if not exists public.orders (
  id               uuid default uuid_generate_v4() primary key,
  selection_id     uuid references public.selections(id) on delete cascade not null unique,
  requirement_id   uuid references public.requirements(id) on delete cascade not null,
  offer_id         uuid references public.offers(id) on delete cascade not null,
  customer_id      uuid references public.profiles(id) on delete restrict not null,
  provider_id      uuid references public.profiles(id) on delete restrict not null,
  amount           numeric not null,
  platform_fee     numeric default 0 not null,
  status           order_status default 'pending' not null,
  requirement_type text not null default 'digital',
  notes            text,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

-- â”€â”€â”€ Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table if not exists public.payments (
  id              uuid default uuid_generate_v4() primary key,
  order_id        uuid references public.orders(id) on delete cascade not null,
  customer_id     uuid references public.profiles(id) on delete restrict not null,
  amount          numeric not null,
  method          payment_method not null,
  status          payment_status default 'pending' not null,
  transaction_ref text,
  paid_at         timestamptz,
  created_at      timestamptz default now() not null
);

-- â”€â”€â”€ Escrow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table if not exists public.escrow_records (
  id           uuid default uuid_generate_v4() primary key,
  order_id     uuid references public.orders(id) on delete cascade not null unique,
  amount       numeric not null,
  status       escrow_status default 'held' not null,
  held_at      timestamptz default now() not null,
  released_at  timestamptz,
  released_to  uuid references public.profiles(id)
);

-- â”€â”€â”€ Deliveries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table if not exists public.deliveries (
  id                   uuid default uuid_generate_v4() primary key,
  order_id             uuid references public.orders(id) on delete cascade not null,
  provider_id          uuid references public.profiles(id) on delete restrict not null,
  type                 delivery_type not null default 'digital',
  -- Digital delivery
  files                text[] default '{}',
  drive_link           text,
  github_link          text,
  extra_links          text[] default '{}',
  notes                text,
  -- Physical delivery
  courier              text,
  tracking_number      text,
  shipment_date        timestamptz,
  estimated_arrival    timestamptz,
  physical_status      physical_delivery_status,
  -- Review
  status               delivery_review_status default 'pending' not null,
  revision_notes       text,
  submitted_at         timestamptz default now() not null,
  reviewed_at          timestamptz
);

-- â”€â”€â”€ Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table if not exists public.transactions (
  id          uuid default uuid_generate_v4() primary key,
  order_id    uuid references public.orders(id) on delete cascade not null,
  type        transaction_type not null,
  from_user   uuid references public.profiles(id),
  to_user     uuid references public.profiles(id),
  amount      numeric not null,
  description text,
  created_at  timestamptz default now() not null
);

-- â”€â”€â”€ Order Events (Activity Log) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table if not exists public.order_events (
  id          uuid default uuid_generate_v4() primary key,
  order_id    uuid references public.orders(id) on delete cascade not null,
  actor_id    uuid references public.profiles(id),
  event_type  text not null,
  description text,
  data        jsonb default '{}',
  created_at  timestamptz default now() not null
);

-- â”€â”€â”€ Disputes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table if not exists public.disputes (
  id          uuid default uuid_generate_v4() primary key,
  order_id    uuid references public.orders(id) on delete cascade not null unique,
  raised_by   uuid references public.profiles(id) on delete restrict not null,
  reason      text not null,
  status      dispute_status default 'open' not null,
  resolution  text,
  created_at  timestamptz default now() not null,
  resolved_at timestamptz
);

-- â”€â”€â”€ Indexes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create index if not exists idx_orders_customer    on public.orders(customer_id);
create index if not exists idx_orders_provider    on public.orders(provider_id);
create index if not exists idx_orders_status      on public.orders(status);
create index if not exists idx_orders_requirement on public.orders(requirement_id);
create index if not exists idx_payments_order     on public.payments(order_id);
create index if not exists idx_payments_customer  on public.payments(customer_id);
create index if not exists idx_deliveries_order   on public.deliveries(order_id);
create index if not exists idx_deliveries_provider on public.deliveries(provider_id);
create index if not exists idx_transactions_order on public.transactions(order_id);
create index if not exists idx_order_events_order on public.order_events(order_id);
create index if not exists idx_disputes_order     on public.disputes(order_id);

-- â”€â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

alter table public.orders          enable row level security;
alter table public.payments        enable row level security;
alter table public.escrow_records  enable row level security;
alter table public.deliveries      enable row level security;
alter table public.transactions    enable row level security;
alter table public.order_events    enable row level security;
alter table public.disputes        enable row level security;

-- Drop existing v2 policies (idempotent)
do $$ declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
    and tablename in ('orders','payments','escrow_records','deliveries','transactions','order_events','disputes')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Helper to check order party (security definer avoids circular RLS in joins)
create or replace function public.is_order_party(p_order_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.orders
    where id = p_order_id
      and (customer_id = auth.uid() or provider_id = auth.uid())
  );
$$ language sql security definer stable;

-- Orders
create policy "Parties can view own orders"   on public.orders for select using (auth.uid() = customer_id or auth.uid() = provider_id);
create policy "System can insert orders"      on public.orders for insert with check (auth.uid() = customer_id);
create policy "Parties can update own orders" on public.orders for update using (auth.uid() = customer_id or auth.uid() = provider_id);

-- Payments — both parties can view
create policy "Parties can view payments"     on public.payments for select using (public.is_order_party(order_id));
create policy "Customers can insert payments" on public.payments for insert with check (auth.uid() = customer_id);

-- Escrow — both parties can view
create policy "Parties can view escrow"  on public.escrow_records for select using (public.is_order_party(order_id));
create policy "System can insert escrow" on public.escrow_records for insert with check (public.is_order_party(order_id));
create policy "System can update escrow" on public.escrow_records for update using (public.is_order_party(order_id));

-- Deliveries — both parties can view
create policy "Providers can insert deliveries"      on public.deliveries for insert with check (auth.uid() = provider_id);
create policy "Parties can view deliveries"          on public.deliveries for select using (public.is_order_party(order_id));
create policy "Providers can update own deliveries"  on public.deliveries for update using (auth.uid() = provider_id);
create policy "Customers can update delivery review" on public.deliveries for update using (public.is_order_party(order_id));

-- Transactions
create policy "Parties can view own transactions" on public.transactions for select using (auth.uid() = from_user or auth.uid() = to_user or public.is_order_party(order_id));
create policy "System can insert transactions"    on public.transactions for insert with check (public.is_order_party(order_id));

-- Order Events
create policy "Parties can view order events"  on public.order_events for select using (public.is_order_party(order_id));
create policy "System can insert order events" on public.order_events for insert with check (public.is_order_party(order_id));

-- Disputes
create policy "Parties can view disputes"    on public.disputes for select using (auth.uid() = raised_by or public.is_order_party(order_id));
create policy "Parties can insert disputes"  on public.disputes for insert with check (public.is_order_party(order_id));

-- â”€â”€â”€ Storage bucket for delivery files â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
insert into storage.buckets (id, name, public)
  values ('delivery-files', 'delivery-files', false)
  on conflict do nothing;

drop policy if exists "Providers can upload delivery files" on storage.objects;
drop policy if exists "Parties can view delivery files" on storage.objects;
drop policy if exists "Providers can delete delivery files" on storage.objects;
create policy "Providers can upload delivery files" on storage.objects
  for insert with check (bucket_id = 'delivery-files' and auth.role() = 'authenticated');
create policy "Parties can view delivery files" on storage.objects
  for select using (bucket_id = 'delivery-files' and auth.role() = 'authenticated');
create policy "Providers can delete delivery files" on storage.objects
  for delete using (bucket_id = 'delivery-files' and auth.role() = 'authenticated');

-- Reviews Table
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null unique,
  requirement_id uuid references public.requirements(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  title text not null,
  comment text,
  created_at timestamptz default now() not null
);

-- Indexes
create index if not exists idx_reviews_order on public.reviews(order_id);
create index if not exists idx_reviews_reviewee on public.reviews(reviewee_id);
create index if not exists idx_reviews_reviewer on public.reviews(reviewer_id);

-- RLS
alter table public.reviews enable row level security;

drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public" on public.reviews for select using (true);

drop policy if exists "Customers can insert reviews for their completed orders" on public.reviews;
create policy "Customers can insert reviews for their completed orders" on public.reviews for insert with check (
  auth.uid() = reviewer_id and
  exists (
    select 1 from public.orders 
    where id = order_id 
      and customer_id = auth.uid() 
      and status = 'completed'
  )
);

-- Function to update provider rating
create or replace function update_provider_rating()
returns trigger as $$
declare
  avg_rating numeric;
  total_reviews int;
begin
  select count(*), coalesce(avg(rating), 0)
  into total_reviews, avg_rating
  from public.reviews
  where reviewee_id = NEW.reviewee_id;

  update public.profiles
  set rating = round(avg_rating, 2),
      review_count = total_reviews,
      updated_at = now()
  where id = NEW.reviewee_id;

  return NEW;
end;
$$ language plpgsql;

drop trigger if exists on_review_created on public.reviews;
create trigger on_review_created
  after insert or update or delete on public.reviews
  for each row execute procedure update_provider_rating();

alter type notification_type add value if not exists 'new_review';
