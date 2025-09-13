import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Optimized state hook that prevents unnecessary re-renders
 */
export const useOptimizedState = <T>(
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [state, setState] = useState(initialValue);
  const previousValueRef = useRef<T>(initialValue);

  const optimizedSetState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      
      // Deep comparison for objects/arrays
      const hasChanged = JSON.stringify(newValue) !== JSON.stringify(previousValueRef.current);
      
      if (hasChanged) {
        previousValueRef.current = newValue;
        return newValue;
      }
      
      return prev; // Return previous to prevent re-render
    });
  }, []);

  return [state, optimizedSetState];
};

/**
 * Debounced state hook for search inputs
 */
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] => {
  const [immediateValue, setImmediateValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setValue = useCallback((value: T) => {
    setImmediateValue(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [immediateValue, debouncedValue, setValue];
};

/**
 * Memoized callback hook with dependency optimization
 */
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const depsRef = useRef(deps);
  const callbackRef = useRef(callback);

  // Only update if dependencies actually changed
  const depsChanged = deps.some((dep, index) => 
    JSON.stringify(dep) !== JSON.stringify(depsRef.current[index])
  );

  if (depsChanged) {
    depsRef.current = deps;
    callbackRef.current = callback;
  }

  return useCallback(callbackRef.current, deps);
};

/**
 * Lazy loading hook for heavy components
 */
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = useCallback(async () => {
    if (Component || loading) return;
    
    setLoading(true);
    try {
      const module = await importFn();
      setComponent(() => module.default);
    } catch (err) {
      setError(err as Error);
      if (fallback) {
        setComponent(() => fallback);
      }
    } finally {
      setLoading(false);
    }
  }, [Component, loading, importFn, fallback]);

  return { Component, loading, error, loadComponent };
};