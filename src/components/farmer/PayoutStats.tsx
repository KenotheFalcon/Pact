'use client'

import { TrendingUp, TrendingDown, Wallet, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface PayoutStatsProps {
  totalEarned: number
  pendingAmount: number
  thisMonthEarned: number
  lastMonthEarned: number
  completedCount: number
  pendingCount: number
}

export function PayoutStats({
  totalEarned,
  pendingAmount,
  thisMonthEarned,
  lastMonthEarned,
  completedCount,
  pendingCount,
}: PayoutStatsProps) {
  const monthlyChange = lastMonthEarned > 0 
    ? ((thisMonthEarned - lastMonthEarned) / lastMonthEarned) * 100 
    : thisMonthEarned > 0 ? 100 : 0

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Earned */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total Earned</span>
          <Wallet className="h-4 w-4 text-pact-green" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold">{formatCurrency(totalEarned)}</span>
        </div>
        <div className="mt-1 flex items-center text-xs text-muted-foreground">
          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
          {completedCount} completed payouts
        </div>
      </div>

      {/* Pending Amount */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Pending</span>
          <Clock className="h-4 w-4 text-pact-orange" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold">{formatCurrency(pendingAmount)}</span>
        </div>
        <div className="mt-1 flex items-center text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3 mr-1 text-yellow-500" />
          {pendingCount} pending payouts
        </div>
      </div>

      {/* This Month */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">This Month</span>
          {monthlyChange >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold">{formatCurrency(thisMonthEarned)}</span>
        </div>
        <div className={`mt-1 text-xs ${monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(1)}% from last month
        </div>
      </div>

      {/* Last Month */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Last Month</span>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold">{formatCurrency(lastMonthEarned)}</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Previous month earnings
        </div>
      </div>
    </div>
  )
}
