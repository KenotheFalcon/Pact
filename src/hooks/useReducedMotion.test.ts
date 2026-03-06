import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from './useReducedMotion'

describe('useReducedMotion', () => {
  let originalMatchMedia: typeof window.matchMedia
  let originalWindow: any

  beforeAll(() => {
    // Setup a fake window object if it doesn't exist
    if (typeof window === 'undefined') {
      global.window = {} as any
    }
    originalMatchMedia = global.window.matchMedia
    originalWindow = global.window
  })

  afterAll(() => {
    if (originalMatchMedia !== undefined) {
      global.window.matchMedia = originalMatchMedia
    }
  })

  beforeEach(() => {
    // Reset matchMedia before each test
    global.window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
    // Restore window if it was deleted
    if (typeof global.window === 'undefined') {
      global.window = originalWindow
    }
  })

  it('should return false by default (before hydration)', () => {
    // Mock window to undefined locally during render to simulate SSR
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    let result: any;

    try {
      // renderHook uses ReactDOM which assumes window exists in jsdom.
      // We'll test the hook directly instead for the SSR case.

      const React = require('react');
      // Mock useState to just return the initial state and a dummy setter
      jest.spyOn(React, 'useState').mockImplementation((initial: any) => [initial, jest.fn()]);
      // Mock useEffect to do nothing for SSR
      jest.spyOn(React, 'useEffect').mockImplementation(() => {});

      result = useReducedMotion();
    } finally {
      // @ts-ignore
      global.window = originalWindow;
      jest.restoreAllMocks();
    }

    // Default state is false as defined in useState(false)
    expect(result).toBe(false)
  })

  it('should return true if prefers-reduced-motion matches', () => {
    global.window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
    expect(global.window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('should return false if prefers-reduced-motion does not match', () => {
    global.window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('should update value when change event is fired', () => {
    let changeListener: ((event: any) => void) | null = null

    global.window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event, callback) => {
        if (event === 'change') {
          changeListener = callback
        }
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useReducedMotion())

    // Initially false
    expect(result.current).toBe(false)

    // Simulate change event
    act(() => {
      if (changeListener) {
        changeListener({ matches: true } as MediaQueryListEvent)
      }
    })

    // Now it should be true
    expect(result.current).toBe(true)
  })

  it('should clean up event listener on unmount', () => {
    const removeEventListenerMock = jest.fn()

    global.window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: removeEventListenerMock,
      dispatchEvent: jest.fn(),
    }))

    const { unmount } = renderHook(() => useReducedMotion())

    unmount()

    expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
