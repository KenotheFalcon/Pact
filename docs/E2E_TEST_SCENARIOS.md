# End-to-End Test Scenarios

Comprehensive E2E test flows for validating the complete Pact Marketplace workflows.

## Prerequisites

- Supabase project configured with all migrations applied
- Paystack sandbox credentials configured
- Admin and farmer accounts created
- Buyer account created
- At least one pool and listing created

---

## Scenario 1: Complete Pool Lifecycle

**Goal:** Validate full pool lifecycle from creation to payout

### Steps

1. **Create Pool (Farmer)**
   - Navigate to `/farmer` → "Create Pool"
   - Fill form:
     - Listing: Select existing listing
     - Min Quantity: 50
     - Max Quantity: 200
     - Expiry: 7 days from now
   - Click "Create Pool"
   - **Expected:** Pool created, status = "active", page redirects to pool details

2. **Join Pool (Buyer 1)**
   - Navigate to `/marketplace`
   - Find the created pool
   - Click "Join Pool"
   - Enter quantity: 30
   - Click "Pay with Paystack"
   - Complete payment (use sandbox card: 4111 1111 1111 1111)
   - **Expected:** Redirect to success page, pool_members entry created with payment_status="authorized"

3. **Join Pool (Buyer 2)**
   - Repeat as different buyer with quantity: 25
   - **Expected:** Pool current_quantity = 55, pool_members count = 2

4. **Wait for Auto-Lock**
   - Wait 5 minutes for cron job to run
   - Check Supabase: pools.status should change to "locked"
   - **Expected:** status = "locked", process_pool_lock RPC executed successfully

5. **Verify Orders Created**
   - Query database: `SELECT * FROM orders WHERE pool_id = '<pool_id>'`
   - **Expected:** 2 orders created (one per member), status = "confirmed", amount matches pledged

6. **Verify Inventory Deducted**
   - Query listing: `SELECT quantity FROM listings WHERE id = '<listing_id>'`
   - **Expected:** quantity decreased by 55 (sum of all pledges)

7. **Verify Payout Generated**
   - Query payouts: `SELECT * FROM payouts WHERE pool_id = '<pool_id>'`
   - **Expected:** 
     - 1 payout record created
     - farmer_id matches pool creator
     - amount = total_captured - 5% platform fee
     - status = "pending"
     - metadata includes breakdown

8. **Verify Farmer Earnings API**
   - Call GET `/api/farmer/payouts` as farmer
   - **Expected:**
     - Response includes the payout
     - summary.total_pending ≥ amount
     - amount_naira correctly converted

---

## Scenario 2: Payment Idempotency

**Goal:** Verify double-payment prevention and atomic state

### Steps

1. **Join Pool with Payment**
   - As buyer, join pool with quantity 10
   - Complete Paystack payment
   - **Expected:** pool_members created, payment_status="authorized"

2. **Simulate Payment Retry**
   - Call `/api/payments/verify?reference=<reference>&poolId=<poolId>`
   - Repeat the exact same call immediately
   - **Expected:** Both requests return 200, no duplicate pool quantity increment

3. **Verify Member Status**
   - Query pool_members for this buyer
   - **Expected:** Single entry with payment_status="authorized", quantity unchanged

4. **Check Pool Quantity**
   - Query pool current_quantity
   - **Expected:** Quantity incremented exactly once, not twice

---

## Scenario 3: Admin Contact Triage Workflow

**Goal:** Validate contact submission management

### Steps

1. **Submit Contact Form (Buyer)**
   - Navigate to `/contact`
   - Fill form:
     - Email: test@example.com
     - Subject: "Payment failed"
     - Message: "My payment was rejected"
   - Click "Submit"
   - **Expected:** Redirect to success page, database entry created with status="new"

2. **Admin Views Submissions**
   - Login as admin
   - Navigate to `/admin/contact`
   - **Expected:** Submission appears in "New" section with count = 1

3. **Admin Filters by Status**
   - Click "Status Filter" dropdown → "New"
   - **Expected:** Only new submissions display

4. **Admin Searches Submissions**
   - Type "payment" in search box
   - **Expected:** Submission filtered by keyword in subject/message

5. **Admin Updates Submission**
   - Click submission to expand
   - Click "Edit Notes" button
   - Enter notes: "User provided alternate payment method"
   - Click "Mark In Progress"
   - **Expected:** Notes saved, status changes to "in_progress"

6. **Admin Resolves Submission**
   - Click "Resolve" button
   - **Expected:** 
     - status changes to "resolved"
     - resolved_by set to admin ID
     - resolved_at timestamp recorded

7. **Verify API**
   - Call GET `/api/admin/contact-submissions?status=resolved`
   - **Expected:** Submission appears with resolved_by and resolved_at populated

