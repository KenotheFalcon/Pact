# Deployment Guide

Complete step-by-step deployment instructions for Pact Marketplace to staging and production environments.

---

## Pre-Deployment Checklist

- [ ] All tests passing: `npm test`
- [ ] Build successful: `npm run build`
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] All environment variables configured
- [ ] Database migrations reviewed and tested locally
- [ ] Edge functions code reviewed
- [ ] Paystack webhook URLs updated
- [ ] Sentry/monitoring configured
- [ ] Backup of production database scheduled

---

## Environment Variables

Create `.env.local` with these values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=<public_key>
PAYSTACK_SECRET_KEY=<secret_key>

# Cron/Edge Functions
CRON_SECRET=<random_secret_for_webhook_auth>

# Optional: Monitoring
SENTRY_AUTH_TOKEN=<if_using_sentry>
SENTRY_ORG=<org>
SENTRY_PROJECT=<project>
```

### Obtaining Keys

1. **Supabase:**
   - Dashboard → Project Settings → API
   - Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key under "Service role" tab

2. **Paystack:**
   - Dashboard → Settings → API Keys & Webhooks
   - Copy live/test keys based on environment
   - Configure webhook URL: `https://<your-domain>/api/payments/webhook`

3. **Cron Secret:**
   - Generate: `openssl rand -hex 32`
   - Store securely (use Supabase secrets or similar)

---

## Staging Deployment

### 1. Database Setup

```bash
# Connect to staging Supabase project
# Dashboard → SQL Editor → run these migrations in order:

-- 1. Check existing tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Apply migrations (in order):
-- a. process_pool_lock RPC
-- b. create_orders_for_pool RPC
-- c. deduct_pool_inventory RPC
-- d. join_pool RPC wrapper
-- e. enhance_payouts_ledger (schema + indexes + RLS)
-- f. auto_generate_payouts RPC

-- 3. Verify migrations applied
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```

See [supabase/migrations/](../supabase/migrations/) for complete SQL.

### 2. Deploy Edge Function

```bash
# Install Supabase CLI if not already
npm install -g supabase

# Login to Supabase
supabase login

# Link to staging project
supabase link --project-ref <staging_project_id>

# Deploy pool-auto-lock function
supabase functions deploy pool-auto-lock

# Verify deployment
supabase functions list
```

### 3. Configure Cron Job

```bash
# In Supabase Dashboard → SQL Editor, run:
SELECT cron.schedule(
  'pool-auto-lock-5min',
  '*/5 * * * *',
  $$SELECT net.http_post(
    'https://<staging-domain>.vercel.app/api/cron/pool-auto-lock',
    json_build_object('secret', '<CRON_SECRET>'),
    json_build_object('Content-Type', 'application/json')
  )$$
);

-- Verify job created
SELECT * FROM cron.job WHERE jobname = 'pool-auto-lock-5min';
```

### 4. Deploy Next.js Application

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to staging
vercel --prod --env NEXT_PUBLIC_SUPABASE_URL=<url> \
              --env NEXT_PUBLIC_SUPABASE_ANON_KEY=<key> \
              --env SUPABASE_SERVICE_ROLE_KEY=<key> \
              --env PAYSTACK_SECRET_KEY=<key> \
              --env CRON_SECRET=<secret>

# Verify deployment
# Check logs: vercel logs --tail
```

#### Option B: Self-Hosted (Docker)

```bash
# Build Docker image
docker build -t pact-marketplace:staging .

# Push to registry
docker tag pact-marketplace:staging <registry>/pact-marketplace:staging
docker push <registry>/pact-marketplace:staging

# Deploy to cluster
kubectl set image deployment/pact-staging pact=<registry>/pact-marketplace:staging
kubectl rollout status deployment/pact-staging
```

### 5. Configure Paystack Webhooks (Staging)

1. Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://<staging-domain>/api/payments/webhook`
3. Copy webhook signing key to `PAYSTACK_SECRET_KEY`
4. Test with: "Send test event"
5. Expected: Logs show successful signature verification

### 6. Run Staging Tests

```bash
# From staging environment
npm test

# Run specific test suite
npm test -- payouts.test.ts

# Generate coverage
npm test -- --coverage
```

