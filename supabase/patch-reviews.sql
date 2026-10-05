-- Drop the existing reviews table since it's missing columns
drop table if exists public.reviews cascade;

-- Reviews Table
create table public.reviews (
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
