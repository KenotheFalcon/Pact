import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { POOL_STATUS, USER_ROLE } from '@/lib/constants'

/**
 * Verify if the current user has admin privileges
 * Throws error if not authenticated or not an admin
 */
export async function verifyAdminAccess(): Promise<{
  userId: string
  supabase: SupabaseClient
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized: User not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileData = profile as { role: string } | null
  if (profileData?.role !== USER_ROLE.ADMIN) {
    throw new Error('Unauthorized: Admin access required')
  }

  return { userId: user.id, supabase }
}

/**
 * Check if a user has admin role (non-throwing version)
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    await verifyAdminAccess()
    return true
  } catch {
    return false
  }
}

/**
 * Get admin statistics for dashboard
 */
export async function getAdminStats() {
  const { supabase } = await verifyAdminAccess()

  const [
    { count: totalUsers },
    { count: totalFarmers },
    { count: totalBuyers },
    { count: verifiedFarmers },
    { count: activeListings },
    { count: activePools },
    { count: totalOrders },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', USER_ROLE.FARMER),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', USER_ROLE.BUYER),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', USER_ROLE.FARMER)
      .eq('is_verified', true),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'available'),
    supabase.from('pools').select('id', { count: 'exact', head: true }).eq('status', POOL_STATUS.ACTIVE),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('id, amount, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  // Calculate total revenue from completed orders
  type OrderWithAmount = { amount: number; payment_status: string }
  const orders = (recentOrders || []) as OrderWithAmount[]
  const totalRevenue = orders.reduce((sum, order) => {
    if (order.payment_status === 'paid') {
      return sum + (order.amount || 0)
    }
    return sum
  }, 0)

  return {
    totalUsers: totalUsers || 0,
    totalFarmers: totalFarmers || 0,
    totalBuyers: totalBuyers || 0,
    verifiedFarmers: verifiedFarmers || 0,
    activeListings: activeListings || 0,
    activePools: activePools || 0,
    totalOrders: totalOrders || 0,
    totalRevenue,
  }
}
