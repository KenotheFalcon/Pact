import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PushNotificationSetup } from '../PushNotificationSetup'
import { toast } from 'sonner'

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('PushNotificationSetup', () => {
  let mockSubscribe: jest.Mock
  let mockGetSubscription: jest.Mock
  let mockRequestPermission: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset fetch
    global.fetch = jest.fn()

    // Setup Notification mock
    mockRequestPermission = jest.fn().mockResolvedValue('granted')
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: mockRequestPermission,
      },
      writable: true,
      configurable: true,
    })

    // Setup PushManager mock for feature detection
    Object.defineProperty(window, 'PushManager', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    })

    // Setup serviceWorker mock
    mockSubscribe = jest.fn()
    mockGetSubscription = jest.fn().mockResolvedValue(null)

    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: mockGetSubscription,
            subscribe: mockSubscribe,
          },
        }),
      },
      writable: true,
      configurable: true,
    })
  })

  it('shows error toast when pushManager.subscribe fails', async () => {
    // 1. Mock fetch for checkSubscription (initial load)
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true }),
      })
    )

    render(<PushNotificationSetup />)

    // Wait for the "Enable" button to appear (which means we are in 'unsubscribed' state)
    const enableButton = await screen.findByRole('button', { name: /enable/i })
    expect(enableButton).toBeInTheDocument()

    // 2. Mock fetch for subscribe() call getting VAPID key
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: { vapidPublicKey: 'dGVzdA==' } // Valid base64
        }),
      })
    )

    // 3. Make subscribe reject
    mockSubscribe.mockRejectedValue(new Error('Subscription failed'))

    // Click enable
    fireEvent.click(enableButton)

    // 4. Verify the correct error handling happens
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to enable notifications')
    })

    // The button should go back to "Enable" and not be disabled
    expect(screen.getByRole('button', { name: /enable/i })).not.toBeDisabled()
  })
})