---

## Scenario 4: Admin Payout Monitoring

**Goal:** Validate payout dashboard functionality

### Steps

1. **Admin Views All Payouts**
   - Login as admin
   - Navigate to `/admin` (future payouts dashboard)
   - **Expected:** List of all payouts across all farmers visible

2. **Admin Filters by Status**
   - Filter by status="pending"
   - **Expected:** Only pending payouts display

3. **Admin Filters by Farmer**
   - Select farmer from dropdown
   - **Expected:** Only that farmer's payouts display

4. **Verify Summary Stats**
   - Observe top of dashboard showing:
     - Total Pending Amount
     - Total Completed Amount
     - Total Failed Amount
   - **Expected:** Sums match database queries

5. **Verify Pagination**
   - Navigate through pages
   - **Expected:** Correct sorting (newest first) and pagination logic

---

## Scenario 5: Webhook Processing

**Goal:** Validate Paystack webhook handling

### Prerequisites
- Pool with pending payout (status="pending")

### Steps

1. **Simulate Transfer Success Webhook**
   - From Paystack dashboard, replay webhook with:
     - Event: "transfer.success"
     - Data includes transfer_code, recipient_code
   - **Expected:** 
     - POST to `/api/payments/webhook`
     - Returns 200
     - Database: payout.status → "completed", processed_at set

2. **Verify Webhook Logging**
   - Check Supabase logs: Webhooks section
   - **Expected:** Webhook entry shows successful signature verification

3. **Verify Idempotency**
   - Replay same webhook again
   - **Expected:** 
     - Request returns 200
     - Database unchanged (idempotent)
     - No duplicate status changes

4. **Simulate Transfer Failed Webhook**
   - Replay with event "transfer.failed"
   - **Expected:**
     - payout.status → "failed"
     - failure_reason populated

---

## Scenario 6: Offline Support

**Goal:** Validate PWA and offline functionality

### Prerequisites
- Desktop/laptop device (not mobile, for easier testing)
- DevTools access

### Steps

1. **Register Service Worker**
   - Open DevTools → Application → Service Workers
   - Reload page
   - **Expected:** Service worker registers and shows "activated"

2. **Verify Manifest**
   - DevTools → Application → Manifest
   - **Expected:** 
     - name: "Pact Marketplace"
     - display: "standalone"
     - theme_color: "#16a34a"
     - start_url: "/"

3. **Cache Static Assets**
   - DevTools → Application → Cache Storage
   - Browse site pages (/marketplace, /dashboard)
   - **Expected:** 
     - STATIC_CACHE contains JS/CSS
     - IMAGE_CACHE contains images
     - Entries properly versioned

4. **Go Offline**
   - DevTools → Network → Offline checkbox (or Throttling → Offline)
   - Refresh page
   - **Expected:** Page still loads from service worker cache

5. **Access Cached Page**
   - Visit page previously cached
   - **Expected:** Page loads from cache, no network errors

6. **Attempt Uncached Page**
   - Try to navigate to new uncached page
   - **Expected:** Shows offline.html fallback with message and home button

7. **Return Online**
   - Uncheck Offline mode
   - Page auto-detects reconnection
   - **Expected:** "Back online" indicator shows, auto-refresh happens

---

## Scenario 7: Authentication & Role-Based Access

**Goal:** Validate auth enforcement and role routing

### Steps

1. **Unauthenticated Access**
   - Clear cookies, navigate to `/farmer`
   - **Expected:** Redirect to `/login`

2. **Buyer Accessing Farmer Route**
   - Login as buyer
   - Try to access `/farmer`
   - **Expected:** Redirect to `/marketplace` (correct dashboard)

3. **Farmer Accessing Admin Route**
   - Login as farmer
   - Try to access `/admin`
   - **Expected:** Redirect to `/farmer` (correct dashboard)

4. **Admin Access**
   - Login as admin
   - Access `/admin` and `/admin/contact`
   - **Expected:** Full access to admin routes

5. **Session Expiration**
   - Login, wait for token to expire (or manipulate in DevTools)
   - Try to perform action requiring auth
   - **Expected:** Session refresh occurs transparently, or redirect to login

---

## Scenario 8: Payment Verification Race Condition

**Goal:** Ensure concurrent payment verifications don't cause double-counts

### Steps

1. **Setup:** Have buyer ready to join pool

2. **Trigger Payment**
   - Buyer joins pool with quantity 20
   - Paystack returns reference: ABC123
   - Webhook for charge.success is sent

3. **Simulate Concurrent Verification**
   - Manually call verification endpoint twice simultaneously:
     ```bash
     curl /api/payments/verify?reference=ABC123&poolId=<id> &
     curl /api/payments/verify?reference=ABC123&poolId=<id> &
     wait
     ```
   - **Expected:** Both return 200, but pool quantity only incremented by 20 (not 40)

