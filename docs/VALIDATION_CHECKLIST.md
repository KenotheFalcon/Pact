# Validation Checklist

Complete pre-deployment and go-live validation checklist for Pact Marketplace.

---

## Phase 1: Code Quality Validation

### TypeScript & Linting

- [ ] No TypeScript errors: `npm run build` passes
- [ ] No ESLint warnings: `npx eslint src/` clean
- [ ] No console.errors or warnings in browser console
- [ ] All imports resolved correctly
- [ ] No unused imports or variables

**Command:**
```bash
npm run build && npx eslint src/ --max-warnings 0
```

### Unit Tests

- [ ] All unit tests passing: `npm test` ✅
- [ ] Test coverage > 80% for critical paths
- [ ] No failing tests for:
  - [ ] Payment verification
  - [ ] Pool operations
  - [ ] Admin APIs
  - [ ] Contact submissions

**Command:**
```bash
npm test -- --coverage --testPathPattern="(payment|pool|admin|contact)"
```

### Code Coverage

- [ ] src/services/pact.service.ts: > 90% coverage
- [ ] src/services/payment.service.ts: > 90% coverage
- [ ] src/app/api/payments/: > 85% coverage
- [ ] src/app/api/admin/: > 85% coverage

**Command:**
```bash
npm test -- --coverage --collectCoverageFrom="src/**/*.{ts,tsx}"
```

---

## Phase 2: Database Validation

### Schema Integrity

- [ ] All tables exist:
  - [ ] `profiles` table present
  - [ ] `listings` table present
  - [ ] `pools` table present
  - [ ] `pool_members` table present
  - [ ] `orders` table present
  - [ ] `payouts` table present
  - [ ] `contact_submissions` table present

**SQL:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

### Columns & Data Types

- [ ] `payouts` table has required columns:
  - [ ] `id` (uuid, primary key)
  - [ ] `user_id` (uuid, foreign key to profiles)
  - [ ] `pool_id` (uuid, foreign key to pools)
  - [ ] `listing_id` (uuid, foreign key to listings)
  - [ ] `farmer_id` (uuid)
  - [ ] `amount` (bigint, kobo)
  - [ ] `reference` (varchar, unique)
  - [ ] `status` (enum: pending, processing, completed, failed, reversed)
  - [ ] `processed_at` (timestamp)
  - [ ] `transfer_code` (varchar, nullable)
  - [ ] `recipient_code` (varchar, nullable)
  - [ ] `failure_reason` (text, nullable)
  - [ ] `metadata` (jsonb, nullable)
  - [ ] `created_at` (timestamp)
  - [ ] `updated_at` (timestamp)

**SQL:**
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'payouts' ORDER BY ordinal_position;
```

### Indexes

- [ ] Index on `payouts.farmer_id`
- [ ] Index on `payouts.pool_id`
- [ ] Index on `payouts.status`
- [ ] Index on `payouts.created_at`
- [ ] Index on `pool_members.payment_reference`

**SQL:**
```sql
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'payouts';
```

### RLS Policies

- [ ] `payouts` table has RLS enabled
- [ ] Policy: Farmers can view own payouts
- [ ] Policy: Admins can view all payouts
- [ ] Policy: System can insert payouts
- [ ] Policy: No delete policies (immutable)

**SQL:**
```sql
SELECT tablename, policyname, permissive 
FROM pg_policies WHERE tablename = 'payouts';
```

### Functions/RPCs

- [ ] `process_pool_lock(pool_id uuid)` exists
- [ ] `create_orders_for_pool(pool_id uuid)` exists
- [ ] `deduct_pool_inventory(pool_id uuid)` exists
- [ ] `join_pool(p_pool_id uuid, p_user_id uuid, p_quantity int)` exists
- [ ] `auto_generate_payouts(pool_id uuid, platform_fee_percent numeric)` exists

**SQL:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' 
ORDER BY routine_name;
```

### Test Data

- [ ] Test farmer profile exists
- [ ] Test listing created (with inventory > 0)
- [ ] Test pool created (with expiry in future)
- [ ] No production data in staging database

