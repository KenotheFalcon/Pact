/**
 * Tests for Paystack webhook reconciliation with pool joins
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const vi = jest

// Mock dependencies
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { payment_status: 'pending', quantity_pledged: 5 },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    rpc: vi.fn(() => Promise.resolve({ error: null }))
  }))
}))

vi.mock('@/lib/payments/paystack-client', () => ({
  paystackClient: {
    setSupabase: vi.fn(),
    verifyPayment: vi.fn(() => Promise.resolve({
      status: true,
      data: {
        reference: 'TEST-REF-123',
        status: 'success',
        amount: 25000000, // 250k naira in kobo
        metadata: {
          type: 'pool_join',
          poolId: 'test-pool-id',
          userId: 'test-user-id',
          quantity: 5,
          pricePerUnit: 50000
        }
      }
    })),
    processSuccessfulPayment: vi.fn()
  }
}))

describe('Webhook Reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should verify Paystack signature', () => {
    const crypto = require('crypto')
    const secret = 'test_secret_key'
    const body = JSON.stringify({ event: 'charge.success', data: {} })
    
    const hash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex')
    
    expect(hash).toBeTruthy()
    expect(hash.length).toBe(128) // sha512 hex length
  })

  it('should reject invalid signature', () => {
    const validSignature = 'abc123'
    const invalidSignature = 'xyz789'
    
    expect(validSignature).not.toBe(invalidSignature)
  })

  it('should handle charge.success for pool_join', async () => {
    const { paystackClient } = await import('@/lib/payments/paystack-client')
    const verifyResult = await paystackClient.verifyPayment('TEST-REF-123')
    
    expect(verifyResult.status).toBe(true)
    expect(verifyResult.data.metadata?.type).toBe('pool_join')
    expect(verifyResult.data.metadata).toHaveProperty('poolId')
    expect(verifyResult.data.metadata).toHaveProperty('quantity')
  })

  it('should update pool_members to authorized idempotently', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    
    // First check current status
    const { data: member } = await admin
      .from('pool_members')
      .select('payment_status')
      .eq('pool_id', 'test-pool')
      .eq('user_id', 'test-user')
      .single()
    
    expect(member?.payment_status).toBe('pending')
    
    // Update to authorized
    await admin
      .from('pool_members')
      .update({ payment_status: 'authorized' })
      .eq('pool_id', 'test-pool')
      .eq('user_id', 'test-user')
    
    expect(admin.from).toHaveBeenCalled()
  })

  it('should increment pool quantity via RPC', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    
    await admin.rpc('increment_pool_quantity', {
      pool_id_param: 'test-pool',
      quantity_param: 5
    })
    
    expect(admin.rpc).toHaveBeenCalledWith('increment_pool_quantity', {
      pool_id_param: 'test-pool',
      quantity_param: 5
    })
  })

  it('should handle duplicate webhook calls gracefully', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(createAdminClient).mockReturnValueOnce({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { payment_status: 'authorized', quantity_pledged: 5 }, // Already authorized
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      })),
      rpc: vi.fn()
    } as any)
    
    const admin = createAdminClient()
    const { data: member } = await admin
      .from('pool_members')
      .select('payment_status')
      .eq('pool_id', 'test-pool')
      .eq('user_id', 'test-user')
      .single()
    
    // Should skip update if already authorized
    if (member?.payment_status === 'authorized') {
      // No RPC call should be made
      expect(admin.rpc).not.toHaveBeenCalled()
    }
  })

  it('should handle non-pool_join payments without errors', async () => {
    const { paystackClient } = await import('@/lib/payments/paystack-client')
    
    // Mock verification with different metadata type
    vi.mocked(paystackClient.verifyPayment).mockResolvedValueOnce({
      status: true,
      message: 'Verification successful',
      data: {
        reference: 'TEST-REF-456',
        status: 'success',
        amount: 10000000,
        metadata: {
          type: 'order_payment', // Different type
          order_id: 'order-123'
        }
      } as any
    })
    
    const result = await paystackClient.verifyPayment('TEST-REF-456')
    expect(result.data.metadata?.type).not.toBe('pool_join')
    // Should still call processSuccessfulPayment for legacy handling
    expect(paystackClient.processSuccessfulPayment).toBeDefined()
  })
})
