// Database type definitions for Pact marketplace
// Re-export canonical types from supabase.ts for consistency
import type {
  UserRole,
  ListingStatus,
  PoolStatus,
  PaymentStatus,
  OrderStatus,
  ContactSubmissionStatus,
  PoolMemberPaymentStatus,
  PayoutStatus,
  DisputeStatus,
  DisputeType,
  DisputePriority,
  Database,
  Json,
} from './supabase'

// Re-export all types for external use
export type {
  UserRole,
  ListingStatus,
  PoolStatus,
  PaymentStatus,
  OrderStatus,
  ContactSubmissionStatus,
  PoolMemberPaymentStatus,
  PayoutStatus,
  DisputeStatus,
  DisputeType,
  DisputePriority,
  Database,
  Json,
}

// Legacy re-export for backwards compatibility
/** @deprecated Use PoolStatus instead. GroupBuy terminology has been replaced with Pool. */
export type GroupBuyStatus = PoolStatus

export interface ContactSubmission {
  id: string
  user_id?: string
  name: string
  email: string
  subject: string
  message: string
  status: ContactSubmissionStatus
  admin_notes?: string
  resolved_by?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

export interface Dispute {
  id: string
  reporter_id: string
  order_id?: string
  pool_id?: string
  payout_id?: string
  type: DisputeType
  subject: string
  description: string
  evidence_urls: string[]
  status: DisputeStatus
  priority: DisputePriority
  resolution?: string
  resolved_by?: string
  resolved_at?: string
  admin_notes?: string
  created_at: string
  updated_at: string
  // Joined data
  reporter?: Profile
  order?: Order
  pool?: Pool
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Profile {
  id: string
  user_id?: string
  email: string
  role: UserRole
  display_name?: string
  full_name?: string
  phone?: string
  bio?: string
  avatar_url?: string
  location?: string
  latitude?: number
  longitude?: number
  address?: string
  city?: string
  country?: string
  rating?: number
  total_reviews?: number
  is_verified: boolean
  created_at: string
  updated_at?: string
}

export interface Location {
  latitude: number
  longitude: number
  address: string
  city?: string
  country?: string
}

export interface Listing {
  id: string
  farmer_id: string
  name: string
  description: string
  category: string
  price_per_unit: number
  unit: string
  quantity: number
  min_quantity: number
  images: string[]
  latitude: number
  longitude: number
  address: string
  city?: string
  country?: string
  harvest_date?: string
  expiry_date?: string
  organic: boolean
  status: ListingStatus
  created_at: string
  updated_at: string
  // Joined data
  farmer?: Profile
  distance?: number // Distance in km from user's location
}

export interface PoolMember {
  pool_id: string
  user_id: string
  quantity_pledged: number
  amount_pledged: number
  payment_status: PoolMemberPaymentStatus
  payment_reference?: string
  joined_at: string
  // Joined data
  user?: Profile
}

export interface PoolChat {
  id: string
  pool_id: string
  user_id: string
  message: string
  created_at: string
  // Joined data
  user?: Profile
}

export interface Pool {
  id: string
  listing_id: string
  leader_id: string
  min_quantity: number
  current_quantity: number
  expires_at: string
  status: PoolStatus
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
  // Joined data
  listing?: Listing
  leader?: Profile
  members?: PoolMember[]
  progress?: number // Percentage (0-100)
  distance?: number // Distance in km from user
}

/** @deprecated Use Pool instead. GroupBuy terminology has been replaced with Pool. */
export type GroupBuy = Pool

/** @deprecated Use PoolMember instead. GroupBuyParticipant terminology has been replaced with PoolMember. */
export type GroupBuyParticipant = PoolMember

export interface Order {
  id: string
  buyer_id: string
  pool_id: string
  listing_id: string
  quantity: number
  amount: number
  payment_reference?: string
  payment_status: PaymentStatus
  status: OrderStatus
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  // Joined data
  buyer?: Profile
  pool?: Pool
  listing?: Listing
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  method: string
  status: 'pending' | 'successful' | 'failed'
  transaction_id?: string
  metadata?: Record<string, unknown>
  created_at: string
  verified_at?: string
}

export interface Review {
  id: string
  order_id: string
  buyer_id: string
  farmer_id: string
  listing_id?: string
  rating: number
  comment?: string
  images: string[]
  created_at: string
  // Joined data
  buyer?: Profile
  listing?: Listing
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Filter types
export interface ListingFilters {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  latitude?: number
  longitude?: number
  radius?: number // in km
  organic?: boolean
  status?: ListingStatus
  page?: number
  limit?: number
  sortBy?: 'price' | 'created_at' | 'distance'
  sortOrder?: 'asc' | 'desc'
}

export interface PoolFilters {
  status?: PoolStatus
  category?: string
  latitude?: number
  longitude?: number
  radius?: number
  page?: number
  limit?: number
  sortBy?: 'expires_at' | 'progress' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

/** @deprecated Use PoolFilters instead. GroupBuy terminology has been replaced with Pool. */
export type GroupBuyFilters = PoolFilters

export interface Product {
  id: string
  title: string
  description: string
  category: string
  price_per_unit: number
  unit: string
  quantity: number
  image_url: string | null
  farmer_id: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  farmer_id: string
  pool_id?: string
  amount: number
  type: 'sale' | 'commission'
  status: 'pending' | 'completed'
  created_at: string
  updated_at: string
}
