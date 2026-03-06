/**
 * Core application constants
 * Eliminates magic numbers and provides self-documenting values
 */

// ===== TIME CONSTANTS =====
export const MS_PER_SECOND = 1000
export const MS_PER_MINUTE = 60 * MS_PER_SECOND
export const MS_PER_HOUR = 60 * MS_PER_MINUTE
export const MS_PER_DAY = 24 * MS_PER_HOUR
export const SECONDS_PER_DAY = 86400

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
export const INITIALS_LENGTH = 2
export const MAX_NOTIFICATION_BADGE = 9
export const MAX_VISIBLE_PARTICIPANTS = 10

// ===== QUERY LIMITS =====
export const DEFAULT_QUERY_LIMIT = 100
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
export const ADMIN_SUBMISSION_LIMIT = 50
export const HOMEPAGE_POOL_LIMIT = 3
export const NOTIFICATION_LIMIT = 50

// ===== CACHE / REVALIDATION (seconds) =====
export const REVALIDATE_3_MIN = 180
export const REVALIDATE_5_MIN = 300
export const REVALIDATE_1_HOUR = 3600

// ===== POOL DEFAULTS =====
export const DEFAULT_POOL_EXPIRY_DAYS = 7
export const EXPIRY_URGENT_DAYS = 3
export const EXPIRY_WARNING_DAYS = 7

// ===== PROGRESS THRESHOLDS =====
export const PROGRESS_HIGH_THRESHOLD = 80
export const PROGRESS_MEDIUM_THRESHOLD = 50

// ===== UI THRESHOLDS =====
export const SCROLL_THRESHOLD = 20
export const PROMPT_DELAY_MS = 3000
export const ANNOUNCEMENT_DELAY_MS = 1000
export const TOAST_DURATION_MS = 5000
export const SIMULATED_DELAY_MS = 1500

// ===== RETRY SETTINGS =====
export const DEFAULT_MAX_RETRIES = 3
export const DEFAULT_RETRY_DELAY_MS = 1000

// Re-export sub-modules for convenience
export * from './validation'
export * from './statuses'
export * from './errors'
export * from './paystack'
