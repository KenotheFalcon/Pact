import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { AnalyticsStats } from '@/components/farmer/AnalyticsStats'
import { RevenueChart } from '@/components/farmer/RevenueChart'
import { TopProducts } from '@/components/farmer/TopProducts'
import { PoolPerformance } from '@/components/farmer/PoolPerformance'

import { BarChart3 } from 'lucide-react'

export const metadata = {
  title: 'Analytics | Pact',
  description: 'View your farm sales analytics and performance metrics',
}

export const revalidate = 300 // ISR: 5 min

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Parallel data fetching for all analytics
  const [
    { data: orders },
    { data: payouts },
    { data: listings },
    { data: pools },
  ] = await Promise.all([
    // Orders linked to farmer's listings
    supabase
      .from('orders')
      .select('id, quantity, amount, status, payment_status, listing_id, created_at')
      .order('created_at', { ascending: false }),
    // Farmer payouts
    supabase
      .from('payouts')
      .select('id, amount, platform_fee, status, created_at')
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false }),
    // Farmer listings
    supabase
      .from('listings')
      .select('id, name, price_per_unit, unit, quantity, status, category, created_at')
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false }),
    // Pools for farmer's listings
    supabase
      .from('pools')
      .select('id, listing_id, min_quantity, current_quantity, status, expires_at, created_at')
      .order('created_at', { ascending: false }),
  ])

  // Filter orders to only those for this farmer's listings
  const farmerListingIds = new Set((listings ?? []).map(l => l.id))
  const farmerOrders = (orders ?? []).filter(o => o.listing_id && farmerListingIds.has(o.listing_id))
  const farmerPools = (pools ?? []).filter(p => farmerListingIds.has(p.listing_id))

  // Compute stats
  const paidOrders = farmerOrders.filter(o => o.payment_status === 'paid')
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount ?? 0), 0)
  const totalOrders = farmerOrders.length
  const totalUnitsSold = paidOrders.reduce((sum, o) => sum + (o.quantity ?? 0), 0)
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0

  // Monthly revenue for the last 6 months
  const now = new Date()
  const monthlyRevenue: { month: string; amount: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = d.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

    const monthAmount = paidOrders
      .filter(o => {
        const oDate = new Date(o.created_at)
        return oDate >= monthStart && oDate <= monthEnd
      })
      .reduce((sum, o) => sum + (o.amount ?? 0), 0)

    monthlyRevenue.push({ month: monthStr, amount: monthAmount })
  }

  // Top products by revenue
  const productRevenue = new Map<string, { name: string; revenue: number; unitsSold: number; orderCount: number }>()
  for (const order of paidOrders) {
    const listing = (listings ?? []).find(l => l.id === order.listing_id)
    if (!listing) continue
    const existing = productRevenue.get(listing.id) ?? { name: listing.name, revenue: 0, unitsSold: 0, orderCount: 0 }
    existing.revenue += order.amount ?? 0
    existing.unitsSold += order.quantity ?? 0
    existing.orderCount += 1
    productRevenue.set(listing.id, existing)
  }
  const topProducts = Array.from(productRevenue.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Pool performance
  const completedPools = farmerPools.filter(p => p.status === 'completed').length
  const activePools = farmerPools.filter(p => p.status === 'active').length
  const lockedPools = farmerPools.filter(p => p.status === 'locked').length
  const cancelledPools = farmerPools.filter(p => p.status === 'cancelled' || p.status === 'expired').length
  const totalPools = farmerPools.length
  const lockThroughRate = totalPools > 0
    ? ((completedPools + lockedPools) / totalPools) * 100
    : 0
  const avgFillRate = farmerPools.length > 0
    ? farmerPools.reduce((sum, p) => {
        const fill = p.min_quantity > 0 ? (p.current_quantity / p.min_quantity) * 100 : 0
        return sum + Math.min(fill, 100)
      }, 0) / farmerPools.length
    : 0

  // Payout stats
  const completedPayouts = (payouts ?? []).filter(p => p.status === 'completed')
  const totalPaidOut = completedPayouts.reduce((sum, p) => sum + (p.amount ?? 0), 0)
  const totalFees = completedPayouts.reduce((sum, p) => sum + (p.platform_fee ?? 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
            <BarChart3 className="h-5 w-5 text-pact-green" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Track your farm performance</p>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">
          All amounts in Nigerian Naira
        </span>
      </div>

      {/* Stats Cards */}
      <AnalyticsStats
        totalRevenue={totalRevenue / 100}
        totalOrders={totalOrders}
        totalUnitsSold={totalUnitsSold}
        avgOrderValue={avgOrderValue / 100}
        activeListings={(listings ?? []).filter(l => l.status === 'available' || l.status === 'active').length}
        totalPaidOut={totalPaidOut / 100}
        totalFees={totalFees / 100}
      />

      {/* Revenue Chart + Pool Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="text-lg font-medium mb-4">Revenue Overview (Last 6 Months)</h2>
          <RevenueChart data={monthlyRevenue} />
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <h2 className="text-lg font-medium mb-4">Pool Performance</h2>
          <PoolPerformance
            totalPools={totalPools}
            activePools={activePools}
            lockedPools={lockedPools}
            completedPools={completedPools}
            cancelledPools={cancelledPools}
            lockThroughRate={lockThroughRate}
            avgFillRate={avgFillRate}
          />
        </div>
      </div>

      {/* Top Products */}
      <div className="border rounded-lg p-4 bg-card">
        <h2 className="text-lg font-medium mb-4">Top Products</h2>
        <TopProducts products={topProducts} />
      </div>
    </div>
  )
}