**SQL:**
```sql
SELECT COUNT(*) FROM profiles WHERE role = 'farmer';
SELECT COUNT(*) FROM listings;
SELECT COUNT(*) FROM pools WHERE status = 'active';
```

---

## Phase 3: API Validation

### Endpoint Availability

- [ ] GET `/api/health` → 200 OK
- [ ] GET `/api/farmer/payouts` → 200 (with auth)
- [ ] GET `/api/admin/payouts` → 200 (with auth)
- [ ] GET `/api/admin/contact-submissions` → 200 (with auth)
- [ ] PATCH `/api/admin/contact-submissions` → 200 (with auth)
- [ ] POST `/api/payments/verify` → 200 (with valid reference)
- [ ] POST `/api/payments/webhook` → 200 (with valid signature)

**Test:**
```bash
curl -X GET https://<domain>/api/health

# Auth endpoints require Bearer token
curl -X GET https://<domain>/api/farmer/payouts \
  -H "Authorization: Bearer <token>"
```

### Request/Response Format

- [ ] `/api/farmer/payouts` returns:
  - [ ] `payouts[]` array
  - [ ] `summary` object with total_earned, total_pending, total_completed, total_failed
  - [ ] `pagination` object with total, limit, offset

**Expected Response:**
```json
{
  "payouts": [
    {
      "id": "uuid",
      "amount": 50000000,
      "amount_naira": 500000,
      "status": "pending",
      "pool_id": "uuid",
      "listing_id": "uuid",
      "farmer_id": "uuid",
      "reference": "PAYOUT-001",
      "created_at": "2026-01-01T09:00:00Z"
    }
  ],
  "summary": {
    "total_earned": 80000000,
    "total_pending": 30000000,
    "total_completed": 50000000,
    "total_failed": 0
  },
  "pagination": {
    "total": 2,
    "limit": 10,
    "offset": 0
  }
}
```

- [ ] `/api/admin/contact-submissions` returns:
  - [ ] `submissions[]` with email, subject, message, status, admin_notes, resolved_by, resolved_at
  - [ ] `statusCounts` breakdown (new, in_progress, resolved, spam)
  - [ ] `pagination` object

### Authentication & Authorization

- [ ] Unauthenticated requests to protected endpoints return 401
- [ ] Non-admin requests to admin endpoints return 403
- [ ] Non-farmer requests to farmer endpoints return 403
- [ ] Bearer token validated correctly
- [ ] Session refresh works transparently

**Test:**
```bash
# Should fail with 401
curl -X GET https://<domain>/api/farmer/payouts

# Should fail with 403 for non-admin
curl -X GET https://<domain>/api/admin/contact-submissions \
  -H "Authorization: Bearer <non_admin_token>"
```

### Error Handling

- [ ] Invalid reference returns 400 with message
- [ ] Missing required params returns 400
- [ ] Database errors return 500 (not exposed)
- [ ] Webhook signature mismatch returns 401
- [ ] Rate limit exceeded returns 429

---

## Phase 4: Feature Validation

### Pool Lifecycle

- [ ] Create pool (farmer) ✅
- [ ] Join pool (buyer) ✅
- [ ] Payment verification idempotent ✅
- [ ] Pool auto-locks when min qty reached ✅
- [ ] Orders created after lock ✅
- [ ] Inventory decremented ✅
- [ ] Payout generated ✅

**Test Script:**
```bash
# 1. Create farmer
# 2. Create listing (qty=100)
# 3. Create pool (min_qty=50, max_qty=200)
# 4. Join as buyer 1 (qty=30, pay 250,000 kobo)
# 5. Join as buyer 2 (qty=25, pay 208,333 kobo)
# 6. Wait 5+ min for auto-lock
# 7. Verify pool.status = 'locked'
# 8. Verify orders created (qty=55 total)
# 9. Verify listing.quantity = 45 (100-55)
# 10. Verify payout created (amount = ~260,000 kobo - 5% fee)
```

### Payment Processing

