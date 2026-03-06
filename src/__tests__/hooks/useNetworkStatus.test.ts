import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

describe('useNetworkStatus', () => {
  const originalOnLine = navigator.onLine;
  const mockFetch = jest.fn();

  beforeAll(() => {
    global.fetch = mockFetch;
  });

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true });

    // Reset navigator.onLine mock
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: originalOnLine,
    });
  });

  it('should initialize with correct online state', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.offlineSince).toBeNull();
  });

  it('should initialize offline when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.offlineSince).toBeInstanceOf(Date);
  });

  it('should handle offline event', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.offlineSince).toBeInstanceOf(Date);
  });

  it('should handle online event successfully', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);

    // Mock successful fetch
    mockFetch.mockResolvedValueOnce({ ok: true });

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.isOnline).toBe(true);
    expect(result.current.offlineSince).toBeNull();
  });

  it('should retry when online event fetch fails', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);

    // Mock failed fetch initially
    mockFetch.mockResolvedValueOnce({ ok: false });

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    // Should still be offline and reconnecting
    expect(result.current.isOnline).toBe(false);
    expect(result.current.offlineSince).not.toBeNull();

    // Mock successful fetch on retry
    mockFetch.mockResolvedValueOnce({ ok: true });

    // Advance timer by 5 seconds
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.current.isOnline).toBe(true);
    expect(result.current.offlineSince).toBeNull();
    expect(result.current.isReconnecting).toBe(false);
  });

  it('should stop retrying when offline event fires', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    const { result } = renderHook(() => useNetworkStatus());

    mockFetch.mockResolvedValueOnce({ ok: false });

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Fire offline event
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    mockFetch.mockResolvedValueOnce({ ok: true });

    // Advance timer by 5 seconds
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    // Fetch should not have been called again
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.current.isOnline).toBe(false);
  });

  it('should allow manual checkConnection', async () => {
    const { result } = renderHook(() => useNetworkStatus());

    mockFetch.mockResolvedValueOnce({ ok: true });

    let isConnected;
    await act(async () => {
      isConnected = await result.current.checkConnection();
    });

    expect(isConnected).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/health\?_=\d+$/),
      expect.objectContaining({ method: 'HEAD', cache: 'no-store' })
    );
  });

  it('should handle fetch rejection in checkConnection', async () => {
    const { result } = renderHook(() => useNetworkStatus());

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    let isConnected;
    await act(async () => {
      isConnected = await result.current.checkConnection();
    });

    expect(isConnected).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
