'use client'

import * as React from 'react'
import { useFormStatus } from 'react-dom'

import { LoadingButton, type LoadingButtonProps } from '@/components/ui/loading-button'

export interface SubmitButtonProps extends Omit<LoadingButtonProps, 'loading'> {
  /** Text to show while loading (defaults to children) */
  loadingText?: string
}

/**
 * A submit button that automatically handles the loading state
 * using Next.js useFormStatus hook. Must be used within a form.
 */
export const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ children, loadingText, ...props }, ref) => {
    const { pending } = useFormStatus()

    return (
      <LoadingButton
        ref={ref}
        type="submit"
        loading={pending}
        loadingText={loadingText}
        {...props}
      >
        {children}
      </LoadingButton>
    )
  }
)

SubmitButton.displayName = 'SubmitButton'