- [ ] Paystack payment initialized correctly
- [ ] Reference generated and passed to both RPC and PaymentService
- [ ] Verification endpoint accepts reference + poolId
- [ ] Member status updates from pending → authorized
- [ ] Pool quantity increments only once (idempotent)
- [ ] Webhook charge.success increments quantity

**Test:**
```bash
# Join pool with payment
# GET /api/payments/verify?reference=<ref>&poolId=<poolId>
# Call twice to verify idempotency
# Verify pool quantity only incremented once
```

### Admin Contact Triage

- [ ] Submit contact form (creates contact_submissions entry)
- [ ] Admin can view submissions
- [ ] Admin can filter by status
- [ ] Admin can search by email/subject/message
- [ ] Admin can edit notes
- [ ] Admin can mark in-progress/resolved/spam
- [ ] resolved_by and resolved_at auto-set when resolving

**Test:**
```bash
# 1. Submit form: email=test@example.com, subject=Test, message=Test message
# 2. GET /api/admin/contact-submissions (verify entry)
# 3. Search for "Test" (verify found)
# 4. PATCH with status=in_progress (verify updated)
# 5. PATCH with status=resolved (verify resolved_by and resolved_at set)
```

### Payouts Management

- [ ] Farmer can view own payouts via `/api/farmer/payouts`
- [ ] Farmer sees summary: total_earned, total_pending, total_completed, total_failed
- [ ] Admin can view all payouts via `/api/admin/payouts`
- [ ] Admin can filter payouts by status
- [ ] Admin can filter payouts by farmer_id
- [ ] Payout amounts calculated correctly (captured - 5% fee)
- [ ] Webhook updates payout status from pending → completed
- [ ] Transfer failure updates status to failed with reason

**Test:**
```bash
# 1. As farmer, GET /api/farmer/payouts
# 2. Verify summary calculation (total_pending + total_completed + total_failed = total_earned)
# 3. As admin, GET /api/admin/payouts
# 4. Filter by status=pending (verify correct count)
# 5. Simulate transfer.success webhook
# 6. Verify payout.status = completed, processed_at set
```

---

## Phase 5: PWA & Offline Validation

### Service Worker

- [ ] Service worker file exists: `/public/sw.js`
- [ ] Service worker registers on page load
- [ ] DevTools → Application → Service Workers shows "activated"
- [ ] Service worker has active version cache

**Test:**
```bash
# Open DevTools → Application → Service Workers
# Should see "activated and running" status

# Check cache storage
# DevTools → Application → Cache Storage
# Should see: STATIC_CACHE, API_CACHE, IMAGE_CACHE
```

### Manifest

- [ ] Manifest file exists: `/public/manifest.webmanifest`
- [ ] DevTools → Application → Manifest shows correct data:
  - [ ] name: "Pact Marketplace"
  - [ ] short_name: "Pact"
  - [ ] start_url: "/"
  - [ ] scope: "/"
  - [ ] display: "standalone"
  - [ ] theme_color: "#16a34a"
  - [ ] icons array with 192x192 and 512x512

**Test:**
```bash
curl https://<domain>/manifest.webmanifest | jq

# DevTools → Application → Manifest → should show valid data
```

### Offline Functionality

- [ ] Go offline (DevTools → Network → Offline)
- [ ] Previously visited pages load from cache
- [ ] Uncached pages show offline.html fallback
- [ ] Images load from IMAGE_CACHE
- [ ] Static assets (JS/CSS) load from STATIC_CACHE
- [ ] Reconnection auto-detected
- [ ] Service worker refreshes cache on reconnect

**Test:**
```bash
# 1. Visit /marketplace (caches page)
# 2. DevTools → Network → Offline
# 3. Refresh page (should load from cache)
# 4. Navigate to new uncached page (should show offline.html)
# 5. Go back online
# 6. Page auto-refreshes with online content
```

### Caching Strategy

- [ ] Static assets (JS, CSS) use cache-first strategy
- [ ] Images use cache-first with long expiry
- [ ] API calls use network-first with cache fallback
- [ ] HTML pages cached with network-first

