import { render, screen, fireEvent, act } from '@testing-library/react'
import { AddToHomeScreenPrompt } from '@/components/AddToHomeScreenPrompt'

const mockMatchMedia = jest.fn()

const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('AddToHomeScreenPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.clear()

    mockMatchMedia.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should not render initially', () => {
    render(<AddToHomeScreenPrompt />)
    expect(screen.queryByText('Install Pact')).not.toBeInTheDocument()
  })

  it('should not render if already installed', () => {
    mockMatchMedia.mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    render(<AddToHomeScreenPrompt />)

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'))
    })

    expect(screen.queryByText('Install Pact')).not.toBeInTheDocument()
  })

  it('should not render if dismissed recently', () => {
    // Current mock date is 2024-01-15T12:00:00Z
    // Set dismissal to 10 days ago
    mockLocalStorage.setItem('pact-a2hs-dismissed', '2024-01-05T12:00:00Z')

    render(<AddToHomeScreenPrompt />)

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'))
    })

    expect(screen.queryByText('Install Pact')).not.toBeInTheDocument()
  })

  it('should render when beforeinstallprompt is fired and wait', () => {
    jest.useFakeTimers()
    render(<AddToHomeScreenPrompt />)

    act(() => {
      const event = new Event('beforeinstallprompt')
      window.dispatchEvent(event)
    })

    // Wait 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    expect(screen.getByText('Install Pact')).toBeInTheDocument()

    jest.useRealTimers()
  })

  it('should hide when appinstalled is fired', () => {
    jest.useFakeTimers()
    render(<AddToHomeScreenPrompt />)

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'))
    })

    act(() => {
      jest.advanceTimersByTime(3000)
    })

    expect(screen.getByText('Install Pact')).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })

    expect(screen.queryByText('Install Pact')).not.toBeInTheDocument()

    jest.useRealTimers()
  })

  it('should handle dismissal via "Not now" button', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
    render(<AddToHomeScreenPrompt />)

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'))
      jest.advanceTimersByTime(3000)
    })

    const notNowButton = screen.getByText('Not now')

    act(() => {
      fireEvent.click(notNowButton)
    })

    expect(screen.queryByText('Install Pact')).not.toBeInTheDocument()
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'pact-a2hs-dismissed',
      expect.any(String)
    )
    // Verify the date is close to our mocked date
    const setDate = new Date(mockLocalStorage.setItem.mock.calls[0][1])
    expect(setDate.getTime()).toBeCloseTo(new Date('2024-01-15T12:00:00.000Z').getTime(), -4) // allow 10 seconds diff or so, though mock Date should be exact if it was used for new Date()

    jest.useRealTimers()
  })

  it('should handle install acceptance', async () => {
    jest.useFakeTimers()
    render(<AddToHomeScreenPrompt />)

    const mockPrompt = jest.fn()
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' })

    act(() => {
      const event = new Event('beforeinstallprompt') as any
      event.prompt = mockPrompt
      event.userChoice = mockUserChoice
      window.dispatchEvent(event)
      jest.advanceTimersByTime(3000)
    })

    const installButton = screen.getByText('Install')

    await act(async () => {
      fireEvent.click(installButton)
    })

    expect(mockPrompt).toHaveBeenCalled()
    expect(screen.queryByText('Install Pact')).not.toBeInTheDocument()

    jest.useRealTimers()
  })

  it('should handle install dismissal (user cancels)', async () => {
    jest.useFakeTimers()
    render(<AddToHomeScreenPrompt />)

    const mockPrompt = jest.fn()
    const mockUserChoice = Promise.resolve({ outcome: 'dismissed' })

    act(() => {
      const event = new Event('beforeinstallprompt') as any
      event.prompt = mockPrompt
      event.userChoice = mockUserChoice
      window.dispatchEvent(event)
      jest.advanceTimersByTime(3000)
    })

    const installButton = screen.getByText('Install')

    await act(async () => {
      fireEvent.click(installButton)
    })

    expect(mockPrompt).toHaveBeenCalled()
    // In finally block, component sets setDeferredPrompt(null)
    // Thus rendering it invisible, as isVisible || !deferredPrompt => return null
    expect(screen.queryByText('Install Pact')).not.toBeInTheDocument()

    jest.useRealTimers()
  })
})
