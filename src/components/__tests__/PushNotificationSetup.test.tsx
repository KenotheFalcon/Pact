import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PushNotificationSetup } from '../PushNotificationSetup'
import { toast } from 'sonner'

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('PushNotificationSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mocks for a successful flow
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: jest.fn().mockResolvedValue(null),
            subscribe: jest.fn().mockResolvedValue({
              toJSON: () => ({
                endpoint: 'https://push.example.com',
                keys: {
                  p256dh: 'test-p256dh',
                  auth: 'test-auth'
                }
              })
            })
          }
        })
      },
      writable: true,
      configurable: true
    })

    Object.defineProperty(window, 'PushManager', {
      value: jest.fn(),
      writable: true,
      configurable: true
    })

    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: jest.fn().mockResolvedValue('granted')
      },
      writable: true,
      configurable: true
    })

    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === '/api/notifications/subscribe') {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: { vapidPublicKey: 'BA1234' } // mock base64
          })
        })
      }
      return Promise.reject(new Error('not mocked'))
    })
  })

  it('renders nothing while loading', async () => {
    // Initial state is 'loading'
    const { container } = render(<PushNotificationSetup />)
    expect(container).toBeEmptyDOMElement()
    await waitFor(() => {
        expect(screen.getByText('Enable notifications')).toBeInTheDocument()
    })
  })

  it('renders button to enable notifications when not subscribed', async () => {
    render(<PushNotificationSetup />)

    // Wait for the checkSubscription effect to finish
    await waitFor(() => {
      expect(screen.getByText('Enable notifications')).toBeInTheDocument()
    })
  })

  it('handles user denying permissions', async () => {
    render(<PushNotificationSetup />)

    // Wait for checkSubscription
    await waitFor(() => {
      expect(screen.getByText('Enable notifications')).toBeInTheDocument()
    })

    // Override requestPermission before clicking
    window.Notification.requestPermission = jest.fn().mockResolvedValue('denied')

    // Click enable button
    const enableBtn = screen.getByRole('button', { name: 'Enable' })
    fireEvent.click(enableBtn)

    // Verify error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Notification permission denied. You can re-enable in browser settings.')
    })

    // Check that state updated to denied UI
    await waitFor(() => {
      expect(screen.getByText('Notifications are blocked. Enable them in your browser settings.')).toBeInTheDocument()
    })
  })
})
