'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { SearchX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { LucideIcon } from 'lucide-react'

export interface EmptyStateProps {
  /** Icon to display (defaults to SearchX) */
  icon?: LucideIcon
  /** Main title text */
  title: string
  /** Description text below the title */
  description?: string
  /** Action button configuration */
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  }
  /** Additional className for the container */
  className?: string
  /** Whether to use compact styling (less padding) */
  compact?: boolean
  /** Disable entrance animation */
  disableAnimation?: boolean
}

/**
 * Generic empty state component
 * Used when lists, tables, or search results are empty
 */
export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  className,
  compact = false,
  disableAnimation = false,
}: EmptyStateProps) {
  const Container = disableAnimation ? 'div' : motion.div
  const animationProps = disableAnimation
    ? {}
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
      }

  return (
    <Container
      {...animationProps}
      className={cn(
        'text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800',
        'bg-muted/50 backdrop-blur-sm',
        compact ? 'py-12 px-6' : 'py-24 px-8',
        className
      )}
    >
      <div
        className={cn(
          'bg-muted rounded-full flex items-center justify-center mx-auto shadow-inner',
          compact ? 'w-14 h-14 mb-4' : 'w-20 h-20 mb-6'
        )}
      >
        <Icon
          className={cn(
            'text-muted-foreground',
            compact ? 'w-7 h-7' : 'w-10 h-10'
          )}
        />
      </div>

      <h3
        className={cn(
          'font-bold text-foreground mb-2',
          compact ? 'text-lg' : 'text-xl'
        )}
      >
        {title}
      </h3>

      {description && (
        <p className="text-muted-foreground max-w-md mx-auto text-sm">
          {description}
        </p>
      )}

      {action && (
        <Button
          variant={action.variant || 'outline'}
          className="mt-6 rounded-full"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </Container>
  )
}

/**
 * Empty state for table rows
 * Use inside a <tbody> when the table has no data
 */
export interface TableEmptyRowProps {
  /** Number of columns to span */
  colSpan: number
  /** Message to display */
  message?: string
  /** Additional className */
  className?: string
}

export function TableEmptyRow({
  colSpan,
  message = 'No data found',
  className,
}: TableEmptyRowProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn(
          'px-4 py-12 text-center text-muted-foreground',
          className
        )}
      >
        {message}
      </td>
    </tr>
  )
}