### 7. Smoke Tests

```bash
# Test basic endpoints
curl -X GET https://<staging-domain>/api/health

# Test authentication
curl -X GET https://<staging-domain>/api/farmer/payouts \
  -H "Authorization: Bearer <test_token>"

# Test contact API
curl -X GET https://<staging-domain>/api/admin/contact-submissions \
  -H "Authorization: Bearer <admin_token>"
```

### 8. Manual Testing Checklist

- [ ] Sign up as new user works
- [ ] Login works
- [ ] Pool creation works (farmer)
- [ ] Pool joining works (buyer)
- [ ] Payment flow completes
- [ ] Pool auto-locks after min qty reached
- [ ] Farmer can view payouts
- [ ] Admin can view and manage contact submissions
- [ ] Offline mode works (PWA)
- [ ] Service worker registered
- [ ] Manifest installable

---

## Production Deployment

### Prerequisites

- [ ] Staging validation complete
- [ ] All tests passing in staging
- [ ] Performance benchmarks acceptable
- [ ] Security audit completed
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] On-call team assigned

### 1. Production Database Migration

```bash
# Connect to production Supabase
# Review all migrations one more time
# Apply in SQL Editor (or use migration script)

# After migrations, verify:
SELECT pg_sleep(5); -- Wait for replication
SELECT count(*) FROM payouts; -- Should have data from staging if migrating
```

### 2. Deploy Edge Function to Production

```bash
# Ensure linked to production project
supabase link --project-ref <production_project_id>

# Deploy
supabase functions deploy pool-auto-lock

# Verify
supabase functions list
```

### 3. Configure Production Cron

```sql
-- Production cron job (same as staging, different domain)
SELECT cron.schedule(
  'pool-auto-lock-5min-prod',
  '*/5 * * * *',
  $$SELECT net.http_post(
    'https://<production-domain>.vercel.app/api/cron/pool-auto-lock',
    json_build_object('secret', '<CRON_SECRET_PROD>'),
    json_build_object('Content-Type', 'application/json')
  )$$
);
```

### 4. Deploy Application to Production

#### Vercel

```bash
# Deploy main branch to production
git push origin main

# Or manual deploy
vercel --prod

# Monitor deployment
vercel logs --tail --filter production
```

#### Self-Hosted

```bash
# Build and push with version tag
docker build -t pact-marketplace:v1.0.0 .
docker tag pact-marketplace:v1.0.0 <registry>/pact-marketplace:v1.0.0
docker push <registry>/pact-marketplace:v1.0.0

# Update deployment
kubectl set image deployment/pact pact=<registry>/pact-marketplace:v1.0.0
kubectl rollout status deployment/pact

# Verify rollout
kubectl get pods -l app=pact
```

### 5. Configure Production Paystack Webhooks

1. Paystack Dashboard → Settings → Webhooks
2. **Switch to LIVE keys** (not test)
3. Add webhook: `https://<production-domain>/api/payments/webhook`
4. Update `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` and `PAYSTACK_SECRET_KEY` to live keys
5. Test webhook delivery

### 6. DNS & SSL

```bash
# Update DNS records (if needed)
# CNAME: pact.yourcompany.com → <deployment-domain>

# Verify SSL
curl -vI https://<production-domain>
# Should show valid certificate
```

### 7. Monitoring & Alerts

```bash
# Configure Sentry for error tracking
# Dashboard → Projects → Settings → Client Keys (DSN)

# Configure Uptime Monitoring
# Pingdom / UptimeRobot: `https://<production-domain>/api/health`

# Database Monitoring (Supabase)
# Dashboard → Monitoring → CPU, Memory, Connections

# Log Aggregation
# Set up logs streaming to external service if needed
```

### 8. Smoke Tests (Production)

```bash
# Health check
curl -X GET https://<production-domain>/api/health

# Payment processing (use small amount if possible)
# Test full flow: Create pool → Join → Pay → Verify

# Webhook test
# Trigger test transfer via Paystack dashboard

# Admin APIs
# Verify access controls are strict
```

### 9. Load Testing

```bash
# Run load tests against production (carefully!)
# Using tools like: k6, Apache JMeter, or Gatling

