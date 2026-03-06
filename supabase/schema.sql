-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles Table (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  role text check (role in ('buyer', 'farmer', 'admin')) default 'buyer',
  display_name text,
  full_name text,
  phone text,
  avatar_url text,
  address text,
  city text,
  country text,
  bio text,
  latitude numeric,
  longitude numeric,
  rating numeric,
  total_reviews integer,
  is_verified boolean default false,
  email_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( (select auth.uid()) = id );

create policy "Users can update own profile."
  on profiles for update
  using ( (select auth.uid()) = id );

create policy "Admins can update any profile."
  on profiles for update
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- Listings Table
create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  farmer_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  category text,
  price_per_unit numeric not null,
  unit text not null,
  quantity integer default 0,
  min_pool_qty integer default 1,
  images jsonb default '[]'::jsonb,
  organic boolean default false,
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  country text,
  harvest_date timestamp with time zone,
  expiry_date timestamp with time zone,
  status text check (status in ('available', 'sold_out', 'expired', 'inactive')) default 'available',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.listings enable row level security;

create policy "Listings are viewable by everyone."
  on listings for select
  using ( true );

create policy "Farmers can insert their own listings."
  on listings for insert
  with check ( (select auth.uid()) = farmer_id );

create policy "Farmers can update their own listings."
  on listings for update
  using ( (select auth.uid()) = farmer_id );

create policy "Admins can update any listing."
  on listings for update
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "Admins can delete any listing."
  on listings for delete
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- Pools Table
create table public.pools (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  leader_id uuid references public.profiles(id) on delete set null,
  min_quantity integer not null,
  current_quantity integer default 0,
  expires_at timestamp with time zone not null,
  status text check (status in ('active', 'locked', 'funded', 'completed', 'cancelled', 'expired')) default 'active',
  latitude double precision,
  longitude double precision,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pools enable row level security;

create policy "Pools are viewable by everyone."
  on pools for select
  using ( true );

create policy "Authenticated users can create pools."
  on pools for insert
  with check ( auth.role() = 'authenticated' );

create policy "Admins can update any pool."
  on pools for update
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "Admins can delete any pool."
  on pools for delete
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references public.profiles(id) not null,
  pool_id uuid references public.pools(id) not null,
  listing_id uuid references public.listings(id),
  quantity integer not null,
  amount numeric not null,
  payment_status text check (payment_status in ('pending', 'paid', 'failed', 'refunded')) default 'pending',
  status text check (status in ('pending', 'confirmed', 'delivered', 'cancelled')) default 'pending',
  payment_reference text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;

create policy "Users can view their own orders."
  on orders for select
  using ( (select auth.uid()) = buyer_id );

create policy "Users can create orders."
  on orders for insert
  with check ( (select auth.uid()) = buyer_id );

create policy "Users can update their own orders."
  on orders for update
  using ( (select auth.uid()) = buyer_id );

create policy "Admins can view all orders."
  on orders for select
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "Admins can update any order."
  on orders for update
  using ( 
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- Pool Members Table
create table public.pool_members (
  pool_id uuid references public.pools(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  quantity_pledged integer not null,
  amount_pledged numeric not null,
  payment_status text check (payment_status in ('pending', 'authorized', 'captured', 'voided')) default 'pending',
  payment_reference text,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (pool_id, user_id)
);

alter table public.pool_members enable row level security;

create policy "Pool members are viewable by all."
  on pool_members for select
  using ( true );

create policy "Users can join pools."
  on pool_members for insert
  with check ( (select auth.uid()) = user_id );

create policy "Users can update their own pool membership."
  on pool_members for update
  using ( (select auth.uid()) = user_id );

-- Pool Chat Table
create table public.pool_chat (
  id uuid default uuid_generate_v4() primary key,
  pool_id uuid references public.pools(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pool_chat enable row level security;

create policy "Pool chat is viewable by all."
  on pool_chat for select
  using ( true );

create policy "Users can post to pool chat."
  on pool_chat for insert
  with check ( (select auth.uid()) = user_id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  ghost_id uuid;
  user_role public.app_role;
begin
  -- 1. Identify valid Ghost Profile (Same email, different ID)
  select id into ghost_id from public.profiles where email = new.email and id <> new.id;

  if ghost_id is not null then
    -- 2. Manually Cascade Delete Dependents
    delete from public.orders where buyer_id = ghost_id;
    delete from public.pools where leader_id = ghost_id;
    delete from public.listings where farmer_id = ghost_id;
    delete from public.pool_members where user_id = ghost_id;
    delete from public.pool_chat where user_id = ghost_id;
    delete from public.profiles where id = ghost_id;
  end if;

  -- 3. Determine role (default to 'buyer' if not provided or invalid)
  user_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.app_role, 
    'buyer'::public.app_role
  );

  -- 4. Create New Profile
  insert into public.profiles (id, email, display_name, avatar_url, role, email_verified)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    user_role,
    false
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    role = case when public.profiles.role = 'buyer'::public.app_role and excluded.role is distinct from 'buyer'::public.app_role then excluded.role else public.profiles.role end;
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- Notifications Table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications."
  on notifications for select
  using ( (select auth.uid()) = user_id );

create policy "Users can mark their own notifications as read."
  on notifications for update
  using ( (select auth.uid()) = user_id );

create policy "System can insert notifications."
  on notifications for insert
  with check ( true );

-- Contact Submissions Table
create table public.contact_submissions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'resolved', 'closed')),
  admin_notes text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.contact_submissions enable row level security;

create policy "Users can view their own contact submissions."
  on contact_submissions for select
  using (
    (select auth.uid()) = user_id
    or (select auth.uid()) in (
      select id from public.profiles where role = 'admin'
    )
  );

create policy "Anyone can create contact submissions."
  on contact_submissions for insert
  with check ( true );

create policy "Admins can update contact submissions."
  on contact_submissions for update
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "Admins can delete contact submissions."
  on contact_submissions for delete
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create index idx_contact_submissions_user_id on public.contact_submissions(user_id);
create index idx_contact_submissions_email on public.contact_submissions(email);
create index idx_contact_submissions_status on public.contact_submissions(status);
create index idx_contact_submissions_created_at on public.contact_submissions(created_at desc);

-- RPC: Increment pool quantity atomically
create or replace function public.increment_pool_quantity(pool_id_param uuid, quantity_param int)
returns void as $$
begin
  update public.pools
  set current_quantity = current_quantity + quantity_param,
      updated_at = timezone('utc'::text, now())
  where id = pool_id_param;
end;
$$ language plpgsql security definer set search_path = '';

-- RPC: Reserve pool membership with capacity check
create or replace function public.reserve_pool_membership(
  pool_id_param uuid,
  user_id_param uuid,
  quantity_param int,
  amount_naira numeric,
  reference_param text
)
returns boolean as $$
declare
  v_min_quantity int;
  v_listing_quantity int;
  v_max_quantity int;
  v_committed int;
begin
  if quantity_param is null or quantity_param <= 0 then
    raise exception 'Invalid quantity' using errcode = '22023';
  end if;

  -- Lock the pool row and read listing capacity
  select p.min_quantity, coalesce(l.quantity, 0)
    into v_min_quantity, v_listing_quantity
  from public.pools p
  join public.listings l on l.id = p.listing_id
  where p.id = pool_id_param
  for update;

  if v_min_quantity is null then
    raise exception 'Pool not found' using errcode = '02000';
  end if;

  v_max_quantity := coalesce(v_listing_quantity, v_min_quantity);

  -- Sum all currently pledged units that count against capacity
  select coalesce(sum(quantity_pledged), 0)
    into v_committed
  from public.pool_members
  where pool_id = pool_id_param
    and payment_status in ('authorized', 'captured');

  -- Check if new quantity would exceed capacity
  if v_committed + quantity_param > v_max_quantity then
    raise exception 'Pool capacity exceeded' using errcode = '23503';
  end if;

  -- Insert the reservation with pending status
  insert into public.pool_members (
    pool_id,
    user_id,
    quantity_pledged,
    amount_pledged,
    payment_status,
    payment_reference
  ) values (
    pool_id_param,
    user_id_param,
    quantity_param,
    amount_naira,
    'pending',
    reference_param
  )
  on conflict (pool_id, user_id) do update set
    quantity_pledged = quantity_param,
    amount_pledged = amount_naira,
    payment_status = 'pending',
    payment_reference = reference_param;

  return true;
end;
$$ language plpgsql security definer set search_path = '';

-- RPC: Get farmer available balance
create or replace function public.get_farmer_available_balance(p_user_id uuid)
returns numeric as $$
declare
  v_balance numeric;
begin
  select coalesce(sum(amount), 0)
    into v_balance
  from public.orders
  where buyer_id = p_user_id
    and payment_status = 'paid'
    and status = 'confirmed';

  return v_balance;
end;
$$ language plpgsql security definer set search_path = '';

-- Storage: Create listing-images bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Storage: RLS Policies for listing-images bucket
create policy "Public Access" on storage.objects for select using ( bucket_id = 'listing-images' );
create policy "Authenticated users can upload" on storage.objects for insert with check ( bucket_id = 'listing-images' and auth.role() = 'authenticated' );
create policy "Users can update own images" on storage.objects for update using ( bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1] );
create policy "Users can delete own images" on storage.objects for delete using ( bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1] );
create policy "Service role full access" on storage.objects for all using ( bucket_id = 'listing-images' and auth.role() = 'service_role' );
