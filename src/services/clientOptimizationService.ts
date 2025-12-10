/**
 * Client-side optimization utilities
 * Provides performance optimization functions for the frontend
 */

/**
 * Debounce function to limit the rate of function execution
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @param immediate - Whether to execute immediately on first call
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit function execution to once per interval
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoization function for caching expensive computations
 * @param fn - Function to memoize
 * @param getKey - Function to generate cache key from arguments
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Request animation frame wrapper for smooth animations
 * @param callback - Function to execute on next frame
 * @returns Request ID for cancellation
 */
export function requestAnimationFrame(callback: () => void): number {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }
  return setTimeout(callback, 16); // Fallback for SSR
}

/**
 * Cancel animation frame
 * @param id - Request ID to cancel
 */
export function cancelAnimationFrame(id: number): void {
  if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
    window.cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Lazy loading utility for images
 * @param img - Image element
 * @param src - Image source URL
 * @param placeholder - Placeholder image URL
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  placeholder?: string
): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement;
          image.src = src;
          image.classList.remove('lazy');
          observer.unobserve(image);
        }
      });
    });
    
    if (placeholder) {
      img.src = placeholder;
    }
    img.classList.add('lazy');
    observer.observe(img);
  } else {
    // Fallback for browsers without IntersectionObserver
    img.src = src;
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();
  
  static mark(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }
  
  static measure(name: string, startMark: string, endMark?: string): number {
    if (typeof performance !== 'undefined') {
      const start = this.marks.get(startMark);
      const end = endMark ? this.marks.get(endMark) : performance.now();
      
      if (start && end) {
        const duration = end - start;
        // Performance measurement completed
        return duration;
      }
    }
    return 0;
  }
}

/**
 * Local storage with expiration
 */
export class ExpiringStorage {
  static set(key: string, value: any, expirationMs: number): void {
    const item = {
      value,
      expiration: Date.now() + expirationMs
    };
    localStorage.setItem(key, JSON.stringify(item));
  }
  
  static get<T>(key: string): T | null {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    try {
      const item = JSON.parse(itemStr);
      if (Date.now() > item.expiration) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }
  
  static remove(key: string): void {
    localStorage.removeItem(key);
  }
}