import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from '../useReducedMotion'

describe('useReducedMotion', () => {
  const originalMatchMedia = window.matchMedia
  let mockMatchMedia: jest.Mock
  let addEventListenerMock: jest.Mock
  let removeEventListenerMock: jest.Mock

  beforeEach(() => {
    addEventListenerMock = jest.fn()
    removeEventListenerMock = jest.fn()

    mockMatchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: jest.fn(),
    }))

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    })
    jest.clearAllMocks()
  })

  it('should return true when user prefers reduced motion', () => {
    mockMatchMedia.mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(true)
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('should return false when user does not prefer reduced motion', () => {
    mockMatchMedia.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(false)
  })

  it('should update state when preference changes', () => {
    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(false)

    // Simulate change event
    const changeEvent = { matches: true } as MediaQueryListEvent
    act(() => {
      const callback = addEventListenerMock.mock.calls[0][1]
      callback(changeEvent)
    })

    expect(result.current).toBe(true)
  })

  it('should clean up event listener on unmount', () => {
    const { unmount } = renderHook(() => useReducedMotion())

    expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function))

    unmount()

    expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function))

    // Ensure the same function reference was used for add and remove
    const addCallback = addEventListenerMock.mock.calls[0][1]
    const removeCallback = removeEventListenerMock.mock.calls[0][1]
    expect(addCallback).toBe(removeCallback)
  })

  describe('SSR behavior', () => {
    const originalWindow = global.window

    beforeEach(() => {
      // We can't actually delete window in jsdom without breaking React,
      // but we can test the hook's initial state since the hook runs
      // `useState(true)` initially before the effect.
    })

    afterEach(() => {
      global.window = originalWindow
    })

    it('should default to false as initial state', () => {
      // Temporarily mock matchMedia to not match to ensure initial state
      // before the effect runs.
      mockMatchMedia.mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        dispatchEvent: jest.fn(),
      }))

      let initialRenderValue: boolean | undefined = undefined
      let renderCount = 0

      const { result } = renderHook(() => {
        const val = useReducedMotion()
        if (renderCount === 0) {
          initialRenderValue = val
        }
        renderCount++
        return val
      })

      expect(initialRenderValue).toBe(false)
      expect(result.current).toBe(true) // Updates to true after effect
    })

    it('should gracefully handle missing window.matchMedia', () => {
      // @ts-expect-error - simulating environment without matchMedia
      delete window.matchMedia

      // Should not throw and should default to false
      const { result } = renderHook(() => useReducedMotion())
      expect(result.current).toBe(false)
    })
  })
})