# Target endpoints:
# - GET /api/farmer/payouts (100 RPS)
# - GET /api/admin/contact-submissions (50 RPS)
# - POST /api/payments/webhook (30 RPS)

# Success criteria:
# - p95 latency < 500ms
# - Error rate < 0.1%
# - No 5xx errors
```

---

## Post-Deployment Validation

### Hour 1

- [ ] All endpoints responding (200 status)
- [ ] Error rates normal (<0.1%)
- [ ] Database connections healthy
- [ ] No spike in error logs
- [ ] Webhook signatures verifying correctly

### Hour 4

- [ ] Complete pool lifecycle tested (create → join → pay → lock)
- [ ] Admin dashboard accessible
- [ ] Contact submissions working
- [ ] Payouts calculated correctly
- [ ] Service worker working for offline support

### Hour 24

- [ ] Zero critical errors
- [ ] Performance metrics stable
- [ ] All features functioning normally
- [ ] Users creating pools and joining
- [ ] Real transactions processing successfully
- [ ] Payouts scheduling/processing without issues

---

## Rollback Plan

### If Critical Issues

```bash
# Immediate rollback (if needed within 30 minutes)

# Vercel
vercel --prod --yes
# Or revert to previous deployment in Vercel dashboard

# Kubernetes
kubectl rollout undo deployment/pact
kubectl rollout status deployment/pact

# Verify rollback
curl -X GET https://<production-domain>/api/health
```

### Database Rollback

```sql
-- If migrations caused issues, restore from backup
-- Supabase: Dashboard → Backups → Restore from point-in-time

-- Or manually revert migrations (if reversible):
DROP FUNCTION auto_generate_payouts(uuid, numeric);
DROP FUNCTION deduct_pool_inventory(uuid);
-- etc.
```

---

## Performance Optimization

### Before Going Live

1. **Lighthouse Audit**
   ```bash
   npm run build
   npm start
   # DevTools → Lighthouse → Analyze page load
   # Target: Performance > 90, Accessibility > 95
   ```

2. **Database Query Optimization**
   ```sql
   -- Check slow queries
   SELECT mean_exec_time, calls, query 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC LIMIT 10;
   
   -- Ensure indexes exist
   SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
   ```

3. **Image Optimization**
   - Ensure all images < 200KB
   - Use WebP format where possible
   - Implement responsive images

4. **Code Splitting**
   - Next.js auto-optimizes, verify bundle size:
   ```bash
   npm run build
   # Check .next/static/chunks/ for large bundles
   ```

---

## Maintenance

### Regular Tasks

- **Daily:** Monitor error rates, check logs
- **Weekly:** Review performance metrics, check backup status
- **Monthly:** Security audit, dependency updates
- **Quarterly:** Capacity planning, optimization review

### Backup Strategy

```bash
# Supabase automated backups (enabled by default)
# Access in Dashboard → Backups

# Point-in-time recovery available for 7-30 days
# (depending on plan)

# Manual backup script (optional):
pg_dump -h <host> -U postgres <db_name> > backup.sql
```

---

## Support & Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhooks not processing | Wrong secret key | Verify PAYSTACK_SECRET_KEY matches Paystack dashboard |
| Pool auto-lock not triggering | Cron job not running | Check cron.job table, verify function exists |
| Payment verification fails | Missing reference | Ensure payment reference passed to both RPC and PaymentService |
| Offline mode not working | Service worker not registered | Clear browser cache, check manifest syntax |

### Debug Commands

```bash
# Check service worker
curl https://<domain>/sw.js

# Verify manifest
curl https://<domain>/manifest.webmanifest | jq

# Test webhook (from Paystack dashboard)
# Settings → Webhooks → Send test event

# Check database migrations
SELECT migration FROM supabase_migrations_table;

# View edge function logs
supabase functions logs pool-auto-lock --limit=100
```

### Contact & Escalation

- **Application Issues:** Check logs in Supabase/Vercel dashboard
- **Payment Issues:** Paystack Support Dashboard
- **Database Issues:** Supabase Support Portal
- **On-Call:** [On-call contact info]

