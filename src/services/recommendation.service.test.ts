import { SupabaseClient } from '@supabase/supabase-js'

import {
  MS_PER_DAY,
  POOL_STATUS,
} from '@/lib/constants'

import { RecommendationService } from './recommendation.service'

// Mock Supabase
const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn(),
}

const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockGt = jest.fn()

// Chain Setup
mockSupabase.from.mockReturnValue({
  select: mockSelect,
})
mockSelect.mockReturnValue({
  eq: mockEq,
})
mockEq.mockReturnValue({
  gt: mockGt,
})
mockGt.mockReturnValue({
  data: [],
  error: null,
})

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe('RecommendationService', () => {
  describe('Initialization and getRecommendations', () => {
    it('should initialize with a Supabase client', () => {
      const mockClient = {} as SupabaseClient
      const service = new RecommendationService(mockClient)
      expect(service).toBeInstanceOf(RecommendationService)
    })

    it('should throw error if getRecommendations is called without Supabase client', async () => {
      // @ts-expect-error Testing invalid initialization
      const service = new RecommendationService(undefined)
      await expect(service.getRecommendations('user-123')).rejects.toThrow('Supabase client not initialized')
    })

    it('should return empty array for default getRecommendations state', async () => {
      const mockClient = {} as SupabaseClient
      const service = new RecommendationService(mockClient)
      const recommendations = await service.getRecommendations('user-123')
      expect(recommendations).toEqual([])
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset default mock implementations for the chain
    mockSupabase.from.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ gt: mockGt })
    mockGt.mockResolvedValue({ data: [], error: null })
  })

  describe('getRecommendedPools', () => {
    it('should return recommended pools using Supabase RPC successfully', async () => {
      const mockPools = [
        { id: 'pool-1', status: POOL_STATUS.ACTIVE },
        { id: 'pool-2', status: POOL_STATUS.ACTIVE },
      ]

      mockSupabase.rpc.mockResolvedValueOnce({ data: mockPools, error: null })

      const result = await RecommendationService.getRecommendedPools(10.0, 20.0, 50)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_nearby_pools', {
        lat: 10.0,
        long: 20.0,
        radius_km: 50,
      })
      expect(result).toEqual(mockPools)
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should fallback to JS logic if RPC fails', async () => {
      const userLat = 0
      const userLong = 0

      // Distance to point is ~111 km per degree of lat/long.
      // Point 1: 0.1 degree lat ~ 11 km
      // Point 2: 1.0 degree lat ~ 111 km (should be filtered out by default 50km radius)

      // Use fixed current time for tests so `expires_at > new Date().toISOString()` behaves predictably
      jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00Z'))

      const futureDate = new Date(Date.now() + MS_PER_DAY * 2).toISOString()
      const soonDate = new Date(Date.now() + MS_PER_DAY / 2).toISOString()

      const mockFallbackPools = [
        {
          id: 'pool-far',
          status: POOL_STATUS.ACTIVE,
          expires_at: futureDate,
          latitude: 1.0,
          longitude: 0.1,
          current_quantity: 0,
          min_quantity: 10,
        },
        {
          id: 'pool-near-urgent',
          status: POOL_STATUS.ACTIVE,
          expires_at: soonDate, // Urgent
          latitude: 0.1,
          longitude: 0.1,
          current_quantity: 5, // 50%
          min_quantity: 10,
        },
        {
          id: 'pool-near-progress',
          status: POOL_STATUS.ACTIVE,
          expires_at: futureDate,
          latitude: 0.1,
          longitude: 0.1,
          current_quantity: 8, // 80% (Higher progress)
          min_quantity: 10,
        },
        {
          id: 'pool-near-low-progress',
          status: POOL_STATUS.ACTIVE,
          expires_at: futureDate,
          latitude: 0.1,
          longitude: 0.1,
          current_quantity: 2, // 20%
          min_quantity: 10,
        }
      ]

      // Fail RPC
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: new Error('RPC not found') })

      // Fallback returns our mock pools
      mockGt.mockResolvedValueOnce({ data: mockFallbackPools, error: null })

      // Call the service with a 50km radius
      const result = await RecommendationService.getRecommendedPools(userLat, userLong, 50)

      // Verifications
      expect(mockSupabase.rpc).toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith('pools')

      // 1. pool-far should be filtered out (> 50km)
      expect(result.find(p => p.id === 'pool-far')).toBeUndefined()

      // 2. Sorting Check
      // pool-near-urgent is urgent (< 1 day difference to now, compared to others)
      // wait, the sorting logic compares pair-wise.
      // If timeDifference > 1 day, sort by expiry time ascending.
      // pool-near-urgent vs pool-near-progress -> time diff > 1 day. So urgent comes first.
      // pool-near-progress vs pool-near-low-progress -> time diff < 1 day. So sort by progress descending.

      expect(result.length).toBe(3)
      expect(result[0].id).toBe('pool-near-urgent') // nearest expiry
      expect(result[1].id).toBe('pool-near-progress') // higher progress
      expect(result[2].id).toBe('pool-near-low-progress') // lower progress

      jest.useRealTimers()
    })

    it('should use listing coordinates if pool coordinates are missing in fallback', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00Z'))
      const futureDate = new Date(Date.now() + MS_PER_DAY * 2).toISOString()

      const mockFallbackPools = [
        {
          id: 'pool-no-coords',
          status: POOL_STATUS.ACTIVE,
          expires_at: futureDate,
          current_quantity: 0,
          min_quantity: 10,
          listing: {
            latitude: 0.1,
            longitude: 0.1,
          }
        }
      ]

      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: new Error('RPC not found') })
      mockGt.mockResolvedValueOnce({ data: mockFallbackPools, error: null })

      const result = await RecommendationService.getRecommendedPools(0, 0, 50)

      expect(result.length).toBe(1)
      expect(result[0].id).toBe('pool-no-coords')
      expect(result[0]).toHaveProperty('distance')

      jest.useRealTimers()
    })

    it('should return empty array if fallback fails', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: new Error('RPC not found') })
      mockGt.mockResolvedValueOnce({ data: null, error: new Error('DB Error') })

      const result = await RecommendationService.getRecommendedPools(0, 0, 50)
      expect(result).toEqual([])
    })
  })
})
