import { useEffect, useRef, useState } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Global singleton cache to prevent multiple instances
const globalCache = new Map<string, CacheEntry<any>>();
const loadingStates = new Map<string, boolean>();
const pendingRequests = new Map<string, Promise<any>>();

export const useContentCache = <T,>(
  key: string,
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchData = async () => {
    if (!mountedRef.current) return;

    const start = performance.now();

    try {
      if (!mountedRef.current) return;
      setError(null);

      // Check global cache first
      const cached = globalCache.get(key);
      const now = Date.now();

      if (cached && now - cached.timestamp < CACHE_DURATION) {
        if (mountedRef.current) {
          setData(cached.data);
          setIsLoading(false);
        }
        return;
      }

      // Check if already loading
      if (loadingStates.get(key)) {
        const existingRequest = pendingRequests.get(key);
        if (existingRequest) {
          const result = await existingRequest;
          if (mountedRef.current) {
            setData(result);
            setIsLoading(false);
          }
          return;
        }
      }

      // Set loading state
      loadingStates.set(key, true);
      if (!cached) {
        if (mountedRef.current) setIsLoading(true);
      } else {
      }

      // Create and store the fetch promise
      const fetchPromise = fetchFunction();
      pendingRequests.set(key, fetchPromise);

      const fetchStart = performance.now();
      const result = await fetchPromise;

      // Update global cache
      globalCache.set(key, {
        data: result,
        timestamp: now,
      });

      // Clean up loading state
      loadingStates.delete(key);
      pendingRequests.delete(key);

      if (mountedRef.current) {
        setData(result);
        setIsLoading(false);
      }
    } catch (err) {
      loadingStates.delete(key);
      pendingRequests.delete(key);
      if (mountedRef.current) {
        setError(err as Error);
        setIsLoading(false);
      }
      console.error(`❌ [useContentCache] Error fetching ${key}:`, err);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Check if we already have data in global cache
    const cached = globalCache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setData(cached.data);
      setIsLoading(false);
      return;
    }

    // Only fetch if not already loading
    if (!loadingStates.get(key)) {
      fetchData();
    } else {
      // Wait for existing fetch to complete
      const existingRequest = pendingRequests.get(key);
      if (existingRequest) {
        existingRequest
          .then((result) => {
            if (mountedRef.current) {
              setData(result);
              setIsLoading(false);
            }
          })
          .catch((err) => {
            if (mountedRef.current) {
              setError(err);
              setIsLoading(false);
            }
          });
      }
    }

    return () => {
      mountedRef.current = false;
    };
  }, dependencies);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};
