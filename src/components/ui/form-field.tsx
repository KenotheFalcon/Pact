'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Loader2 } from 'lucide-react'
import { z, type ZodType } from 'zod'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SuccessCheck } from '@/components/ui/success-check'
import { useFieldValidation, type ValidationRule } from '@/hooks/useFieldValidation'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label */
  label: string
  /** Unique field name */
  name: string
  /** Zod schema for validation */
  schema?: ZodType<string>
  /** Optional helper text below input */
  helperText?: string
  /** External error (e.g., from server) */
  externalError?: string
  /** Icon to display in input (left side) */
  icon?: React.ReactNode
  /** Validation debounce in ms (default: 300) */
  debounceMs?: number
  /** Whether to show validation on blur only */
  validateOnBlur?: boolean
  /** Callback when validation state changes */
  onValidationChange?: (isValid: boolean) => void
}

/**
 * Enhanced form field with integrated validation, icons, and feedback
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      name,
      schema,
      helperText,
      externalError,
      icon,
      debounceMs = 300,
      validateOnBlur = false,
      onValidationChange,
      className,
      value,
      onChange,
      onBlur,
      required,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion()
    const [internalValue, setInternalValue] = React.useState('')

    // Use controlled or uncontrolled value
    const currentValue = value !== undefined ? String(value) : internalValue

    // Validation hook (only if schema provided)
    const rules: ValidationRule<string>[] = React.useMemo(() => {
      if (!schema) return [];
      let lastError = 'Invalid value';
      return [
        {
          validate: (val: string) => {
            const result = schema.safeParse(val);
            if (!result.success) {
              lastError = result.error.errors[0]?.message || 'Invalid value';
              return false;
            }
            return true;
          },
          get message() {
            return lastError;
          }
        }
      ];
    }, [schema]);

    const validation = useFieldValidation(currentValue, rules, {
      delayMs: debounceMs,
      validateOnChange: !validateOnBlur
    })

    // Notify parent of validation changes
    React.useEffect(() => {
      if (schema && onValidationChange) {
        onValidationChange(validation.isValid)
      }
    }, [validation.isValid, onValidationChange, schema])

    // Determine display error (external takes priority)
    const displayError = externalError ?? (validation.isTouched ? validation.error : null)
    const showSuccess = schema && validation.isValid && validation.isTouched && !displayError
    const showValidating = schema && validation.isValidating

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      validation.touch()
      onBlur?.(e)
    }

    const inputId = `field-${name}`
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    return (
      <div className={cn('space-y-2', className)}>
        {/* Label */}
        <Label
          htmlFor={inputId}
          className={cn(
            'flex items-center gap-1',
            displayError && 'text-destructive'
          )}
        >
          {label}
          {required && (
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>

        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input */}
          <Input
            ref={ref}
            id={inputId}
            name={name}
            value={currentValue}
            onChange={handleChange}
            onBlur={handleBlur}
            required={required}
            aria-invalid={!!displayError}
            aria-describedby={
              displayError ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              icon && 'pl-10',
              'pr-10', // Space for status indicator
              displayError && 'border-destructive focus-visible:ring-destructive',
              showSuccess && 'border-pact-green focus-visible:ring-pact-green'
            )}
            {...props}
          />

          {/* Right side status indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AnimatePresence mode="wait">
              {showValidating && (
                <motion.div
                  key="validating"
                  initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </motion.div>
              )}
              {showSuccess && !showValidating && (
                <motion.div
                  key="success"
                  initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <SuccessCheck size={18} />
                </motion.div>
              )}
              {displayError && !showValidating && (
                <motion.div
                  key="error"
                  initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Error or helper text */}
        <AnimatePresence mode="wait">
          {displayError ? (
            <motion.p
              key="error"
              id={errorId}
              role="alert"
              className="text-sm text-destructive flex items-center gap-1"
              initial={prefersReducedMotion ? {} : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {displayError}
            </motion.p>
          ) : helperText ? (
            <p id={helperId} className="text-sm text-muted-foreground">
              {helperText}
            </p>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)

FormField.displayName = 'FormField'
