# Payment Flow Tests

This directory contains comprehensive tests for the pool payment flow with atomic reservations and webhook reconciliation.

## Test Files

### `init.test.ts`

Tests for the payment initialization endpoint (`/api/payments/init`):

- Authentication validation
- Server-side pricing fetch from database
- Atomic capacity reservation via `reserve_pool_membership` RPC
- Payment reference generation
- Paystack initialization with correct metadata
- Capacity exceeded error handling

### `verify.test.ts`

Tests for the payment verification endpoint (`/api/payments/verify`):

- Paystack transaction verification
- Idempotent status updates (prevents double-processing)
- Atomic pool quantity increments
- Pool status locking when capacity reached
- Error handling for failed verifications

### `webhook.test.ts`

Tests for the Paystack webhook handler (`/api/payments/webhook`):

- Signature verification for security
- Pool join reconciliation on `charge.success` events
- Idempotent member status updates
- Pool quantity increments via RPC
- Handling duplicate webhook deliveries
- Backward compatibility with non-pool payments

## Running Tests

```bash
# Run all payment tests
npm test -- __tests__/api/payments

# Run specific test file
npm test -- __tests__/api/payments/init.test.ts

# Run with coverage
npm test -- --coverage __tests__/api/payments

# Watch mode for development
npm test -- --watch __tests__/api/payments
```

## Key Features Tested

### Atomic Reservations

- Database-level capacity checks with row locking
- Prevents oversubscription races
- Upserts with payment reference tracking

### Idempotency

- Duplicate webhook handling
- Multiple verification attempts
- Status transition guards

### Security

- HMAC signature verification for webhooks
- Server-side pricing (client cannot manipulate)
- Payment reference validation

### Error Handling

- Capacity exceeded errors
- Payment verification failures
- Database update failures
- Network timeout scenarios

## Migration Required

Before running the app, apply the migration:

```bash
# Using Supabase CLI
supabase db push

# Or run the migration file directly in Supabase SQL Editor:
# supabase/migrations/20251217000000_add_pool_reservation_rpcs.sql
```

## Environment Variables

Ensure these are set for tests to mock correctly:

- `PAYSTACK_SECRET_KEY` - Your Paystack secret key
- `NEXT_PUBLIC_APP_URL` - Callback URL base
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access key

## Coverage Goals

- Line coverage: >80%
- Branch coverage: >75%
- Function coverage: >90%

Run `npm test -- --coverage` to see current metrics.
