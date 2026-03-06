import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AddToHomeScreenPrompt } from './AddToHomeScreenPrompt';

describe('AddToHomeScreenPrompt', () => {
  let originalMatchMedia: any;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Save original matchMedia
    originalMatchMedia = window.matchMedia;

    // Mock matchMedia for all tests to not be standalone
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
    jest.useRealTimers();
  });

  it('renders correctly when beforeinstallprompt is fired', async () => {
    render(<AddToHomeScreenPrompt />);

    const mockPrompt = jest.fn();
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' });

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = mockPrompt;
    event.userChoice = mockUserChoice;

    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByText('Install Pact')).toBeInTheDocument();
  });

  it('handles installation error gracefully when prompt rejects', async () => {
    render(<AddToHomeScreenPrompt />);

    const mockPrompt = jest.fn().mockRejectedValue(new Error('Install failed'));
    // Make userChoice a Promise that never resolves, so we don't get unhandled rejections
    const mockUserChoice = new Promise(() => {});

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = mockPrompt;
    event.userChoice = mockUserChoice;

    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const installButton = screen.getByRole('button', { name: 'Install' });

    // Catch console.error for unhandled rejection in the component
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Click install button
    act(() => {
      fireEvent.click(installButton);
    });

    // Wait for the button state to revert
    await waitFor(() => {
      // It should actually hide the prompt completely when deferredPrompt is set to null
      expect(screen.queryByText('Install Pact')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('handles installation error gracefully when userChoice rejects', async () => {
    render(<AddToHomeScreenPrompt />);

    const mockPrompt = jest.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.reject(new Error('Choice failed'));

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = mockPrompt;
    event.userChoice = mockUserChoice;

    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const installButton = screen.getByRole('button', { name: 'Install' });

    // Catch the unhandled promise rejection to prevent test from failing
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      // Click install button
      act(() => {
        fireEvent.click(installButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Install Pact')).not.toBeInTheDocument();
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it('hides prompt on successful installation', async () => {
    render(<AddToHomeScreenPrompt />);

    const mockPrompt = jest.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' });

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = mockPrompt;
    event.userChoice = mockUserChoice;

    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const installButton = screen.getByRole('button', { name: 'Install' });

    // Click install button
    act(() => {
      fireEvent.click(installButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Install Pact')).not.toBeInTheDocument();
    });
  });

  it('hides prompt if user choice is dismissed', async () => {
    render(<AddToHomeScreenPrompt />);

    const mockPrompt = jest.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'dismissed' });

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = mockPrompt;
    event.userChoice = mockUserChoice;

    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const installButton = screen.getByRole('button', { name: 'Install' });

    // Click install button
    act(() => {
      fireEvent.click(installButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Install Pact')).not.toBeInTheDocument();
    });
  });

  it('hides prompt if user dismisses the prompt manually', async () => {
    render(<AddToHomeScreenPrompt />);

    const mockPrompt = jest.fn();
    const mockUserChoice = new Promise(() => {});

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = mockPrompt;
    event.userChoice = mockUserChoice;

    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const dismissButton = screen.getByRole('button', { name: 'Not now' });

    // Click dismiss button
    act(() => {
      fireEvent.click(dismissButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Install Pact')).not.toBeInTheDocument();
      // Should save to local storage
      expect(localStorage.getItem('pact-a2hs-dismissed')).toBeTruthy();
    });
  });

  it('does not show prompt if previously dismissed within 30 days', async () => {
    // Set dismissed date to 10 days ago
    const dismissedDate = new Date();
    dismissedDate.setDate(dismissedDate.getDate() - 10);
    localStorage.setItem('pact-a2hs-dismissed', dismissedDate.toISOString());

    render(<AddToHomeScreenPrompt />);

    const mockPrompt = jest.fn();
    const mockUserChoice = new Promise(() => {});

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = mockPrompt;
    event.userChoice = mockUserChoice;

    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Install Pact')).not.toBeInTheDocument();
  });

  it('shows prompt if previously dismissed more than 30 days ago', async () => {
    // Set dismissed date to 40 days ago
    const dismissedDate = new Date();
    dismissedDate.setDate(dismissedDate.getDate() - 40);
    localStorage.setItem('pact-a2hs-dismissed', dismissedDate.toISOString());

    render(<AddToHomeScreenPrompt />);

    const mockPrompt = jest.fn();
    const mockUserChoice = new Promise(() => {});

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = mockPrompt;
    event.userChoice = mockUserChoice;

    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByText('Install Pact')).toBeInTheDocument();
  });

  it('does not show prompt if already installed', async () => {
    // Mock matchMedia to return true for standalone mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<AddToHomeScreenPrompt />);

    const mockPrompt = jest.fn();
    const mockUserChoice = new Promise(() => {});

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = mockPrompt;
    event.userChoice = mockUserChoice;

    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Install Pact')).not.toBeInTheDocument();
  });

  it('hides prompt when appinstalled event is fired', async () => {
    render(<AddToHomeScreenPrompt />);

    const mockPrompt = jest.fn();
    const mockUserChoice = new Promise(() => {});

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = mockPrompt;
    event.userChoice = mockUserChoice;

    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByText('Install Pact')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    await waitFor(() => {
      expect(screen.queryByText('Install Pact')).not.toBeInTheDocument();
    });
  });
});
