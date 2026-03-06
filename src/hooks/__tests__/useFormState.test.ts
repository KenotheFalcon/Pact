import { renderHook, act } from '@testing-library/react'
import { useFormState, useAsyncSubmit } from '../useFormState'
import { ChangeEvent } from 'react'

describe('useFormState', () => {
  it('should initialize with correct state', () => {
    const initialState = { name: '', age: 0 }
    const { result } = renderHook(() => useFormState(initialState))

    expect(result.current.formData).toEqual(initialState)
    expect(result.current.isDirty).toBe(false)
  })

  it('should update field value on change event', () => {
    const { result } = renderHook(() => useFormState({ name: '' }))

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John', type: 'text' },
      } as ChangeEvent<HTMLInputElement>)
    })

    expect(result.current.formData.name).toBe('John')
    expect(result.current.isDirty).toBe(true)
  })

  it('should update field value using setField', () => {
    const { result } = renderHook(() => useFormState({ name: '' }))

    act(() => {
      result.current.setField('name', 'Jane')
    })

    expect(result.current.formData.name).toBe('Jane')
    expect(result.current.isDirty).toBe(true)
  })

  it('should handle checkbox change event correctly', () => {
    const { result } = renderHook(() => useFormState({ acceptTerms: false }))

    act(() => {
      result.current.handleChange({
        target: { name: 'acceptTerms', checked: true, type: 'checkbox' },
      } as ChangeEvent<HTMLInputElement>)
    })

    expect(result.current.formData.acceptTerms).toBe(true)
    expect(result.current.isDirty).toBe(true)
  })

  it('should reset to initial state', () => {
    const { result } = renderHook(() => useFormState({ name: '' }))

    act(() => {
      result.current.setField('name', 'John')
    })

    expect(result.current.formData.name).toBe('John')
    expect(result.current.isDirty).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.formData.name).toBe('')
    expect(result.current.isDirty).toBe(false)
  })
})

describe('useAsyncSubmit', () => {
  it('should handle successful async submission', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAsyncSubmit(mockOnSubmit))

    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBeNull()

    await act(async () => {
      await result.current.submit({ test: 'data' })
    })

    expect(mockOnSubmit).toHaveBeenCalledWith({ test: 'data' })
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle failed async submission with Error object', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Test error'))
    const { result } = renderHook(() => useAsyncSubmit(mockOnSubmit))

    await act(async () => {
      await result.current.submit({ test: 'data' })
    })

    expect(mockOnSubmit).toHaveBeenCalledWith({ test: 'data' })
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBe('Test error')
  })

  it('should handle failed async submission with unknown error', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue('String error')
    const { result } = renderHook(() => useAsyncSubmit(mockOnSubmit))

    await act(async () => {
      await result.current.submit({ test: 'data' })
    })

    expect(mockOnSubmit).toHaveBeenCalledWith({ test: 'data' })
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBe('An error occurred')
  })

  it('should clear error correctly', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Test error'))
    const { result } = renderHook(() => useAsyncSubmit(mockOnSubmit))

    await act(async () => {
      await result.current.submit({ test: 'data' })
    })

    expect(result.current.error).toBe('Test error')

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})
