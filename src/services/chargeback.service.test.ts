import { ChargebackService } from './chargeback.service'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
}
const mockUpdate = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockSingle = jest.fn()

// Setup chain
mockSupabase.from.mockReturnValue({
  update: mockUpdate,
})
mockUpdate.mockReturnValue({
  eq: mockEq,
})
mockEq.mockReturnValue({
  select: mockSelect,
})
mockSelect.mockReturnValue({
  single: mockSingle,
})

describe('ChargebackService', () => {
  let service: ChargebackService

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset chain defaults
    mockSupabase.from.mockReturnValue({ update: mockUpdate })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ single: mockSingle })

    // Initialize service with mock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new ChargebackService(mockSupabase as any)
  })

  describe('resolveDispute', () => {
    const mockDate = '2024-03-06T12:00:00.000Z'

    beforeAll(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date(mockDate))
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it('should successfully resolve a dispute as won', async () => {
      const mockDisputeId = 'dispute-123'
      const mockReturnData = { id: mockDisputeId, status: 'resolved_won' }

      mockSingle.mockResolvedValueOnce({ data: mockReturnData, error: null })

      const result = await service.resolveDispute(mockDisputeId, 'won', 'Merchant provided strong evidence')

      expect(mockSupabase.from).toHaveBeenCalledWith('chargebacks')
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'resolved_won',
        outcome: 'won',
        admin_notes: 'Merchant provided strong evidence',
        resolved_at: mockDate,
        updated_at: mockDate,
      })
      expect(mockEq).toHaveBeenCalledWith('id', mockDisputeId)
      expect(result).toEqual({ success: true, data: mockReturnData })
    })

    it('should successfully resolve a dispute as lost', async () => {
      const mockDisputeId = 'dispute-123'
      const mockReturnData = { id: mockDisputeId, status: 'resolved_lost' }

      mockSingle.mockResolvedValueOnce({ data: mockReturnData, error: null })

      const result = await service.resolveDispute(mockDisputeId, 'lost')

      expect(mockSupabase.from).toHaveBeenCalledWith('chargebacks')
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'resolved_lost',
        outcome: 'lost',
        admin_notes: undefined,
        resolved_at: mockDate,
        updated_at: mockDate,
      })
      expect(mockEq).toHaveBeenCalledWith('id', mockDisputeId)
      expect(result).toEqual({ success: true, data: mockReturnData })
    })

    it('should return error when database operation fails', async () => {
      const mockDisputeId = 'dispute-123'
      const dbError = new Error('Database connection failed')

      mockSingle.mockResolvedValueOnce({ data: null, error: dbError })

      const result = await service.resolveDispute(mockDisputeId, 'won')

      expect(mockSupabase.from).toHaveBeenCalledWith('chargebacks')
      expect(result).toEqual({ success: false, error: dbError.message })
    })

    it('should catch exceptions and return a fallback error message', async () => {
      const mockDisputeId = 'dispute-123'

      // Force an exception to be thrown
      mockSingle.mockRejectedValueOnce(new Error('Unexpected error'))

      const result = await service.resolveDispute(mockDisputeId, 'won')

      expect(result).toEqual({ success: false, error: 'Failed to resolve dispute' })
    })
  })
})
