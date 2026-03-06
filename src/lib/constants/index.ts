/**
 * Core application constants
 * Eliminates magic numbers and provides self-documenting values
 */

// ===== GEOLOCATION =====
export const EARTH_RADIUS_KM = 6371
export const KM_PER_LATITUDE_DEGREE = 111
export const GEOLOCATION_TIMEOUT_MS = 10_000
export const GEOLOCATION_CACHE_MS = 300_000
export const DEFAULT_SEARCH_RADIUS_KM = 50

// ===== CURRENCY =====
export const KOBO_PER_NAIRA = 100
export const FARMER_SHARE_PERCENTAGE = 0.95
export const PLATFORM_FEE_PERCENTAGE = 0.05

// ===== DISPLAY =====
export const ID_DISPLAY_LENGTH = 8

// ===== QUERY LIMITS =====
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Re-export sub-modules for convenience
export * from './validation'
export * from './statuses'
export * from './errors'
export * from './paystack'
