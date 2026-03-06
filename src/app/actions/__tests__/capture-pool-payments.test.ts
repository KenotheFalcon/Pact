import { capturePoolPayments } from '../capture-pool-payments'
import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/utils/error-handling'
import { notifyPoolLocked } from '@/lib/notifications/helpers'

// Mock dependencies
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/utils/error-handling', () => ({
  logError: jest.fn(),
  handleSupabaseError: jest.fn((e) => e),
  formatError: jest.fn((e) => e),
}))

jest.mock('@/lib/notifications/helpers', () => ({
  notifyPoolLocked: jest.fn(),
  notifyPoolCancelled: jest.fn(),
}))

// Create a mock client builder
const mockEq = jest.fn()
const mockSingle = jest.fn()
const mockSelect = jest.fn()
const mockRpc = jest.fn()

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: mockSelect,
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        in: jest.fn()
      }))
    }))
  })),
  rpc: mockRpc,
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('capturePoolPayments', () => {
  const poolId = 'test-pool-123'

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default chain for 'from'
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })
  })

  it('should return "Pool not found" when pool query fails', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })

    const result = await capturePoolPayments(poolId)

    expect(result).toEqual({ success: false, error: 'Pool not found' })
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('pools')
  })

  it('should return "Pool not found" when pool data is null', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null })

    const result = await capturePoolPayments(poolId)

    expect(result).toEqual({ success: false, error: 'Pool not found' })
  })

  it('should return "Pool is not locked" when pool status is not locked', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { status: 'active', listing: {} },
      error: null
    })

    const result = await capturePoolPayments(poolId)

    expect(result).toEqual({ success: false, error: 'Pool is not locked' })
  })

  it('should return "No authorized payments to capture" when fetching members returns an error', async () => {
    // Mock pool fetch success
    mockSingle.mockResolvedValueOnce({
      data: { status: 'locked', listing: {} },
      error: null
    })

    // Mock members fetch error (second call in the chain, wait no it's a new from() call)
    // Actually, we need to handle the chaining carefully.
    // The first from('pools') -> select -> eq -> single
    // The second from('pool_members') -> select -> eq -> eq

    // Let's redefine the mock for this test to be specific to the table
    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'pools') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { status: 'locked', listing: {} },
                error: null
              })
            })
          })
        }
      }
      if (table === 'pool_members') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Failed' }
              })
            })
          })
        }
      }
      return {}
    })

    const result = await capturePoolPayments(poolId)

    expect(result).toEqual({ success: false, error: 'Failed to fetch pool members' })
  })

  it('should return "No authorized payments to capture" when member list is empty', async () => {
    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'pools') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { status: 'locked', listing: {} },
                error: null
              })
            })
          })
        }
      }
      if (table === 'pool_members') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        }
      }
      return {}
    })

    const result = await capturePoolPayments(poolId)

    expect(result).toEqual({ success: false, error: 'No authorized payments to capture' })
  })

  it('should successfully capture payments, call RPCs, and send notifications', async () => {
    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'pools') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { status: 'locked', listing: {} },
                error: null
              })
            })
          })
        }
      }
      if (table === 'pool_members') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ id: 'member1' }, { id: 'member2' }],
                error: null
              })
            })
          })
        }
      }
      return {}
    })

    // Mock RPC calls
    mockRpc.mockImplementation((fnName) => {
      if (fnName === 'process_pool_lock') return Promise.resolve({ error: null })
      if (fnName === 'create_orders_for_pool') return Promise.resolve({ data: 2, error: null })
      if (fnName === 'deduct_pool_inventory') return Promise.resolve({ error: null })
      return Promise.resolve({ error: null })
    })

    const result = await capturePoolPayments(poolId)

    expect(result).toEqual({ success: true, ordersCreated: 2, membersCount: 2 })

    expect(mockRpc).toHaveBeenCalledWith('process_pool_lock', { pool_id_param: poolId })
    expect(mockRpc).toHaveBeenCalledWith('create_orders_for_pool', { pool_id_param: poolId })
    expect(mockRpc).toHaveBeenCalledWith('deduct_pool_inventory', { pool_id_param: poolId })

    expect(notifyPoolLocked).toHaveBeenCalledWith(poolId)
    expect(revalidatePath).toHaveBeenCalledWith(`/marketplace/pools/${poolId}`)
    expect(revalidatePath).toHaveBeenCalledWith('/farmer/pools')
    expect(revalidatePath).toHaveBeenCalledWith('/buyer/orders')
  })

  it('should handle process_pool_lock error', async () => {
    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'pools') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { status: 'locked', listing: {} },
                error: null
              })
            })
          })
        }
      }
      if (table === 'pool_members') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ id: 'member1' }],
                error: null
              })
            })
          })
        }
      }
      return {}
    })

    mockRpc.mockImplementation((fnName) => {
      if (fnName === 'process_pool_lock') return Promise.resolve({ error: { message: 'Lock error' } })
      return Promise.resolve({ error: null })
    })

    const result = await capturePoolPayments(poolId)

    expect(result).toEqual({ success: false, error: 'Failed to capture payments' })
    expect(logError).toHaveBeenCalled()
  })
})
