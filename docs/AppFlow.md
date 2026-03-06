# App Flow (Lead Systems Analyst)

## Navigation & States
- Entry: public landing highlights stats and pools; CTAs to marketplace/about.
- Auth check: middleware refreshes session and sets rate-limit headers; intended protection for /buyer, /farmer, /admin, /checkout, /dashboard.
- Auth states: unauth → redirect to signup/login on join; auth → allowed to proceed; role (buyer/farmer/admin) should gate dashboards.
- Pool lifecycle: active → locked (meets min) → funded/completed or cancelled/expired; orders created on lock; payments captured on lock.

## Happy Paths
- Browse pools → view availability/progress → Join Pool → if unauth, go to signup; if auth, initiate Paystack and land on callback/verify → payment verified → pool quantity increments → user sees updated pool page/orders.
- Farmer: create listing (implied) → create pool (server action) → buyers join → pool locks → orders generated → payout owed.
- Admin: monitor pools/listings/orders; manage contact submissions; cancel pools if needed.

## Unhappy / Edge Paths
- Rate limit exceeded → 429 with limit/reset headers.
- Payment verification fails → pledge remains pending, no quantity increment; user prompted to retry.
- Pool cancel → pending/authorized pledges voided; notifications sent.
- Pool capacity exceeded → RPC rejects with error; UI should surface capacity error.
- Expired pools → should not accept new pledges. **[RED] Expiry enforcement not wired.**

## Conditional Routing & Guards
- If !auth and action requires auth (join pool, create pool) → redirect to signup/login.
- If role mismatch (buyer vs farmer/admin) → deny or redirect to home. **[RED] Middleware does not currently enforce role-based redirects; add server/client guards.**
- If pool status ≠ active → disable join CTA.

## Data & State Transitions
- On payment verify: pool_members.payment_status pending→authorized; pool current_quantity += quantity.
- On pool lock: pool status active→locked; pool_members authorized→captured; orders inserted; listing inventory deducted.
- On cancel: pool status active→cancelled; pending/authorized pledges voided; refund flow TBD.

## Observability & Resilience
- Log payment/refund/lock events; surface failures to admins.
- Background job/cron to sweep pools for lock/expire and trigger processing. **[RED] No cron/edge function currently configured.**
