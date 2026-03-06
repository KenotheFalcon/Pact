'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { LucideIcon } from 'lucide-react'

export interface LoadingButtonProps extends ButtonProps {
  /** Whether the button is in a loading state */
  loading?: boolean
  /** Text to show while loading (defaults to children) */
  loadingText?: string
  /** Icon to show when not loading */
  icon?: LucideIcon
  /** Position of the icon (default: 'left') */
  iconPosition?: 'left' | 'right'
}

/**
 * Button with built-in loading state
 * Shows a spinner and optional loading text when loading is true
 * Includes aria-busy for accessibility
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      loading = false,
      loadingText,
      icon: Icon,
      iconPosition = 'left',
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    const iconElement = Icon && !loading && (
      <Icon className={cn('h-4 w-4', iconPosition === 'left' ? 'mr-2' : 'ml-2')} />
    )

    const spinnerElement = loading && (
      <span className="inline-flex animate-pulse-subtle">
        <Loader2
          className={cn(
            'h-4 w-4 animate-spin',
            iconPosition === 'left' ? 'mr-2' : 'ml-2'
          )}
        />
      </span>
    )

    const content = loading && loadingText ? loadingText : children

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        className={cn('min-w-[100px]', className)}
        {...props}
      >
        {iconPosition === 'left' && (spinnerElement || iconElement)}
        {content}
        {iconPosition === 'right' && (spinnerElement || iconElement)}
      </Button>
    )
  }
)

LoadingButton.displayName = 'LoadingButton'

export { LoadingButton }
