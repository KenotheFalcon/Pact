'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface UseFieldValidationResult {
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
 * Hook for real-time debounced rule-based validation
 * 
 * @example
 * const rules = [{ validate: (v) => v.length > 0, message: "Required" }]
 * const { isValid, error, isValidating } = useFieldValidation(email, rules)
 */
export function useFieldValidation<T>(
  value: T,
  rules: ValidationRule<T>[],
  options: { validateOnChange?: boolean; delayMs?: number } = {}
): UseFieldValidationResult {
  const { validateOnChange = true, delayMs = 300 } = options

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

  const touch = useCallback(() => {
    setIsTouched(true)
  }, [])

  const reset = useCallback(() => {
    setIsValid(false)
    setError(null)
    setIsValidating(false)
    setIsTouched(false)
    hasChangedRef.current = false
    initialValueRef.current = value
  }, [value])

  useEffect(() => {
    if (!validateOnChange && !isTouched) {
      return
    }

    if (!hasChangedRef.current && !isTouched) {
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsValidating(true)

    timeoutRef.current = setTimeout(() => {
      try {
        let firstError: string | null = null;
        for (const rule of rules) {
          if (!rule.validate(value)) {
            firstError = rule.message;
            break;
          }
        }

        if (firstError) {
          setIsValid(false)
          setError(firstError)
        } else {
          setIsValid(true)
          setError(null)
        }
      } catch (err) {
         setIsValid(false)
         setError("Validation error")
      } finally {
        setIsValidating(false)
      }
    }, delayMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, rules, delayMs, validateOnChange, isTouched])

  return {
    isValid,
    error,
    isValidating,
    touch,
    isTouched,
    reset
  }
}
