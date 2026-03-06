# Developer Quick Reference

Fast lookup guide for common development tasks in Pact Marketplace.

---

## Running the Project

### Development
```bash
npm run dev
# Opens http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run specific suite
npm test -- payouts.test.ts
npm test -- contact-submissions.test.ts

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Linting
```bash
npx eslint src/
npx eslint src/ --fix  # Auto-fix issues
```

---

## Database Operations

### Connect to Database
```bash
# Via Supabase Dashboard → SQL Editor
# Or via CLI
supabase db pull  # Download schema
supabase db push  # Upload changes
```

### Common Queries

**View pool details:**
```sql
SELECT id, farmer_id, listing_id, min_quantity, current_quantity, 
       status, expiry_date, created_at 
FROM pools 
WHERE id = '<pool_id>';
```

**View member pledges:**
```sql
SELECT pm.user_id, pm.quantity_pledged, pm.payment_status, pm.created_at
FROM pool_members pm
WHERE pm.pool_id = '<pool_id>'
ORDER BY pm.created_at DESC;
```

**View payouts for farmer:**
```sql
SELECT id, amount, reference, status, created_at, processed_at
FROM payouts
WHERE farmer_id = '<farmer_id>'
ORDER BY created_at DESC;
```

**View contact submissions:**
```sql
SELECT id, email, subject, status, created_at, resolved_at
FROM contact_submissions
WHERE status = 'new'
ORDER BY created_at ASC;
```

**Check RLS policies:**
```sql
SELECT tablename, policyname, permissive, qual
FROM pg_policies
WHERE tablename IN ('payouts', 'contact_submissions', 'pool_members');
```

---

## API Endpoints

### Pools
```
GET    /api/pools              List active pools
POST   /api/pools              Create pool (farmer)
GET    /api/pools/:id          Get pool details
PATCH  /api/pools/:id          Update pool (farmer)
POST   /api/pools/:id/join     Join pool (buyer)
```

### Payments
```
POST   /api/payments/init      Initialize payment
GET    /api/payments/verify    Verify payment
POST   /api/payments/webhook   Paystack webhook handler
```

### Farmer APIs
```
GET    /api/farmer/listings    Farmer's listings
POST   /api/farmer/listings    Create listing
GET    /api/farmer/payouts     Farmer earnings
```

### Admin APIs
```
GET    /api/admin/payouts      All payouts (filtered)
GET    /api/admin/contact-submissions  All submissions
PATCH  /api/admin/contact-submissions  Update submission
GET    /api/admin/users        All users (future)
```

### Health
```
GET    /api/health             Health check
```

### Cron
```
POST   /api/cron/pool-auto-lock  Triggered by pg_cron
```

---

## Key File Locations

### Core Services
- **Pool operations:** `src/services/pact.service.ts`
- **Payment processing:** `src/services/payment.service.ts`
- **Recommendations:** `src/services/recommendation.service.ts`

### API Routes
- **Pool APIs:** `src/app/api/pools/`
- **Payment APIs:** `src/app/api/payments/`
- **Farmer APIs:** `src/app/api/farmer/`
- **Admin APIs:** `src/app/api/admin/`
- **Webhooks:** `src/app/api/payments/webhook/`
- **Cron:** `src/app/api/cron/`

### Pages
- **Marketplace:** `src/app/marketplace/page.tsx`
- **Farmer Dashboard:** `src/app/farmer/page.tsx`
- **Admin Dashboard:** `src/app/admin/page.tsx`
- **Admin Contact:** `src/app/admin/contact/page.tsx`
- **Checkout:** `src/app/checkout/page.tsx`

### Components
- **Shared:** `src/components/`
- **Admin:** `src/components/admin/`
- **Farmer:** `src/components/farmer/`
- **Marketplace:** `src/components/marketplace/`
- **Auth:** `src/components/auth/`

### Database
- **Migrations:** `supabase/migrations/`
- **Edge Functions:** `supabase/functions/`
- **RLS Policies:** `supabase/rls.sql`
- **Seed Data:** `supabase/seed.sql`

---

## Environment Variables

### Required
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
PAYSTACK_SECRET_KEY=xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=xxx
CRON_SECRET=xxx
```

### Optional
```bash
SENTRY_AUTH_TOKEN=xxx
NEXT_PUBLIC_SENTRY_DSN=xxx
NODE_ENV=development
```

---

## Common Tasks

### Add a New Field to Database

1. **Create migration:**
```sql
-- In supabase/migrations/YYYYMMDD_add_field_name.sql
ALTER TABLE table_name ADD COLUMN column_name data_type;
CREATE INDEX idx_table_column ON table_name(column_name);
```

2. **Apply migration:**
```bash
supabase db push
# Or manually via SQL Editor
```

3. **Update TypeScript types:**
```typescript
// In src/types/database.ts
interface TableName {
  // existing fields
  column_name: FieldType;
}
```

### Add a New API Endpoint

