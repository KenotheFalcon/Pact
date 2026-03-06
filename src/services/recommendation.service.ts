import {
  EARTH_RADIUS_KM,
  DEFAULT_SEARCH_RADIUS_KM,
  POOL_STATUS,
} from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"
import { Pool } from "@/types/database"

const MS_PER_DAY = 24 * 60 * 60 * 1000

export class RecommendationService {
  /**
   * Get recommended pools based on user location
   * Uses PostGIS via Supabase RPC 'get_nearby_pools'
   */
  static async getRecommendedPools(
    latitude: number,
    longitude: number,
    radiusKm: number = DEFAULT_SEARCH_RADIUS_KM
  ): Promise<Pool[]> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("get_nearby_pools", {
      lat: latitude,
      long: longitude,
      radius_km: radiusKm,
    })

    if (error) {
      return this.fallbackRecommendation(latitude, longitude, radiusKm)
    }

    return data as Pool[]
  }

  /**
   * Fallback recommendation logic if RPC fails or doesn't exist
   */
  private static async fallbackRecommendation(
    userLat: number,
    userLong: number,
    radiusKm: number
  ): Promise<Pool[]> {
    const supabase = await createClient()

    const { data: pools, error } = await supabase
      .from("pools")
      .select(`
        *,
        listing:listings (*),
        leader:profiles!pools_leader_id_fkey (*)
      `)
      .eq("status", POOL_STATUS.ACTIVE)
      .gt("expires_at", new Date().toISOString())

    if (error || !pools) return []

    const poolsWithDistance = pools
      .map((pool) => {
        const poolLat = pool.latitude || pool.listing?.latitude
        const poolLong = pool.longitude || pool.listing?.longitude

        if (!poolLat || !poolLong) return null

        const distance = this.calculateDistance(userLat, userLong, poolLat, poolLong)
        return { ...pool, distance }
      })
      .filter((pool) => pool && pool.distance <= radiusKm) as Pool[]

    return this.sortByUrgencyAndProgress(poolsWithDistance)
  }

  /**
   * Sort pools by time urgency and fill progress
   */
  private static sortByUrgencyAndProgress(pools: Pool[]): Pool[] {
    return pools.sort((poolA, poolB) => {
      const expiryTimeA = new Date(poolA.expires_at).getTime()
      const expiryTimeB = new Date(poolB.expires_at).getTime()

      const timeDifference = Math.abs(expiryTimeA - expiryTimeB)
      if (timeDifference > MS_PER_DAY) {
        return expiryTimeA - expiryTimeB
      }

      const progressA = poolA.current_quantity / poolA.min_quantity
      const progressB = poolB.current_quantity / poolB.min_quantity

      return progressB - progressA
    })
  }

  /**
   * Haversine formula to calculate distance in km
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const deltaLat = this.degreesToRadians(lat2 - lat1)
    const deltaLon = this.degreesToRadians(lon2 - lon1)

    const haversineA =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2)

    const haversineC = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA))
    return EARTH_RADIUS_KM * haversineC
  }

  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}
