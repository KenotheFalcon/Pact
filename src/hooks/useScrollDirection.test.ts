import { renderHook, act } from '@testing-library/react'
import { useScrollDirection, useAtTop } from './useScrollDirection'

describe('useScrollDirection', () => {
  let scrollY = 0
  let rafCallbacks: FrameRequestCallback[] = []

  beforeEach(() => {
    scrollY = 0
    rafCallbacks = []
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      get: () => scrollY,
      configurable: true,
    })

    // Mock requestAnimationFrame to capture callbacks
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb)
      return 1
    })
  })

  const flushRaf = () => {
    rafCallbacks.forEach(cb => cb(0))
    rafCallbacks = []
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns null by default', () => {
    const { result } = renderHook(() => useScrollDirection())
    expect(result.current).toBe(null)
  })

  it('returns initialDirection if provided', () => {
    const { result } = renderHook(() => useScrollDirection({ initialDirection: 'up' }))
    expect(result.current).toBe('up')
  })

  it('updates direction to down when scrolling down past threshold', () => {
    const { result } = renderHook(() => useScrollDirection({ threshold: 10 }))

    act(() => {
      scrollY = 20
      window.dispatchEvent(new Event('scroll'))
      flushRaf()
    })

    expect(result.current).toBe('down')
  })

  it('does not update direction if scroll difference is less than threshold', () => {
    const { result } = renderHook(() => useScrollDirection({ threshold: 50 }))

    act(() => {
      scrollY = 20
      window.dispatchEvent(new Event('scroll'))
      flushRaf()
    })

    // Still null because threshold is 50
    expect(result.current).toBe(null)
  })

  it('updates direction to up when scrolling up', () => {
    const { result } = renderHook(() => useScrollDirection({ threshold: 10 }))

    // First scroll down
    act(() => {
      scrollY = 100
      window.dispatchEvent(new Event('scroll'))
      flushRaf()
    })
    expect(result.current).toBe('down')

    // Then scroll up
    act(() => {
      scrollY = 50
      window.dispatchEvent(new Event('scroll'))
      flushRaf()
    })
    expect(result.current).toBe('up')
  })

  it('removes scroll event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useScrollDirection())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})

describe('useAtTop', () => {
  let scrollY = 0

  beforeEach(() => {
    scrollY = 0
    Object.defineProperty(window, 'scrollY', {
      get: () => scrollY,
      configurable: true,
    })
  })

  it('returns true initially if at top', () => {
    const { result } = renderHook(() => useAtTop())
    expect(result.current).toBe(true)
  })

  it('returns false initially if not at top (past offset)', () => {
    scrollY = 50
    const { result } = renderHook(() => useAtTop(10))
    expect(result.current).toBe(false)
  })

  it('updates to false when scrolling past offset', () => {
    const { result } = renderHook(() => useAtTop(20))

    act(() => {
      scrollY = 30
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current).toBe(false)
  })

  it('updates back to true when scrolling back to top', () => {
    scrollY = 50
    const { result } = renderHook(() => useAtTop(20))

    // Ensure initially false
    expect(result.current).toBe(false)

    act(() => {
      scrollY = 10
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current).toBe(true)
  })

  it('removes scroll event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useAtTop())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})