1. **Create route file:**
```typescript
// src/app/api/route/path/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  
  // Check auth
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  
  // Your logic
  const { data, error } = await supabase
    .from('table')
    .select()
  
  return Response.json({ data })
}

export async function POST(request: Request) {
  const body = await request.json()
  // Your logic
  return Response.json({ success: true })
}
```

2. **Call from client:**
```typescript
const response = await fetch('/api/route/path', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
})
const data = await response.json()
```

### Add a New Component

1. **Create component file:**
```typescript
// src/components/MyComponent.tsx
'use client'  // Add if using hooks

import React from 'react'

interface MyComponentProps {
  title: string
  onAction?: () => void
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onAction
}) => {
  return (
    <div className="...">
      <h2>{title}</h2>
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  )
}
```

2. **Use in page:**
```typescript
import { MyComponent } from '@/components/MyComponent'

export default function Page() {
  return (
    <MyComponent 
      title="My Title" 
      onAction={() => console.log('clicked')}
    />
  )
}
```

### Write a Test

1. **Create test file:**
```typescript
// src/__tests__/feature.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

describe('Feature Name', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should do something', () => {
    const result = someFunction()
    expect(result).toBe(expectedValue)
  })

  it('should handle error', () => {
    expect(() => badFunction()).toThrow('Error message')
  })
})
```

2. **Run test:**
```bash
npm test -- feature.test.ts
```

### Debug an Issue

1. **Check logs:**
```bash
# Supabase logs
# Dashboard → Logs → Filter by service

# Application logs (development)
npm run dev
# Check terminal output

# Vercel logs (production)
vercel logs --tail
```

2. **Check database state:**
```sql
-- Check last 10 records
SELECT * FROM table_name ORDER BY created_at DESC LIMIT 10;

-- Check for errors
SELECT * FROM logs WHERE level = 'error' ORDER BY created_at DESC LIMIT 20;

-- Check webhook status
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

3. **Check browser DevTools:**
- Console: JavaScript errors
- Network: HTTP requests/responses
- Storage: Cookies, localStorage, IndexedDB
- Application: Service Worker, Manifest
- Performance: Load time, metrics

---

## Testing Patterns

### Mock Supabase Client
```typescript
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null
      })
    },
    from: jest.fn((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockData,
        error: null
      })
    }))
  }))
}))
```

### Test API Endpoint
```typescript
it('should return data', async () => {
  const request = new Request('http://localhost/api/endpoint', {
    headers: { authorization: 'Bearer token' }
  })
  
  const response = await GET(request)
  const data = await response.json()
  
  expect(response.status).toBe(200)
  expect(data.key).toBe('value')
})
```

### Test Error Handling
```typescript
it('should reject invalid input', () => {
  const result = validateInput('')
  expect(result.valid).toBe(false)
  expect(result.error).toContain('required')
})
```

---

## Performance Tips

### Database
- ✅ Use indexes on frequently filtered columns
- ✅ Use RLS policies instead of application-level auth checks
- ✅ Batch operations with transactions
- ❌ Avoid N+1 queries (eager load with joins)

### Frontend
- ✅ Use Next.js Image component for images
- ✅ Code split large pages with dynamic imports
- ✅ Use React.memo for expensive components
- ❌ Don't fetch on every render (use useEffect)

### API
- ✅ Cache responses where appropriate
- ✅ Use pagination for large datasets
- ✅ Compress responses (gzip)
- ❌ Don't return entire objects if only some fields needed

### Build
- ✅ Run `npm run build` before committing
- ✅ Check bundle size: `du -sh .next`
- ✅ Use external libraries sparingly
- ❌ Don't hardcode values that should be env vars

---

## Deployment Quick Steps

### Staging
```bash
# 1. Test locally
npm test
npm run build

# 2. Deploy
git push origin develop  # Or trigger CI/CD

# 3. Run E2E tests
# Follow docs/E2E_TEST_SCENARIOS.md
```

### Production
```bash
# 1. Merge to main
git checkout main
git merge develop --ff-only

# 2. Tag release
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0

# 3. Deploy
# Automatic via CI/CD or:
# git push origin main
```

---

## Useful Commands

```bash
# Format code
npx prettier --write src/

# Check types
npx tsc --noEmit

# List environment variables
env | grep NEXT_PUBLIC

# Database shell
supabase db shell

# View service worker
curl https://localhost:3000/sw.js

# Check manifest
curl https://localhost:3000/manifest.webmanifest | jq

# Test Paystack webhook (local)
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: <sig>" \
  -d '{...}'
```

---

## Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **TypeScript:** https://www.typescriptlang.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Paystack API:** https://paystack.com/docs/api
- **Jest:** https://jestjs.io/docs/getting-started
- **Framer Motion:** https://www.framer.com/motion

---

## Getting Help

1. Check [docs/](./docs/) for detailed guides
2. Review existing code examples
3. Check test files for patterns
4. Check git history: `git log -p -- <file>`
5. Ask in team Slack/Discord
6. Check external docs (links above)

---

**Last Updated:** January 1, 2026

