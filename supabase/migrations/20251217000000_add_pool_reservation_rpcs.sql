-- Add atomic pool reservation RPC for safe capacity management
-- Migration: 20251217000000_add_pool_reservation_rpcs.sql

-- Increment pool quantity safely (existing function)
create or replace function increment_pool_quantity(pool_id_param uuid, quantity_param int)
returns void as $$
begin
  update public.pools
  set current_quantity = current_quantity + quantity_param,
      updated_at = timezone('utc'::text, now())
  where id = pool_id_param;
end;
$$ language plpgsql;

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
$$ language plpgsql;
