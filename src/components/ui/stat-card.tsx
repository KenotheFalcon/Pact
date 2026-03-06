'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface StatCardProps {
  /** The main value to display */
  value: string | number
  /** Label describing the stat */
  label: string
  /** Optional icon */
  icon?: LucideIcon
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral'
  /** Trend value (e.g., "+12%") */
  trendValue?: string
  /** Additional className */
  className?: string
  /** Whether to animate the value on mount */
  animated?: boolean
  /** Loading state */
  loading?: boolean
}

export function StatCard({
  value,
  label,
  icon: Icon,
  trend,
  trendValue,
  className,
  animated = true,
  loading = false,
}: StatCardProps) {
  const prefersReducedMotion = useReducedMotion()

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'

  if (loading) {
    return (
      <div className={cn(
        "rounded-2xl border border-border bg-card p-5 md:p-6",
        className
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-10 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 md:p-6 transition-all duration-200 hover:shadow-card",
        className
      )}
      initial={animated && !prefersReducedMotion ? { opacity: 0, y: 10 } : undefined}
      animate={animated && !prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <motion.p
            className="font-heading text-2xl md:text-3xl font-bold tabular-nums"
            initial={animated && !prefersReducedMotion ? { opacity: 0, y: 5 } : undefined}
            animate={animated && !prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {value}
          </motion.p>
          {trend && trendValue && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pact-green/10 text-pact-green">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export interface StatGridProps {
  children: React.ReactNode
  className?: string
  columns?: 2 | 3 | 4
}

export function StatGrid({ children, className, columns = 4 }: StatGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn("grid gap-4 md:gap-6", gridCols[columns], className)}>
      {children}
    </div>
  )
}
