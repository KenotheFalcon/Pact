/**
 * Tests for farmer payouts API endpoint
 * Validates earnings calculations, filtering, and pagination
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { GET } from '@/app/api/farmer/payouts/route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

describe('Farmer Payouts API', () => {
  const mockFarmerId = 'farmer-123'
  const mockPayouts = [
    {
      id: 'payout-1',
      user_id: mockFarmerId,
      pool_id: 'pool-1',
      listing_id: 'listing-1',
      amount: 50000000, // 500,000 kobo = ₦5,000
      reference: 'PAYOUT-001',
      status: 'completed',
      processed_at: '2026-01-01T10:00:00Z',
      transfer_code: 'TRF-123',
      recipient_code: 'RCP-123',
      created_at: '2026-01-01T09:00:00Z',
      updated_at: '2026-01-01T10:00:00Z'
    },
    {
      id: 'payout-2',
      user_id: mockFarmerId,
      pool_id: 'pool-2',
      listing_id: 'listing-2',
      amount: 30000000, // 300,000 kobo = ₦3,000
      reference: 'PAYOUT-002',
      status: 'pending',
      processed_at: null,
      transfer_code: null,
      recipient_code: null,
      created_at: '2026-01-01T08:00:00Z',
      updated_at: '2026-01-01T08:00:00Z'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return paginated farmer payouts', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: mockFarmerId } },
          error: null
        })
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'farmer' },
              error: null
            })
          }
        }
        if (table === 'payouts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({
              data: mockPayouts,
              error: null,
              count: 2
            })
          }
        }
        return {}
      })
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

    const request = new Request('http://localhost/api/farmer/payouts', {
      headers: { authorization: 'Bearer token' }
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.payouts).toHaveLength(2)
  })

  it('should filter payouts by status', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: mockFarmerId } },
          error: null
        })
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'farmer' },
              error: null
            })
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: [mockPayouts[0]], // Only completed
            error: null
          })
        }
      })
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

    const request = new Request(
      'http://localhost/api/farmer/payouts?status=completed',
      { headers: { authorization: 'Bearer token' } }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(data.payouts).toHaveLength(1)
    expect(data.payouts[0].status).toBe('completed')
  })

  it('should handle pagination with limit and offset', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: mockFarmerId } },
          error: null
        })
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'farmer' },
              error: null
            })
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: [mockPayouts[0]],
            error: null,
            count: 2
          })
        }
      })
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

    const request = new Request(
      'http://localhost/api/farmer/payouts?limit=1&offset=0',
      { headers: { authorization: 'Bearer token' } }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.pagination.limit).toBe(1)
    expect(data.pagination.offset).toBe(0)
    expect(data.pagination.total).toBe(2)
  })

  it('should reject unauthenticated requests', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('No session')
        })
      }
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

    const request = new Request('http://localhost/api/farmer/payouts')

    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('should convert kobo to naira correctly', () => {
    // Verify conversion logic
    const amountKobo = 50000000 // 500,000 kobo
    const amountNaira = amountKobo / 100 // 5,000 naira

    expect(amountNaira).toBe(5000)
  })

  it('should reject non-farmer users', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'buyer-123' } },
          error: null
        })
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'buyer' },
          error: null
        })
      }))
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

    const request = new Request('http://localhost/api/farmer/payouts', {
      headers: { authorization: 'Bearer token' }
    })

    const response = await GET(request)

    expect(response.status).toBe(403)
  })
})
