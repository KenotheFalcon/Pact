/**
 * Supabase Database Types
 * 
 * This file provides type definitions for Supabase operations.
 * Compatible with @supabase/supabase-js 2.81.1 and @supabase/ssr 0.8.0
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum types matching the database
export type UserRole = 'buyer' | 'farmer' | 'admin'
export type ListingStatus = 'available' | 'pending' | 'active' | 'rejected' | 'sold_out' | 'expired' | 'inactive'
export type PoolStatus = 'active' | 'locked' | 'funded' | 'completed' | 'cancelled' | 'expired'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled'
export type PoolMemberPaymentStatus = 'pending' | 'authorized' | 'captured' | 'voided'
export type ContactSubmissionStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'rejected'
export type DisputeType = 'order' | 'payout' | 'quality' | 'delivery' | 'other'
export type DisputePriority = 'low' | 'medium' | 'high' | 'urgent'
export type ChargebackStatus = 'open' | 'awaiting_response' | 'under_review' | 'resolved_won' | 'resolved_lost' | 'refunded'
export type WebhookLogStatus = 'pending' | 'processed' | 'failed' | 'retrying'

// Table Row Types
// NOTE: Using `type` instead of `interface` because interfaces don't have
// implicit index signatures and won't satisfy Record<string, unknown>
// required by @supabase/postgrest-js GenericTable.Row
export type ProfileRow = {
  id: string
  email: string
  role: UserRole
  display_name: string | null
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  address: string | null
  city: string | null
  country: string | null
  bio: string | null
  latitude: number | null
  longitude: number | null
  rating: number | null
  total_reviews: number | null
  is_verified: boolean
  email_verified: boolean
  created_at: string
  updated_at: string
}

export type ListingRow = {
  id: string
  farmer_id: string
  name: string
  description: string | null
  category: string | null
  price_per_unit: number
  unit: string
  quantity: number
  min_pool_qty: number
  images: Json
  organic: boolean
  latitude: number | null
  longitude: number | null
  address: string | null
  city: string | null
  country: string | null
  harvest_date: string | null
  expiry_date: string | null
  status: ListingStatus
  created_at: string
  updated_at: string
}

export type PoolRow = {
  id: string
  listing_id: string
  leader_id: string | null
  min_quantity: number
  current_quantity: number
  expires_at: string
  status: PoolStatus
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

export type PoolMemberRow = {
  pool_id: string
  user_id: string
  quantity_pledged: number
  amount_pledged: number
  payment_status: PoolMemberPaymentStatus
  payment_reference: string | null
  joined_at: string
}

export type OrderRow = {
  id: string
  buyer_id: string
  pool_id: string
  listing_id: string | null
  quantity: number
  amount: number
  payment_status: PaymentStatus
  status: OrderStatus
  payment_reference: string | null
  metadata: Json | null
  created_at: string
  updated_at: string
}

export type PoolChatRow = {
  id: string
  pool_id: string
  user_id: string
  message: string
  created_at: string
}

export type NotificationRow = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  metadata: Json | null
  created_at: string
}

export type ContactSubmissionRow = {
  id: string
  user_id: string | null
  name: string
  email: string
  subject: string
  message: string
  status: ContactSubmissionStatus
  admin_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export type PayoutRow = {
  id: string
  pool_id: string
  farmer_id: string
  amount: number
  platform_fee: number
  status: PayoutStatus
  reference: string
  transfer_code: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export type ReviewRow = {
  id: string
  order_id: string
  buyer_id: string
  farmer_id: string
  listing_id: string | null
  rating: number
  comment: string | null
  images: Json
  created_at: string
}

export type PushSubscriptionRow = {
  id: string
  user_id: string
  endpoint: string
  keys_p256dh: string
  keys_auth: string
  created_at: string
}

export type DisputeRow = {
  id: string
  reporter_id: string
  order_id: string | null
  pool_id: string | null
  payout_id: string | null
  type: DisputeType
  subject: string
  description: string
  evidence_urls: string[]
  status: DisputeStatus
  priority: DisputePriority
  resolution: string | null
  resolved_by: string | null
  resolved_at: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export type FarmerBankAccountRow = {
  id: string
  user_id: string
  bank_code: string
  bank_name: string
  account_number: string
  account_name: string
  recipient_code: string | null
  is_default: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export type FarmerRow = {
  user_id: string
  farm_name: string | null
  location: string | null
  phone: string | null
  bio: string | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

export type WebhookLogRow = {
  id: string
  event_type: string
  source: string
  payload: Json
  reference: string | null
  status: WebhookLogStatus
  error_message: string | null
  retry_count: number
  processed_at: string | null
  created_at: string
}

export type ChargebackRow = {
  id: string
  order_id: string | null
  pool_member_id: string | null
  paystack_dispute_id: string | null
  payment_reference: string
  amount: number
  currency: string
  reason: string | null
  status: ChargebackStatus
  evidence: Json
  due_date: string | null
  resolved_at: string | null
  outcome: string | null
  admin_notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type AdminAuditLogRow = {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string | null
  old_value: Json | null
  new_value: Json | null
  metadata: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// View types
export type FarmerPayoutStatsRow = {
  user_id: string
  completed_count: number
  pending_count: number
  total_earned: number
  pending_amount: number
  this_month_earned: number
  last_month_earned: number
}

// Database type for Supabase client
// Compatible with @supabase/supabase-js GenericSchema requirements
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Partial<ProfileRow> & Pick<ProfileRow, 'id' | 'email'>
        Update: Partial<ProfileRow>
        Relationships: []
      }
      listings: {
        Row: ListingRow
        Insert: Partial<ListingRow> & Pick<ListingRow, 'farmer_id' | 'name' | 'price_per_unit' | 'unit'>
        Update: Partial<ListingRow>
        Relationships: [
          {
            foreignKeyName: 'listings_farmer_id_fkey'
            columns: ['farmer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      pools: {
        Row: PoolRow
        Insert: Partial<PoolRow> & Pick<PoolRow, 'listing_id' | 'min_quantity' | 'expires_at'>
        Update: Partial<PoolRow>
        Relationships: [
          {
            foreignKeyName: 'pools_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pools_leader_id_fkey'
            columns: ['leader_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      pool_members: {
        Row: PoolMemberRow
        Insert: Partial<PoolMemberRow> & Pick<PoolMemberRow, 'pool_id' | 'user_id' | 'quantity_pledged' | 'amount_pledged'>
        Update: Partial<PoolMemberRow>
        Relationships: [
          {
            foreignKeyName: 'pool_members_pool_id_fkey'
            columns: ['pool_id']
            isOneToOne: false
            referencedRelation: 'pools'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pool_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      orders: {
        Row: OrderRow
        Insert: Partial<OrderRow> & Pick<OrderRow, 'buyer_id' | 'pool_id' | 'quantity' | 'amount'>
        Update: Partial<OrderRow>
        Relationships: [
          {
            foreignKeyName: 'orders_buyer_id_fkey'
            columns: ['buyer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_pool_id_fkey'
            columns: ['pool_id']
            isOneToOne: false
            referencedRelation: 'pools'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          }
        ]
      }
      pool_chat: {
        Row: PoolChatRow
        Insert: Partial<PoolChatRow> & Pick<PoolChatRow, 'pool_id' | 'user_id' | 'message'>
        Update: Partial<PoolChatRow>
        Relationships: [
          {
            foreignKeyName: 'pool_chat_pool_id_fkey'
            columns: ['pool_id']
            isOneToOne: false
            referencedRelation: 'pools'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pool_chat_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: NotificationRow
        Insert: Partial<NotificationRow> & Pick<NotificationRow, 'user_id' | 'type' | 'title' | 'message'>
        Update: Partial<NotificationRow>
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      contact_submissions: {
        Row: ContactSubmissionRow
        Insert: Partial<ContactSubmissionRow> & Pick<ContactSubmissionRow, 'name' | 'email' | 'subject' | 'message'>
        Update: Partial<ContactSubmissionRow>
        Relationships: [
          {
            foreignKeyName: 'contact_submissions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_submissions_resolved_by_fkey'
            columns: ['resolved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      payouts: {
        Row: PayoutRow
        Insert: Partial<PayoutRow> & Pick<PayoutRow, 'pool_id' | 'farmer_id' | 'amount' | 'platform_fee' | 'reference'>
        Update: Partial<PayoutRow>
        Relationships: [
          {
            foreignKeyName: 'payouts_pool_id_fkey'
            columns: ['pool_id']
            isOneToOne: false
            referencedRelation: 'pools'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payouts_farmer_id_fkey'
            columns: ['farmer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      reviews: {
        Row: ReviewRow
        Insert: Partial<ReviewRow> & Pick<ReviewRow, 'order_id' | 'buyer_id' | 'farmer_id' | 'rating'>
        Update: Partial<ReviewRow>
        Relationships: [
          {
            foreignKeyName: 'reviews_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_buyer_id_fkey'
            columns: ['buyer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_farmer_id_fkey'
            columns: ['farmer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      push_subscriptions: {
        Row: PushSubscriptionRow
        Insert: Partial<PushSubscriptionRow> & Pick<PushSubscriptionRow, 'user_id' | 'endpoint' | 'keys_p256dh' | 'keys_auth'>
        Update: Partial<PushSubscriptionRow>
        Relationships: [
          {
            foreignKeyName: 'push_subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      disputes: {
        Row: DisputeRow
        Insert: Partial<DisputeRow> & Pick<DisputeRow, 'reporter_id' | 'subject' | 'description'>
        Update: Partial<DisputeRow>
        Relationships: [
          {
            foreignKeyName: 'disputes_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disputes_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disputes_pool_id_fkey'
            columns: ['pool_id']
            isOneToOne: false
            referencedRelation: 'pools'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disputes_payout_id_fkey'
            columns: ['payout_id']
            isOneToOne: false
            referencedRelation: 'payouts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disputes_resolved_by_fkey'
            columns: ['resolved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      farmer_bank_accounts: {
        Row: FarmerBankAccountRow
        Insert: Partial<FarmerBankAccountRow> & Pick<FarmerBankAccountRow, 'user_id' | 'bank_code' | 'bank_name' | 'account_number' | 'account_name'>
        Update: Partial<FarmerBankAccountRow>
        Relationships: [
          {
            foreignKeyName: 'farmer_bank_accounts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      farmers: {
        Row: FarmerRow
        Insert: Partial<FarmerRow> & Pick<FarmerRow, 'user_id'>
        Update: Partial<FarmerRow>
        Relationships: [
          {
            foreignKeyName: 'farmers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      webhook_logs: {
        Row: WebhookLogRow
        Insert: Partial<WebhookLogRow> & Pick<WebhookLogRow, 'event_type'>
        Update: Partial<WebhookLogRow>
        Relationships: []
      }
      chargebacks: {
        Row: ChargebackRow
        Insert: Partial<ChargebackRow> & Pick<ChargebackRow, 'payment_reference' | 'amount'>
        Update: Partial<ChargebackRow>
        Relationships: [
          {
            foreignKeyName: 'chargebacks_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'chargebacks_pool_member_id_fkey'
            columns: ['pool_member_id']
            isOneToOne: false
            referencedRelation: 'pool_members'
            referencedColumns: ['pool_id']
          },
          {
            foreignKeyName: 'chargebacks_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      admin_audit_log: {
        Row: AdminAuditLogRow
        Insert: Partial<AdminAuditLogRow> & Pick<AdminAuditLogRow, 'admin_id' | 'action' | 'target_type'>
        Update: Partial<AdminAuditLogRow>
        Relationships: [
          {
            foreignKeyName: 'admin_audit_log_admin_id_fkey'
            columns: ['admin_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      farmer_payout_stats: {
        Row: FarmerPayoutStatsRow
        Relationships: [
          {
            foreignKeyName: 'farmer_payout_stats_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Functions: {
      increment_pool_quantity: {
        Args: { pool_id_param: string; quantity_param: number }
        Returns: undefined
      }
      reserve_pool_membership: {
        Args: {
          pool_id_param: string
          user_id_param: string
          quantity_param: number
          amount_naira: number
          reference_param: string
        }
        Returns: boolean
      }
      join_pool: {
        Args: { p_pool_id: string; p_user_id: string; p_quantity: number }
        Returns: boolean
      }
      process_pool_lock: {
        Args: { pool_id_param: string }
        Returns: undefined
      }
      create_orders_for_pool: {
        Args: { pool_id_param: string }
        Returns: number
      }
      deduct_pool_inventory: {
        Args: { pool_id_param: string }
        Returns: undefined
      }
      get_farmer_available_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      auto_generate_payouts: {
        Args: { pool_id_param: string; platform_fee_percent: number }
        Returns: { id: string; reference: string; amount: number }[]
      }
      authorize_payment_atomically: {
        Args: { p_payment_reference: string; p_pool_id: string }
        Returns: 'authorized' | 'already_processed' | 'not_found'
      }
      get_nearby_pools: {
        Args: { p_latitude: number; p_longitude: number; p_radius_km: number }
        Returns: {
          id: string
          listing_id: string
          min_quantity: number
          current_quantity: number
          expires_at: string
          status: PoolStatus
          distance_km: number
        }[]
      }
      get_farmer_monthly_earnings: {
        Args: { p_user_id: string; p_months: number }
        Returns: {
          month: string
          total: number
        }[]
      }
      list_pools_with_filters: {
        Args: {
          p_category: string | null
          p_latitude: number | null
          p_longitude: number | null
          p_radius_km: number | null
          p_sort_by: string
          p_sort_order: string
          p_limit: number
          p_offset: number
        }
        Returns: {
          id: string
          listing_id: string
          leader_id: string | null
          min_quantity: number
          current_quantity: number
          expires_at: string
          status: string
          latitude: number | null
          longitude: number | null
          created_at: string
          updated_at: string
          farmer_id: string | null
          name: string
          description: string | null
          category: string | null
          unit: string
          quantity: number | null
          price_per_unit: number
          images: Json
          address: string | null
          city: string | null
          country: string | null
          harvest_date: string | null
          organic: boolean | null
          listing_status: string | null
          listing_created_at: string | null
          listing_updated_at: string | null
          distance_km: number | null
          total_count: number
        }[]
      }
    }
    Enums: {
      app_role: UserRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
