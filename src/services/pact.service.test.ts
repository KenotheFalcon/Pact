import { PactService } from './pact.service'
import { PaymentService } from './payment.service'

// Mock PaymentService
jest.mock('./payment.service', () => ({
  PaymentService: {
    initializeTransaction: jest.fn(),
  },
}))

// Mock generatePaymentReference to return predictable values
jest.mock('@/lib/payments/paystack', () => ({
  generatePaymentReference: jest.fn(() => 'PACT-TEST-REF-123'),
}))

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
}
const mockFrom = jest.fn()
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()
const mockInsert = jest.fn()
const mockOrder = jest.fn()
const mockLimit = jest.fn()

// Chain Setup
mockSupabase.from.mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
})
mockSelect.mockReturnValue({
  eq: mockEq,
  order: mockOrder, // For chat
  single: mockSingle,
  inner: jest.fn(), // For search
})
mockEq.mockReturnValue({
  single: mockSingle,
  eq: mockEq,
  limit: mockLimit,
  order: mockOrder,
})
mockInsert.mockReturnValue({
  select: mockSelect,
})
mockSingle.mockReturnValue(Promise.resolve({ data: {}, error: null }))
mockOrder.mockReturnValue(Promise.resolve({ data: [], error: null }))

// Fix the mock return for createClient to be an async function that returns the client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe('PactService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset default mock implementations for the chain
    mockSupabase.from.mockReturnValue({ select: mockSelect, insert: mockInsert })
    mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, single: mockSingle })
    mockInsert.mockReturnValue({ select: mockSelect })
    mockEq.mockReturnValue({ single: mockSingle, eq: mockEq })
    mockSingle.mockResolvedValue({ data: { id: 'test-id' }, error: null })
  })

  describe('createPool', () => {
    it('should create a pool successfully when listing exists', async () => {
      // Mock listing check
      mockSingle.mockResolvedValueOnce({ data: { quantity: 100, price_per_unit: 10 }, error: null })
      // Mock pool creation
      mockSingle.mockResolvedValueOnce({ data: { id: 'new-pool-id', status: 'active' }, error: null })

      const result = await PactService.createPool({
        listingId: 'listing-123',
        leaderId: 'user-123',
        minQuantity: 10,
        expiresAt: '2024-12-31',
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('listings')
      expect(mockSupabase.from).toHaveBeenCalledWith('pools')
      expect(result).toEqual({ id: 'new-pool-id', status: 'active' })
    })

    it('should throw error if listing is not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })

      await expect(PactService.createPool({
        listingId: 'invalid-id',
        leaderId: 'user-123',
        minQuantity: 10,
        expiresAt: '2024-12-31',
      })).rejects.toThrow('Listing not found')
    })
  })

  describe('joinPool', () => {
    const mockPaymentResponse = { reference: 'PACT-TEST-REF-123', authorization_url: 'http://pay.com' }

    it('should join pool successfully', async () => {
      // 1. Fetch pool with listing price
      mockSingle.mockResolvedValueOnce({ 
        data: { 
          listing: { price_per_unit: 50 },
          id: 'pool-123' 
        }, 
        error: null 
      })

      // 2. RPC reserve_pool_membership success
      mockSupabase.rpc.mockResolvedValue({ error: null })

      // 3. Payment Init
      ;(PaymentService.initializeTransaction as jest.Mock).mockResolvedValue(mockPaymentResponse)

      const result = await PactService.joinPool('pool-123', 'user-123', 5, 'test@test.com')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('reserve_pool_membership', {
        pool_id_param: 'pool-123',
        user_id_param: 'user-123',
        quantity_param: 5,
        amount_naira: 250,
        reference_param: 'PACT-TEST-REF-123',
      })
      expect(PaymentService.initializeTransaction).toHaveBeenCalledWith(
        'user-123', 
        'test@test.com', 
        250, 
        expect.objectContaining({ type: 'pool_join', pool_id: 'pool-123', quantity: 5 }),
        'PACT-TEST-REF-123'
      )
      expect(result).toEqual(mockPaymentResponse)
    })
  })
})
