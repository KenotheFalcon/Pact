import { renderHook, act } from '@testing-library/react';
import { useAtTop } from '../useScrollDirection';

describe('useAtTop', () => {
  beforeEach(() => {
    // Reset window.scrollY before each test
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
    });
  });

  it('should return true by default when scrollY is 0', () => {
    const { result } = renderHook(() => useAtTop());
    expect(result.current).toBe(true);
  });

  it('should return false when scrolled past the offset (default 0)', () => {
    const { result } = renderHook(() => useAtTop());

    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(false);
  });

  it('should return true when scrolled back to the top', () => {
    window.scrollY = 100;
    const { result } = renderHook(() => useAtTop());
    expect(result.current).toBe(false);

    act(() => {
      window.scrollY = 0;
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(true);
  });

  it('should respect a custom offset', () => {
    const offset = 50;
    const { result } = renderHook(() => useAtTop(offset));

    act(() => {
      window.scrollY = 40;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(true);

    act(() => {
      window.scrollY = 60;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.scrollY = 50;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(true);
  });

  it('should initialize correctly if already scrolled past offset on mount', () => {
    window.scrollY = 100;
    const { result } = renderHook(() => useAtTop());
    expect(result.current).toBe(false);
  });

  it('should clean up the scroll event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useAtTop());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});
