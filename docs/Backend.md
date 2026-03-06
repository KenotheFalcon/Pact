# Backend & DevOps (Principal Engineer)

## Stack & Runtime
- Next.js App Router (server actions), TypeScript, Tailwind; Supabase (Postgres, Auth, Storage, RPC); Paystack for payments; Edge-style middleware for rate limit + session refresh.
- Env: NEXT_PUBLIC_SUPABASE_URL, CRON_SECRET, NEXT_PUBLIC_BASE_URL, Paystack keys (not shown here).

## Data Model (Supabase)
- profiles (role buyer/farmer/admin, verified flags, geo/meta).
- listings (farmer-owned, pricing/unit, images jsonb, status).
- pools (listing_id FK, leader_id FK, min/current qty, status, geo, expiry).
- pool_members (PK pool_id+user_id; quantity/amount pledged; payment_status pending/authorized/captured/voided; payment_reference).
- orders (buyer_id, pool_id, listing_id; payment_status pending/paid/failed/refunded; status pending/confirmed/delivered/cancelled).
- pool_chat, notifications, contact_submissions.
- Storage bucket listing-images with RLS allowing public read and owner updates.

## RLS & Policies
- Profiles/listings/pools/orders/pool_members/notifications/contact_submissions all enable RLS; owners can insert/update; admins can update/delete where applicable; public read for listings/pools/pool_chat/storage objects.

## RPCs & Database Logic
- `reserve_pool_membership` (capacity check) and `increment_pool_quantity` for pool quantities; `get_farmer_available_balance` for payouts view; storage bucket setup.
- **[RED] Missing**: RPC `join_pool` (called by PactService) and `process_pool_lock`, `create_orders_for_pool`, `deduct_pool_inventory` referenced in actions; need creation.
- **[RED] Missing**: triggers/cron for pool expiry/lock and payout disbursement.

## Server Actions & Services
- joinPool: auth check → PactService.joinPool → Paystack init → insert pending pool_member.
- verifyPoolPayment: Paystack verify → set payment_status authorized → increment pool quantity via RPC.
- capturePoolPayments/checkAndLockPools: orchestrate lock/capture/order creation; depend on absent RPCs; cancelPool voids pending/auth pledges and notifies members.
- PactService: createPool, joinPool, chat CRUD, search pools; PaymentService: Paystack init/verify (split planned 95/5 but no subaccount payouts).

## Security & Compliance
- Rate limiting 60 rpm/ip (in-memory map per instance). **[RED] Needs durable store for multi-instance deployment.**
- Payment verification uses Paystack; **[RED] need webhook verification + signature check** and refund handling.
- Secrets should be injected via env; avoid client exposure.

## Performance & Reliability
- Image optimization via Next/Image; cache revalidation after writes.
- **[RED] Missing**: CDN config, background workers/cron for pool sweeps, idempotent webhook handlers, structured logging/metrics.

## DevOps
- Migrations located in supabase/migrations; **[RED] document and automate apply in CI/CD**.
- No CI/CD pipeline documented; **[RED] add lint/test/build steps, Supabase migration apply, env validation**.
- PWA infra: **[RED] add manifest, service worker build, push subscription server endpoints**.

## Payouts & Ledger
- Current RPC `get_farmer_available_balance` sums paid+confirmed orders; no ledger or disbursement flow.
- **[RED] Add payout ledger, scheduled disbursements, reconciliation, and chargeback/refund flow.**
