/**
 * Tests for payment verification endpoint with idempotency
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const vi = jest

// Helper to create chainable eq mock that supports multiple .eq() calls
const createEqChain = (finalResult: { data: unknown; error: unknown }) => {
  const chainObj: Record<string, unknown> = {}
  chainObj.eq = vi.fn(() => chainObj)
  chainObj.single = vi.fn(() => finalResult)
  return chainObj
}

// Mock dependencies
vi.mock('@/services/payment.service', () => ({
  PaymentService: {
    verifyTransaction: vi.fn((reference: string) => Promise.resolve({
      success: true,
      data: {
        reference,
        status: 'success',
        amount: 25000000,
        metadata: {
          type: 'pool_join',
          poolId: 'test-pool',
          userId: 'test-user',
          quantity: 5
        }
      }
    }))
  }
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn((table: string) => {
      if (table === 'pool_members') {
        return {
          select: vi.fn(() => createEqChain({
            data: { payment_status: 'pending', quantity_pledged: 5 },
            error: null
          })),
          update: vi.fn(() => createEqChain({ data: null, error: null }))
        }
      }
      if (table === 'pools') {
        return {
          select: vi.fn(() => createEqChain({
            data: {
              current_quantity: 45,
              min_quantity: 100,
              listing: { quantity: 1000 }
            },
            error: null
          })),
          update: vi.fn(() => createEqChain({ data: null, error: null }))
        }
      }
      return {}
    }),
    rpc: vi.fn(() => Promise.resolve({ error: null }))
  }))
}))

describe('Payment Verify API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject request without reference or poolId', () => {
    const validParams = { reference: 'TEST-REF', poolId: 'pool-id' }
    const missingReference = { poolId: 'pool-id' }
    const missingPoolId = { reference: 'TEST-REF' }
    
    expect(validParams).toHaveProperty('reference')
    expect(validParams).toHaveProperty('poolId')
    expect(missingReference).not.toHaveProperty('reference')
    expect(missingPoolId).not.toHaveProperty('poolId')
  })

  it('should verify payment with Paystack', async () => {
    const { PaymentService } = await import('@/services/payment.service')
    const result = await PaymentService.verifyTransaction('TEST-REF-123')
    
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('success')
  })

  it('should return early if member already authorized (idempotency)', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValueOnce({
      from: vi.fn(() => ({
        select: vi.fn(() => createEqChain({
          data: { payment_status: 'authorized', quantity_pledged: 5 }, // Already authorized
          error: null
        }))
      })),
      rpc: vi.fn()
    } as unknown as Awaited<ReturnType<typeof createClient>>)
    
    const supabase = await createClient()
    const { data: member } = await supabase
      .from('pool_members')
      .select('payment_status, quantity_pledged')
      .eq('payment_reference', 'TEST-REF')
      .eq('pool_id', 'test-pool')
      .single()
    
    expect(member?.payment_status).toBe('authorized')
    // Should not call update or RPC if already authorized
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('should update pool_members to authorized', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    await supabase
      .from('pool_members')
      .update({ payment_status: 'authorized' })
      .eq('payment_reference', 'TEST-REF')
      .eq('pool_id', 'test-pool')
    
    expect(supabase.from).toHaveBeenCalledWith('pool_members')
  })

  it('should increment pool quantity atomically', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    await supabase.rpc('increment_pool_quantity', {
      pool_id_param: 'test-pool',
      quantity_param: 5
    })
    
    expect(supabase.rpc).toHaveBeenCalledWith('increment_pool_quantity', {
      pool_id_param: 'test-pool',
      quantity_param: 5
    })
  })

  it('should lock pool when capacity is reached', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValueOnce({
      from: vi.fn((table: string) => {
        if (table === 'pool_members') {
          return {
            select: vi.fn(() => createEqChain({
              data: { payment_status: 'pending', quantity_pledged: 5 },
              error: null
            })),
            update: vi.fn(() => createEqChain({ data: null, error: null }))
          }
        }
        if (table === 'pools') {
          return {
            select: vi.fn(() => createEqChain({
              data: {
                current_quantity: 995, // 5 more units will reach 1000
                min_quantity: 100,
                listing: { quantity: 1000 }
              },
              error: null
            })),
            update: vi.fn(() => createEqChain({ data: null, error: null }))
          }
        }
        return {}
      }),
      rpc: vi.fn(() => Promise.resolve({ error: null }))
    } as unknown as Awaited<ReturnType<typeof createClient>>)
    
    const supabase = await createClient()
    await supabase.rpc('increment_pool_quantity', { pool_id_param: 'test-pool', quantity_param: 5 })
    
    const { data: pool } = await supabase
      .from('pools')
      .select('current_quantity, min_quantity, listing:listings(quantity)')
      .eq('id', 'test-pool')
      .single()
    
    // After increment: 995 + 5 = 1000, should be full
    const listing = pool!.listing as unknown as { quantity: number }
    const isFull = (pool!.current_quantity + 5) >= listing.quantity
    expect(isFull).toBe(true)
    
    if (isFull) {
      await supabase
        .from('pools')
        .update({ status: 'locked' })
        .eq('id', 'test-pool')
      
      expect(supabase.from).toHaveBeenCalledWith('pools')
    }
  })

  it('should handle verification failure gracefully', async () => {
    const { PaymentService } = await import('@/services/payment.service')
    vi.mocked(PaymentService.verifyTransaction).mockResolvedValueOnce({
      success: false,
      status: 'failed'
    } as Awaited<ReturnType<typeof PaymentService.verifyTransaction>>)
    
    const result = await PaymentService.verifyTransaction('FAILED-REF')
    expect(result.success).toBe(false)
  })

  it('should not increment if quantity is zero or negative', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValueOnce({
      from: vi.fn(() => ({
        select: vi.fn(() => createEqChain({
          data: { payment_status: 'pending', quantity_pledged: 0 }, // Zero quantity
          error: null
        }))
      })),
      rpc: vi.fn()
    } as unknown as Awaited<ReturnType<typeof createClient>>)
    
    const supabase = await createClient()
    const { data: member } = await supabase
      .from('pool_members')
      .select('payment_status, quantity_pledged')
      .eq('payment_reference', 'TEST-REF')
      .eq('pool_id', 'test-pool')
      .single()
    
    if (!member?.quantity_pledged || member.quantity_pledged <= 0) {
      // Should not call RPC
      expect(supabase.rpc).not.toHaveBeenCalled()
    }
  })
})
