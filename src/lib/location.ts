// Location utilities for geographical filtering

import {
  EARTH_RADIUS_KM,
  KM_PER_LATITUDE_DEGREE,
  GEOLOCATION_TIMEOUT_MS,
  GEOLOCATION_CACHE_MS,
} from '@/lib/constants'

/**
 * Calculate distance between two geographical points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const deltaLat = toRadians(lat2 - lat1)
  const deltaLon = toRadians(lon2 - lon1)

  const haversineA =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2)

  const haversineC = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA))
  const distance = EARTH_RADIUS_KM * haversineC

  return Math.round(distance * 10) / 10
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted string (e.g., "5.2 km" or "850 m")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`
  }
  return `${distanceKm.toFixed(1)} km`
}

/**
 * Get user's current location using browser Geolocation API
 * @returns Promise resolving to {latitude, longitude} or null if unavailable
 */
export async function getUserLocation(): Promise<{
  latitude: number
  longitude: number
} | null> {
  if (!navigator.geolocation) return null

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        resolve(null)
      },
      {
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: GEOLOCATION_CACHE_MS,
      }
    )
  })
}

/**
 * Format location object for display
 */
export function formatLocation(location: {
  address: string
  city?: string
  country?: string
}): string {
  const parts = [location.address]
  if (location.city) parts.push(location.city)
  if (location.country) parts.push(location.country)
  return parts.join(', ')
}

/**
 * Check if coordinates are within a certain radius of a center point
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon)
  return distance <= radiusKm
}

/**
 * Get bounds for a map view based on center point and radius
 */
export function getBoundsForRadius(
  latitude: number,
  longitude: number,
  radiusKm: number
): {
  northEast: { lat: number; lng: number }
  southWest: { lat: number; lng: number }
} {
  const latDegreesPerKm = 1 / KM_PER_LATITUDE_DEGREE
  const lonDegreesPerKm = 1 / (KM_PER_LATITUDE_DEGREE * Math.cos(toRadians(latitude)))

  const latOffset = radiusKm * latDegreesPerKm
  const lonOffset = radiusKm * lonDegreesPerKm

  return {
    northEast: {
      lat: latitude + latOffset,
      lng: longitude + lonOffset,
    },
    southWest: {
      lat: latitude - latOffset,
      lng: longitude - lonOffset,
    },
  }
}
