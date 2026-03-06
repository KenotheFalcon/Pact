import type { UserRole } from '@/types/database'

/**
 * Application role type - matches database UserRole exactly
 * Use this type when role might be undefined (e.g., before profile fetch)
 */
export type AppRole = UserRole | undefined

/**
 * Get the appropriate dashboard destination for a user's role
 * Accepts string for flexibility when role comes from DB queries
 */
export function getDestinationForRole(role: AppRole | string): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'farmer':
      return '/farmer'
    case 'buyer':
    default:
      return '/marketplace'
  }
}

/**
 * Check if a user has admin privileges
 */
export function isAdmin(role: AppRole | string): boolean {
  return role === 'admin'
}
