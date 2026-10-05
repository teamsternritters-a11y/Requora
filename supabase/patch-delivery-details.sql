-- Add delivery contact/address columns to orders
alter table public.orders
  add column if not exists delivery_contact_name text,
  add column if not exists delivery_contact_email text,
  add column if not exists delivery_contact_phone text,
  add column if not exists delivery_address text,
  add column if not exists delivery_city text,
  add column if not exists delivery_state text,
  add column if not exists delivery_pincode text,
  add column if not exists delivery_instructions text;
