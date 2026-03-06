'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ZodType, ZodError } from 'zod'

interface UseFieldValidationOptions<T> {
  /** Zod schema to validate against */
  schema: ZodType<T>
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number
  /** Only start validating after first blur (default: false) */
  validateOnBlur?: boolean
}

interface UseFieldValidationResult {
  /** Whether the current value is valid */
  isValid: boolean
  /** Error message if invalid, null otherwise */
  error: string | null
  /** Whether validation is currently in progress (debouncing) */
  isValidating: boolean
  /** Mark field as touched (triggers validation) */
  touch: () => void
  /** Whether the field has been touched */
  isTouched: boolean
  /** Reset validation state */
  reset: () => void
}

/**
 * Hook for real-time debounced Zod validation
 * 
 * @example
 * const emailSchema = z.string().email('Invalid email address')
 * const { isValid, error, isValidating } = useFieldValidation(email, { schema: emailSchema })
 */
export function useFieldValidation<T>(
  value: T,
  options: UseFieldValidationOptions<T>
): UseFieldValidationResult {
  const { schema, debounceMs = 300, validateOnBlur = false } = options

  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isTouched, setIsTouched] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialValueRef = useRef(value)
  const hasChangedRef = useRef(false)

  // Track if value has changed from initial
  useEffect(() => {
    if (value !== initialValueRef.current) {
      hasChangedRef.current = true
    }
  }, [value])

  // Touch handler for blur events
  const touch = useCallback(() => {
    setIsTouched(true)
  }, [])

  // Reset handler
  const reset = useCallback(() => {
    setIsValid(false)
    setError(null)
    setIsValidating(false)
    setIsTouched(false)
    hasChangedRef.current = false
    initialValueRef.current = value
  }, [value])

  // Debounced validation
  useEffect(() => {
    // Don't validate if using blur mode and not yet touched
    if (validateOnBlur && !isTouched) {
      return
    }

    // Don't show errors if value hasn't changed yet
    if (!hasChangedRef.current && !isTouched) {
      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Mark as validating
    setIsValidating(true)

    // Debounce validation
    timeoutRef.current = setTimeout(() => {
      try {
        schema.parse(value)
        setIsValid(true)
        setError(null)
      } catch (err) {
        setIsValid(false)
        if (err && typeof err === 'object' && 'errors' in err) {
          const zodError = err as ZodError
          setError(zodError.errors[0]?.message ?? 'Invalid value')
        } else {
          setError('Invalid value')
        }
      } finally {
        setIsValidating(false)
      }
    }, debounceMs)

    // Cleanup on unmount or value change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, schema, debounceMs, validateOnBlur, isTouched])

  return {
    isValid,
    error,
    isValidating,
    touch,
    isTouched,
    reset
  }
}
