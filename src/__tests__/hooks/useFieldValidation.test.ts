import { renderHook, act } from '@testing-library/react'
import { useFieldValidation, ValidationRule } from '@/hooks/useFieldValidation'

describe('useFieldValidation', () => {
  const rules: ValidationRule<string>[] = [
    {
      validate: (val) => val.length > 0,
      message: 'Required',
    },
    {
      validate: (val) => val.includes('@'),
      message: 'Invalid email address',
    },
  ]

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useFieldValidation('', rules)
    )

    expect(result.current.isValid).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isValidating).toBe(false)
    expect(result.current.isTouched).toBe(false)
  })

  it('should validate and set error when value is invalid', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useFieldValidation(value, rules),
      { initialProps: { value: '' } }
    )

    rerender({ value: 'invalid-email' })

    expect(result.current.isValidating).toBe(true)

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(result.current.isValidating).toBe(false)
    expect(result.current.isValid).toBe(false)
    expect(result.current.error).toBe('Invalid email address')
  })

  it('should validate and clear error when value is valid', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useFieldValidation(value, rules),
      { initialProps: { value: '' } }
    )

    // First make it invalid
    rerender({ value: 'invalid' })
    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current.isValid).toBe(false)

    // Then make it valid
    rerender({ value: 'test@example.com' })
    expect(result.current.isValidating).toBe(true)

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(result.current.isValidating).toBe(false)
    expect(result.current.isValid).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should use custom delay time', async () => {
    const { result, rerender } = renderHook(
      ({ value }) =>
        useFieldValidation(value, rules, { delayMs: 500 }),
      { initialProps: { value: '' } }
    )

    rerender({ value: 'test@example.com' })

    act(() => {
      jest.advanceTimersByTime(300) // Default 300ms shouldn't trigger
    })

    expect(result.current.isValidating).toBe(true)

    act(() => {
      jest.advanceTimersByTime(200) // Total 500ms
    })

    expect(result.current.isValidating).toBe(false)
    expect(result.current.isValid).toBe(true)
  })

  it('should not validate on initial render if validateOnChange is false', () => {
    const { result, rerender } = renderHook(
      ({ value }) =>
        useFieldValidation(value, rules, { validateOnChange: false }),
      { initialProps: { value: '' } }
    )

    rerender({ value: 'invalid-email' })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    // Should not have validated yet
    expect(result.current.isValid).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should validate after touch when validateOnChange is false', () => {
    const { result, rerender } = renderHook(
      ({ value }) =>
        useFieldValidation(value, rules, { validateOnChange: false }),
      { initialProps: { value: '' } }
    )

    rerender({ value: 'invalid-email' })

    act(() => {
      result.current.touch()
    })

    expect(result.current.isTouched).toBe(true)

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(result.current.isValid).toBe(false)
    expect(result.current.error).toBe('Invalid email address')
  })

  it('should reset state correctly', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useFieldValidation(value, rules),
      { initialProps: { value: '' } }
    )

    // Trigger an error
    rerender({ value: 'invalid' })
    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(result.current.error).toBe('Invalid email address')

    // Touch the field
    act(() => {
      result.current.touch()
    })
    expect(result.current.isTouched).toBe(true)

    // Reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.isValid).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isValidating).toBe(false)
    expect(result.current.isTouched).toBe(false)
  })

  it('should handle general validation errors', () => {
    const failingRules: ValidationRule<string>[] = [
      {
        validate: () => { throw new Error('Something went wrong') },
        message: 'This will not be shown',
      }
    ]

    const { result, rerender } = renderHook(
      ({ value }) => useFieldValidation(value, failingRules),
      { initialProps: { value: '' } }
    )

    rerender({ value: 'invalid' })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(result.current.isValid).toBe(false)
    expect(result.current.error).toBe('Validation error')
  })
})
