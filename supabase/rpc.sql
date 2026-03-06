-- Increment pool quantity safely
create or replace function increment_pool_quantity(pool_id_param uuid, quantity_param int)
returns void as $$
begin
  update public.pools
  set current_quantity = current_quantity + quantity_param,
      updated_at = timezone('utc'::text, now())
  where id = pool_id_param;
end;
$$ language plpgsql security definer set search_path = '';

-- Atomically reserve pool membership with capacity check
-- Ensures we don't oversubscribe a pool while creating a pending reservation
create or replace function reserve_pool_membership(
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
    and payment_status in ('pending','authorized','captured');

  if v_committed + quantity_param > v_max_quantity then
    raise exception 'Insufficient capacity' using errcode = '45000';
  end if;

  -- Upsert reservation as pending with reference
  insert into public.pool_members (
    pool_id, user_id, quantity_pledged, amount_pledged, payment_status, payment_reference, joined_at
  ) values (
    pool_id_param, user_id_param, quantity_param, amount_naira, 'pending', reference_param, timezone('utc'::text, now())
  )
  on conflict (pool_id, user_id)
  do update set
    quantity_pledged = excluded.quantity_pledged,
    amount_pledged = excluded.amount_pledged,
    payment_status = 'pending',
    payment_reference = excluded.payment_reference,
    joined_at = excluded.joined_at;

  return true;
end;
$$ language plpgsql security definer set search_path = '';

-- Simple wrapper to keep backwards compatibility with pact.service join calls
create or replace function join_pool(
  p_pool_id uuid,
  p_user_id uuid,
  p_quantity int
)
returns boolean as $$
begin
  perform public.reserve_pool_membership(
    p_pool_id,
    p_user_id,
    p_quantity,
    null,
    null
  );
  return true;
end;
$$ language plpgsql security definer set search_path = '';

-- Mark pool as locked and capture authorized pledges
create or replace function process_pool_lock(pool_id_param uuid)
returns void as $$
begin
  update public.pools
    set status = 'locked', updated_at = timezone('utc'::text, now())
    where id = pool_id_param and status = 'active';

  update public.pool_members
    set payment_status = 'captured', joined_at = timezone('utc'::text, now())
    where pool_id = pool_id_param and payment_status = 'authorized';
end;
$$ language plpgsql security definer set search_path = '';

-- Create orders for all captured pool members
create or replace function create_orders_for_pool(pool_id_param uuid)
returns integer as $$
declare
  v_listing_id uuid;
  v_created int;
begin
  select listing_id into v_listing_id from public.pools where id = pool_id_param;

  insert into public.orders (
    buyer_id,
    pool_id,
    listing_id,
    quantity,
    amount,
    payment_status,
    status,
    payment_reference
  )
  select
    pm.user_id,
    pm.pool_id,
    v_listing_id,
    pm.quantity_pledged,
    pm.amount_pledged,
    'paid',
    'confirmed',
    pm.payment_reference
  from public.pool_members pm
  where pm.pool_id = pool_id_param
    and pm.payment_status = 'captured'
    and not exists (
      select 1 from public.orders o
      where o.pool_id = pm.pool_id and o.buyer_id = pm.user_id
    );

  get diagnostics v_created = row_count;
  return coalesce(v_created, 0);
end;
$$ language plpgsql security definer set search_path = '';

-- Deduct captured pool quantities from listing inventory
create or replace function deduct_pool_inventory(pool_id_param uuid)
returns void as $$
declare
  v_listing_id uuid;
  v_captured int;
begin
  select listing_id into v_listing_id from public.pools where id = pool_id_param;

  select coalesce(sum(quantity_pledged), 0)
    into v_captured
  from public.pool_members
  where pool_id = pool_id_param and payment_status = 'captured';

  if v_listing_id is not null and v_captured > 0 then
    update public.listings
      set quantity = greatest(0, quantity - v_captured),
          updated_at = timezone('utc'::text, now())
      where id = v_listing_id;
  end if;
end;
$$ language plpgsql security definer set search_path = '';
