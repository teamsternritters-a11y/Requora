alter table public.orders drop constraint if exists orders_selection_id_fkey;
alter table public.orders drop constraint if exists orders_requirement_id_fkey;
alter table public.orders drop constraint if exists orders_offer_id_fkey;

alter table public.orders add constraint orders_selection_id_fkey foreign key (selection_id) references public.selections(id) on delete cascade;
alter table public.orders add constraint orders_requirement_id_fkey foreign key (requirement_id) references public.requirements(id) on delete cascade;
alter table public.orders add constraint orders_offer_id_fkey foreign key (offer_id) references public.offers(id) on delete cascade;
