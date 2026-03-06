/**
 * Validation constants for forms and API endpoints
 */

// ===== PASSWORD =====
export const MIN_PASSWORD_LENGTH = 8
export const RECOMMENDED_PASSWORD_LENGTH = 12
export const STRONG_PASSWORD_LENGTH = 16

export const PASSWORD_SCORE = {
  LOWERCASE_BONUS: 10,
  UPPERCASE_BONUS: 15,
  NUMBER_BONUS: 15,
  SPECIAL_CHAR_BONUS: 20,
  LENGTH_8_BONUS: 15,
  LENGTH_12_BONUS: 20,
  LENGTH_16_BONUS: 30,
} as const

export const PASSWORD_STRENGTH_THRESHOLDS = {
  WEAK: 40,
  FAIR: 60,
  GOOD: 80,
} as const

// ===== FIELD LENGTHS =====
export const MAX_LISTING_NAME_LENGTH = 200
export const MAX_DESCRIPTION_LENGTH = 2000
export const MAX_UNIT_LENGTH = 50
export const MAX_CATEGORY_LENGTH = 100
export const MAX_ADMIN_NOTES_LENGTH = 2000
export const MIN_NAME_LENGTH = 3
export const MIN_DESCRIPTION_LENGTH = 10

// ===== BANK =====
export const BANK_CODE_MIN_LENGTH = 3
export const BANK_CODE_MAX_LENGTH = 10

// ===== PAYOUT =====
export const MIN_PAYOUT_KOBO = 100

// ===== FILE UPLOAD =====
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const DEFAULT_MAX_IMAGE_WIDTH = 1920
export const DEFAULT_MAX_IMAGE_HEIGHT = 1920
export const DEFAULT_IMAGE_QUALITY = 0.8

// ===== ALLOWED FILE TYPES =====
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const