4. **Verify Member Status**
   - Query pool_members: single entry, quantity=20, payment_status="authorized"
   - **Expected:** Idempotent behavior confirmed

---

## Scenario 9: Auto-Generated Payouts with Fee Calculation

**Goal:** Validate payout RPC fee calculation

### Prerequisites
- Locked pool with multiple orders totaling 100,000 kobo (captured amount)

### Steps

1. **Verify RPC Execution**
   - Check edge function logs after pool auto-lock
   - **Expected:** `auto_generate_payouts` RPC called with pool_id

2. **Verify Payout Amount Calculation**
   - Query payout record
   - Captured total: 100,000 kobo (sum of all members' pledges)
   - Platform fee (5%): 5,000 kobo
   - Expected payout amount: 95,000 kobo
   - **Expected:** payout.amount = 95000 (in kobo)

3. **Verify Metadata Breakdown**
   - Check payout.metadata JSON field
   - **Expected:**
     ```json
     {
       "captured_amount_kobo": 100000,
       "platform_fee_kobo": 5000,
       "payout_amount_kobo": 95000,
       "member_count": 2
     }
     ```

4. **Verify Idempotency**
   - Manually call RPC again for same pool
   - **Expected:** Returns same payout ID (no duplicate created)

---

## Scenario 10: Error Handling & Recovery

**Goal:** Validate graceful error handling

### Steps

1. **Network Error During Payment**
   - Start payment flow
   - Disable network mid-flow
   - **Expected:** User sees error message, can retry

2. **Database Error**
   - Trigger operation causing DB error (e.g., invalid reference format)
   - **Expected:** API returns 400 with clear error message, not 500

3. **Webhook Signature Mismatch**
   - Send webhook with wrong HMAC signature
   - **Expected:** Returns 401 Unauthorized, webhook rejected

4. **Rate Limiting**
   - Make rapid requests to same endpoint (e.g., 100 in 1 second)
   - **Expected:** 429 Too Many Requests after threshold

---

## Testing Checklist

- [ ] Run full test suite: `npm test`
- [ ] Check coverage: `npm test -- --coverage`
- [ ] Run Scenario 1 (pool lifecycle) end-to-end
- [ ] Run Scenario 2 (payment idempotency)
- [ ] Run Scenario 3 (contact triage)
- [ ] Run Scenario 4 (payout monitoring)
- [ ] Run Scenario 5 (webhooks) with real Paystack sandbox
- [ ] Run Scenario 6 (offline) on desktop browser
- [ ] Run Scenario 7 (auth/role)
- [ ] Run Scenario 8 (race condition)
- [ ] Run Scenario 9 (auto-payouts)
- [ ] Run Scenario 10 (error handling)
- [ ] Monitor browser console for errors
- [ ] Check Supabase logs for any warnings
- [ ] Verify no TypeScript errors: `npm run build`
- [ ] Run Lighthouse audit: check Performance, Accessibility, Best Practices

---

## Test Data Setup

### SQL to create test data:

```sql
-- Create test farmer
INSERT INTO profiles (id, role, full_name, email, phone, state, lga, address)
VALUES (gen_random_uuid(), 'farmer', 'Test Farmer', 'farmer@test.com', '08012345678', 'Lagos', 'Ikoyi', 'Test Address')
RETURNING id;

-- Create test listing (use farmer_id from above)
INSERT INTO listings (farmer_id, product_name, product_type, quantity, price_per_unit_kobo, unit, description)
VALUES ('<farmer_id>', 'Tomatoes', 'vegetable', 1000, 1000000, 'kg', 'Test listing')
RETURNING id;

-- Create test pool (use farmer_id and listing_id from above)
INSERT INTO pools (farmer_id, listing_id, min_quantity, max_quantity, expiry_date, status)
VALUES ('<farmer_id>', '<listing_id>', 50, 200, NOW() + INTERVAL '7 days', 'active')
RETURNING id;

-- Create admin user
INSERT INTO profiles (id, role, full_name, email)
VALUES (gen_random_uuid(), 'admin', 'Test Admin', 'admin@test.com')
RETURNING id;
```

---

## Known Limitations & Workarounds

| Issue | Workaround |
|-------|-----------|
| Service worker not updating | Hard refresh (Ctrl+Shift+R), clear cache manually |
| Webhook not processing | Check Paystack sandbox config, verify webhook URL is public |
| Pool auto-lock not triggering | Manually call RPC via Supabase console for testing |
| Offline mode not working | Use Chrome DevTools > Network > Offline, not airplane mode |

