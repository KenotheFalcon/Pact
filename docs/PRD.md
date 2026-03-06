# Product Requirements Document (PM)

## Product Overview
- Core value: pooled buying connects retailers to farmers for fresher produce and better margins.
- Target users: retailers/buyers, smallholder farmers, admins/ops.
- Success metrics: pool lock-through rate, payment auth success, listing→order conversion, refund/error rate, latency p95 for join/verify, image upload success, active pools published per farmer.
- Assumptions: Paystack for payments; Supabase Auth/DB/Storage; App Router with server actions.

## User Stories
- Buyer: discover active pools, inspect availability, pledge units, pay securely, track orders.
- Farmer: register, publish listings, open pools, see commitments, receive payouts.
- Admin: audit listings/pools/orders, resolve contact submissions, monitor abuse/rate limits.

## Functional Requirements
- Auth: Supabase session, role-aware (buyer/farmer/admin).
- Marketplace: browse listings/pools, view quantity committed/remaining, CTA to join.
- Pooling: atomic reservation, payment init (Paystack), verification, pool quantity updates, status transitions (active→locked→funded/completed or cancelled/expired).
- Orders: auto-create orders on pool lock/funding; order status management.
- Notifications: store user notifications; mark read; send on pool lock/cancel.
- Storage: listing images bucket with RLS.
- Contact: submissions intake and admin triage.
- Rate limiting: 60 rpm/ip (web/api scope).

## Non-Functional Requirements
- Reliability: RLS on all tables; RPCs for atomic updates; middleware session refresh.
- Performance: image optimization via Next/Image; caching via revalidatePath; aim p95 < 400ms for primary actions.
- Security/Compliance: role-based policies, secure payment verification, secrets isolation, audit logging.
- Accessibility: reduced motion respect, semantic structure, sufficient contrast.

## PWA Requirements
- Installable, offline-friendly experience; cache shell/assets and critical data; background sync for pending pledges; push notifications for pool status.
- **[RED] Missing**: web manifest, service worker registration/build, caching strategy, offline fallbacks, A2HS prompts, push setup.

## Feature Roadmap
- Now: pool discovery, join & Paystack auth, listing uploads, rate limit, notifications table.
- Next: pool auto-lock + order creation + inventory deduction; farmer payout ledger; role-based route guarding; richer marketplace filters (geo/category); contact submissions UI.
- Later: PWA offline + push; analytics; loyalty/referrals; dispute/refund automation; ops dashboards.

## Acceptance Criteria (examples)
- Buyers can join a pool and see authorization URL returned.
- Payment verification updates pool_members to authorized and increments pool quantity.
- Admin can update listings/pools/orders per policy and rate limit headers return on requests.
- Storage enforces owner-only mutations; public read for images.
- Pools that reach min quantity transition to locked and trigger order creation. **[RED] Requires edge/cron + RPCs to exist.**
