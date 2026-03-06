'use client'

import { CheckCircle, Clock, Lock, XCircle, Activity } from 'lucide-react'

interface PoolPerformanceProps {
  totalPools: number
  activePools: number
  lockedPools: number
  completedPools: number
  cancelledPools: number
  lockThroughRate: number
  avgFillRate: number
}

export function PoolPerformance({
  totalPools,
  activePools,
  lockedPools,
  completedPools,
  cancelledPools,
  lockThroughRate,
  avgFillRate,
}: PoolPerformanceProps) {
  if (totalPools === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        No pools created yet. Open a pool to start tracking performance!
      </div>
    )
  }

  const statuses = [
    { label: 'Active', count: activePools, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500' },
    { label: 'Locked', count: lockedPools, icon: Lock, color: 'text-pact-orange', bg: 'bg-pact-orange' },
    { label: 'Completed', count: completedPools, icon: CheckCircle, color: 'text-pact-green', bg: 'bg-pact-green' },
    { label: 'Cancelled', count: cancelledPools, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500' },
  ]

  return (
    <div className="space-y-4">
      {/* Status breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {statuses.map((s) => (
          <div key={s.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <div>
              <div className="text-lg font-bold leading-tight">{s.count}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stacked bar */}
      {totalPools > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Pool Distribution ({totalPools} total)</div>
          <div className="h-3 bg-muted rounded-full overflow-hidden flex">
            {statuses.map((s) => {
              const width = (s.count / totalPools) * 100
              if (width === 0) return null
              return (
                <div
                  key={s.label}
                  className={`h-full ${s.bg} transition-all`}
                  style={{ width: `${width}%` }}
                  title={`${s.label}: ${s.count}`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Rate metrics */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
        <div>
          <div className="text-xs text-muted-foreground">Lock-Through Rate</div>
          <div className="text-xl font-bold">{lockThroughRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Pools reaching min qty</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Avg Fill Rate</div>
          <div className="text-xl font-bold">{avgFillRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Avg quantity pledged</div>
        </div>
      </div>
    </div>
  )
}
