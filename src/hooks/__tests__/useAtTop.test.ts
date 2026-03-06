import { renderHook, act } from '@testing-library/react';
import { useAtTop } from '../useScrollDirection';

describe('useAtTop', () => {
  // Save original scrollY
  const originalScrollY = window.scrollY;

  beforeEach(() => {
    // Reset scrollY before each test
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
    });
  });

  afterAll(() => {
    // Restore original scrollY
    Object.defineProperty(window, 'scrollY', {
      value: originalScrollY,
      writable: true,
    });
  });

  const fireScrollEvent = (scrollY: number) => {
    window.scrollY = scrollY;
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
  };

  it('should return true initially when at the top', () => {
    const { result } = renderHook(() => useAtTop());
    expect(result.current).toBe(true);
  });

  it('should return false when scrolled past the offset (default 0)', () => {
    const { result } = renderHook(() => useAtTop());

    // Scroll down
    fireScrollEvent(10);

    expect(result.current).toBe(false);
  });

  it('should return true when scrolled back to the top', () => {
    const { result } = renderHook(() => useAtTop());

    // Scroll down
    fireScrollEvent(10);
    expect(result.current).toBe(false);

    // Scroll back up
    fireScrollEvent(0);
    expect(result.current).toBe(true);
  });

  it('should respect a custom offset', () => {
    const { result } = renderHook(() => useAtTop(50));

    // Initially at top
    expect(result.current).toBe(true);

    // Scroll down, but not past offset
    fireScrollEvent(30);
    expect(result.current).toBe(true);

    // Scroll exactly to offset
    fireScrollEvent(50);
    expect(result.current).toBe(true);

    // Scroll past offset
    fireScrollEvent(51);
    expect(result.current).toBe(false);
  });

  it('should clean up the event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useAtTop());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
