'use client'

import { useMemo } from 'react'

interface ChartDataPoint {
  month: string
  amount: number
}

interface PayoutChartProps {
  data: ChartDataPoint[]
}

export function PayoutChart({ data }: PayoutChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    // Convert kobo to naira
    return data.map(d => ({
      month: d.month,
      amount: d.amount / 100,
    }))
  }, [data])

  const maxAmount = useMemo(() => {
    if (chartData.length === 0) return 1000
    return Math.max(...chartData.map(d => d.amount), 1000)
  }, [chartData])

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(0)}K`
    }
    return `₦${amount.toFixed(0)}`
  }

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        No earnings data yet
      </div>
    )
  }

  return (
    <div className="h-48">
      {/* Simple bar chart using CSS */}
      <div className="flex items-end justify-between h-full gap-2 pb-6 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(maxAmount)}</span>
          <span>{formatCurrency(maxAmount / 2)}</span>
          <span>₦0</span>
        </div>

        {/* Bars */}
        <div className="flex items-end justify-between h-full flex-1 ml-14 gap-1">
          {chartData.map((item, index) => {
            const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-pact-green/80 hover:bg-pact-green rounded-t transition-all relative group min-h-[4px]"
                  style={{ height: `${Math.max(height, 2)}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground truncate w-full text-center">
                  {item.month.split(' ')[0]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