**Test:**
```bash
# Check cache headers
curl -I https://<domain>/index.js
# Should show Cache-Control directives

# Check service worker fetch logic
# DevTools → Application → Service Workers → Click worker → Inspect
```

### Installability

- [ ] Desktop: Can install as PWA (browser menu)
- [ ] Android: Can install via Chrome menu
- [ ] App icon appears on home screen
- [ ] App launches in standalone mode
- [ ] App displays theme color on launch

**Test:**
```bash
# Chrome/Edge: ... → Install app
# Firefox: Custom install option
# Safari: Share → Add to Home Screen

# Verify app launches without address bar
```

---

## Phase 6: Security Validation

### Authentication

- [ ] JWT tokens include user_id and role
- [ ] Session tokens refresh before expiry
- [ ] Logout clears session storage
- [ ] Protected routes enforce authentication
- [ ] Role-based routes enforce role

**Test:**
```bash
# Check token structure
# DevTools → Application → Cookies → see auth token
# Decode JWT (jwt.io) → verify payload includes user_id, role

# Test expired token
# Wait for token expiry (or manually expire)
# Verify automatic refresh or redirect to login
```

### Authorization

- [ ] Farmers cannot access `/admin`
- [ ] Buyers cannot access `/farmer`
- [ ] Non-admins cannot call admin APIs
- [ ] RLS policies enforce row-level security
- [ ] Farmers can only see own payouts
- [ ] Admins can see all payouts

**Test:**
```bash
# Test role routing
# Login as farmer → try /admin → should redirect to /farmer
# Login as buyer → try /farmer → should redirect to /marketplace

# Test API authorization
# As buyer, GET /api/admin/contact-submissions → 403
# As farmer, POST /api/admin/payouts → 403
```

### Webhook Security

- [ ] Paystack webhook signature verified (HMAC-SHA512)
- [ ] Invalid signatures return 401
- [ ] Webhook requests authenticated
- [ ] Webhook replay attacks prevented (idempotent operations)

**Test:**
```bash
# Test with valid signature: should return 200
curl -X POST https://<domain>/api/payments/webhook \
  -H "x-paystack-signature: <valid_sig>" \
  -d '{"event":"charge.success",...}'

# Test with invalid signature: should return 401
curl -X POST https://<domain>/api/payments/webhook \
  -H "x-paystack-signature: invalid" \
  -d '{"event":"charge.success",...}'

# Test replay: call same webhook twice, verify idempotent
```

### HTTPS

- [ ] All traffic uses HTTPS
- [ ] SSL certificate valid and not expired
- [ ] No mixed content (HTTP resources on HTTPS page)
- [ ] HSTS headers present

**Test:**
```bash
curl -vI https://<domain>
# Should show valid certificate, no warnings

# Check headers
curl -I https://<domain> | grep -i "strict-transport-security"
# Should show HSTS header
```

### API Rate Limiting

- [ ] Rate limiting implemented on all public endpoints
- [ ] Rate limit headers present in response
- [ ] Exceeding limits returns 429 Too Many Requests
- [ ] Rate limits enforced per-IP or per-user

**Test:**
```bash
# Rapid requests to same endpoint
for i in {1..101}; do 
  curl https://<domain>/api/farmer/payouts
done

# Should see 429 error after threshold
```

### Secrets Management

- [ ] No secrets in code (checked with git-secrets)
- [ ] Paystack keys in environment variables only
- [ ] Database credentials not exposed
- [ ] Cron secret not hardcoded
- [ ] No debug mode in production

**Test:**
```bash
# Check for exposed keys
grep -r "sk_live" src/ .env
# Should return 0 (no matches)

grep -r "PAYSTACK_SECRET_KEY" src/
# Should return 0 (only in env)

# Verify .env in .gitignore
cat .gitignore | grep ".env"
```

---

## Phase 7: Performance Validation

### Build Performance

- [ ] Production build completes in < 2 minutes
- [ ] Bundle size < 500KB (gzipped)
- [ ] No circular dependencies

**Command:**
```bash
npm run build
# Check .next/static/chunks/ sizes
du -sh .next
```

