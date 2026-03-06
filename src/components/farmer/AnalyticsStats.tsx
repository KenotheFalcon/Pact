'use client'

import { TrendingUp, DollarSign, ShoppingCart, Package, Layers, Wallet, Receipt } from 'lucide-react'

interface AnalyticsStatsProps {
  totalRevenue: number
  totalOrders: number
  totalUnitsSold: number
  avgOrderValue: number
  activeListings: number
  totalPaidOut: number
  totalFees: number
}

export function AnalyticsStats({
  totalRevenue,
  totalOrders,
  totalUnitsSold,
  avgOrderValue,
  activeListings,
  totalPaidOut,
  totalFees,
}: AnalyticsStatsProps) {
  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`

  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      iconColor: 'text-pact-green',
      subtitle: `${totalOrders} total orders`,
    },
    {
      label: 'Avg Order Value',
      value: formatCurrency(avgOrderValue),
      icon: TrendingUp,
      iconColor: 'text-blue-500',
      subtitle: `${totalUnitsSold} units sold`,
    },
    {
      label: 'Total Paid Out',
      value: formatCurrency(totalPaidOut),
      icon: Wallet,
      iconColor: 'text-emerald-500',
      subtitle: `₦${totalFees.toLocaleString()} in fees`,
    },
    {
      label: 'Active Listings',
      value: activeListings.toString(),
      icon: Package,
      iconColor: 'text-pact-orange',
      subtitle: 'Currently available',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{stat.value}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {stat.subtitle}
          </div>
        </div>
      ))}
    </div>
  )
}
