// Performance optimization utilities

/**
 * Prefetch data at route level to reduce loading delays
 * @param url URL to prefetch
 */
export function prefetchData(url: string) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    requestIdleCallback(() => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = url;
      link.as = "fetch";
      document.head.appendChild(link);
    });
  }
}

/**
 * Defer non-critical script execution
 * @param callback Function to defer
 * @param delay Delay in ms (optional)
 */
export function deferExecution(callback: () => void, delay = 0) {
  if (typeof window !== "undefined") {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        if (delay > 0) setTimeout(callback, delay);
        else callback();
      });
    } else {
      setTimeout(callback, Math.max(100, delay));
    }
  }
}

/**
 * Memoize expensive computations
 */
export function createMemoizer<T extends (...args: unknown[]) => unknown>(fn: T) {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