### Lighthouse Audit

- [ ] Performance score > 90
- [ ] Accessibility score > 95
- [ ] Best Practices score > 90
- [ ] SEO score > 90
- [ ] No red/orange items

**Test:**
```bash
# Production build
npm run build && npm start

# Open in Chrome DevTools
# Lighthouse → Analyze page load
# Target: all scores > 90
```

### Core Web Vitals

- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1

**Test:**
```bash
# Open DevTools → Performance
# Load page and measure Core Web Vitals
# Or use web-vitals library
```

### Database Query Performance

- [ ] Average query time < 100ms
- [ ] No N+1 queries
- [ ] Indexes used in query plans

**SQL:**
```sql
-- Find slow queries
SELECT mean_exec_time, calls, query 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Explain plan
EXPLAIN ANALYZE 
SELECT * FROM payouts WHERE farmer_id = '<uuid>' 
ORDER BY created_at DESC;
```

### API Response Times

- [ ] GET endpoints respond in < 500ms (p95)
- [ ] POST endpoints respond in < 1000ms (p95)
- [ ] Webhook processing in < 5s

**Test:**
```bash
# Load test
k6 run load-test.js

# Or with curl
time curl https://<domain>/api/farmer/payouts \
  -H "Authorization: Bearer <token>"
```

---

## Phase 8: Monitoring & Logging

### Error Tracking

- [ ] Sentry configured (if using)
- [ ] Errors logged with context
- [ ] Alert threshold set appropriately
- [ ] Error recovery implemented

**Test:**
```bash
# Trigger test error in browser console
fetch('/api/invalid-endpoint')
  .catch(console.error)

# Should appear in Sentry/logs within 60s
```

### Application Logs

- [ ] Logs show request/response info
- [ ] Sensitive data not logged
- [ ] Log levels appropriate (debug, info, error, warning)
- [ ] Logs rotated to prevent disk overflow

**Test:**
```bash
npm start
# Check console output for structured logs
# Production logs in: Vercel/Supabase/Cloud Provider dashboard
```

### Database Monitoring

- [ ] Connection pool health monitored
- [ ] Slow query alerts configured
- [ ] Replication lag monitored
- [ ] Backup status checked daily

**Supabase Dashboard:**
```
Database → Monitoring
- Connections
- CPU
- Memory
- Replication lag
- Active queries
```

### Uptime Monitoring

- [ ] Health endpoint monitored (https://<domain>/api/health)
- [ ] Uptime target: 99.9%
- [ ] Alerting configured for downtime
- [ ] Page status page (statuspage.io or similar)

---

## Phase 9: Deployment Validation

### Pre-Deployment

- [ ] All code merged to main/master
- [ ] All tests passing in CI/CD
- [ ] Code review completed
- [ ] Staging tests passed
- [ ] Performance benchmarks acceptable

### Deployment Process

- [ ] Deployment logs clean (no warnings)
- [ ] Rollback capability verified
- [ ] Zero-downtime deployment possible
- [ ] Database migrations reversible

### Post-Deployment (First 30 minutes)

- [ ] Application responds to requests
- [ ] All endpoints accessible
- [ ] No 5xx errors
- [ ] Database connections healthy
- [ ] Real users accessing without issues

**Monitor:**
```bash
# Check application health
curl -X GET https://<domain>/api/health

# Tail logs
vercel logs --tail

# Or Supabase: Dashboard → Logs → Filter by service
```

### Post-Deployment (24 hours)

- [ ] Zero critical errors
- [ ] Error rate < 0.1%
- [ ] P95 latency acceptable
- [ ] Payment processing working
- [ ] Payouts generating correctly
- [ ] No data corruption
- [ ] Users providing positive feedback

---

## Signoff

- [ ] All checklist items completed and verified
- [ ] No critical issues remaining
- [ ] Performance acceptable
- [ ] Security audit passed
- [ ] Production readiness confirmed

**Approved by:** ___________________ **Date:** _______________

**QA Sign-off:** ___________________ **Date:** _______________

**Operations Sign-off:** ___________________ **Date:** _______________

