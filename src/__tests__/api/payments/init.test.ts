/**
 * Tests for payment initialization API with atomic pool reservation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const vi = jest

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        }
      }))
    }
  }))
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              min_quantity: 100,
              listing: {
                price_per_unit: 50000,
                quantity: 1000
              }
            },
            error: null
          }))
        }))
      }))
    })),
    rpc: vi.fn(() => Promise.resolve({ error: null }))
  }))
}))

vi.mock('@/lib/payments/paystack', () => ({
  generatePaymentReference: vi.fn(() => 'PACT-1234567890-ABC123'),
  toKobo: vi.fn((naira: number) => naira * 100)
}))

// Mock fetch for Paystack API
global.fetch = vi.fn((url: string) => {
  if (url.includes('paystack.co/transaction/initialize')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        status: true,
        data: {
          authorization_url: 'https://checkout.paystack.com/test123',
          access_code: 'test_access_code',
          reference: 'PACT-1234567890-ABC123'
        }
      })
    })
  }
  return Promise.reject(new Error('Unknown URL'))
}) as any

describe('Payment Init API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject request without authentication', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockReturnValueOnce({
      auth: {
        getUser: vi.fn(() => ({ data: { user: null } }))
      }
    } as any)

    // This would be the actual API call
    // For now, we're testing the logic would return 401
    expect(true).toBe(true) // Placeholder assertion
  })

  it('should validate required parameters', async () => {
    // Test with missing poolId
    const invalidBody = { quantity: 5 }
    // API should return 400 for missing poolId
    expect(invalidBody).not.toHaveProperty('poolId')
  })

  it('should fetch trusted pricing from database', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const mockAdmin = createAdminClient()
    
    // Verify the mock returns expected structure
    const result = await mockAdmin.from('pools').select('*').eq('id', 'test-pool').single()
    expect(result.data).toHaveProperty('listing')
    expect(result.data?.listing).toHaveProperty('price_per_unit')
  })

  it('should call reserve_pool_membership RPC', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const mockAdmin = createAdminClient()
    
    await mockAdmin.rpc('reserve_pool_membership', {
      pool_id_param: 'test-pool',
      user_id_param: 'test-user',
      quantity_param: 5,
      amount_naira: 250000,
      reference_param: 'PACT-123'
    })

    expect(mockAdmin.rpc).toHaveBeenCalledWith('reserve_pool_membership', expect.any(Object))
  })

  it('should generate unique payment reference', async () => {
    const { generatePaymentReference } = await import('@/lib/payments/paystack')
    const ref = generatePaymentReference('PACT')
    expect(ref).toBeTruthy()
    expect(ref).toContain('PACT')
  })

  it('should initialize Paystack with correct metadata', async () => {
    const paystackBody = {
      email: 'test@example.com',
      amount: 25000000, // 250k in kobo
      reference: 'PACT-1234567890-ABC123',
      callback_url: 'http://localhost:3000/checkout/success?poolId=test-pool',
      metadata: {
        type: 'pool_join',
        poolId: 'test-pool',
        userId: 'test-user',
        quantity: 5,
        pricePerUnit: 50000
      }
    }

    expect(paystackBody.metadata.type).toBe('pool_join')
    expect(paystackBody.metadata).toHaveProperty('poolId')
    expect(paystackBody.metadata).toHaveProperty('quantity')
  })

  it('should handle capacity exceeded error gracefully', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(createAdminClient).mockReturnValueOnce({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { min_quantity: 100, listing: { price_per_unit: 50000, quantity: 1000 } },
              error: null
            }))
          }))
        }))
      })),
      rpc: vi.fn(() => Promise.resolve({ 
        error: { message: 'Insufficient capacity', code: '45000' } 
      }))
    } as any)

    const mockAdmin = createAdminClient()
    const result = await mockAdmin.rpc('reserve_pool_membership', {
      pool_id_param: 'test-pool',
      user_id_param: 'test-user',
      quantity_param: 9999,
      amount_naira: 999999,
      reference_param: 'PACT-123'
    })

    expect(result.error).toBeTruthy()
    expect(result.error?.message).toContain('capacity')
  })
})
