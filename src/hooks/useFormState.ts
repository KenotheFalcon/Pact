'use client'

import { useState, useCallback } from 'react'

import type { ChangeEvent } from 'react'

type InputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export interface UseFormStateReturn<T> {
  /** Current form data */
  formData: T
  /** Update form data directly */
  setFormData: React.Dispatch<React.SetStateAction<T>>
  /** Handle input change events (works with input, textarea, select) */
  handleChange: (e: ChangeEvent<InputElement>) => void
  /** Update a specific field value */
  setField: <K extends keyof T>(field: K, value: T[K]) => void
  /** Reset form to initial state */
  reset: () => void
  /** Check if form has been modified from initial state */
  isDirty: boolean
}

/**
 * Hook for managing form state with common utilities
 * 
 * @example
 * ```tsx
 * const { formData, handleChange, reset, isDirty } = useFormState({
 *   name: '',
 *   email: '',
 *   phone: '',
 * })
 * 
 * return (
 *   <form>
 *     <input name="name" value={formData.name} onChange={handleChange} />
 *     <input name="email" value={formData.email} onChange={handleChange} />
 *     <button type="button" onClick={reset} disabled={!isDirty}>Reset</button>
 *   </form>
 * )
 * ```
 */
export function useFormState<T extends Record<string, unknown>>(
  initialState: T
): UseFormStateReturn<T> {
  const [formData, setFormData] = useState<T>(initialState)
  const [initialSnapshot] = useState<T>(initialState)

  const handleChange = useCallback((e: ChangeEvent<InputElement>) => {
    const { name, value, type } = e.target
    
    // Handle checkbox inputs
    const inputValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value

    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }))
  }, [])

  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const reset = useCallback(() => {
    setFormData(initialSnapshot)
  }, [initialSnapshot])

  // Check if current form data differs from initial state
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialSnapshot)

  return {
    formData,
    setFormData,
    handleChange,
    setField,
    reset,
    isDirty,
  }
}

/**
 * Hook for managing async form submission
 * 
 * @example
 * ```tsx
 * const { isSubmitting, error, submit } = useAsyncSubmit(async (data) => {
 *   await api.updateProfile(data)
 * })
 * 
 * const handleSubmit = (e) => {
 *   e.preventDefault()
 *   submit(formData)
 * }
 * ```
 */
export interface UseAsyncSubmitReturn<T> {
  isSubmitting: boolean
  error: string | null
  submit: (data: T) => Promise<void>
  clearError: () => void
}

export function useAsyncSubmit<T>(
  onSubmit: (data: T) => Promise<void>
): UseAsyncSubmitReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (data: T) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      await onSubmit(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [onSubmit])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isSubmitting,
    error,
    submit,
    clearError,
  }
}
