/**
 * React Query Configuration
 * 
 * Centralized configuration for React Query to ensure consistent
 * caching and refetching behavior across the application.
 */

export const QUERY_CONFIG = {
  /**
   * How long data is considered fresh (in milliseconds)
   * During this time, no refetch will occur
   */
  STALE_TIME: {
    SHORT: 1 * 60 * 1000,      // 1 minute - for frequently changing data
    MEDIUM: 5 * 60 * 1000,     // 5 minutes - for normal data (default)
    LONG: 15 * 60 * 1000,      // 15 minutes - for rarely changing data
    VERY_LONG: 60 * 60 * 1000, // 1 hour - for static data
  },

  /**
   * How long inactive data stays in cache (in milliseconds)
   * After this time, unused data is garbage collected
   */
  GC_TIME: {
    SHORT: 5 * 60 * 1000,      // 5 minutes
    MEDIUM: 10 * 60 * 1000,    // 10 minutes (default)
    LONG: 30 * 60 * 1000,      // 30 minutes
  },

  /**
   * Retry configuration
   */
  RETRY: {
    NONE: 0,
    ONCE: 1,
    TWICE: 2,
    DEFAULT: 3,
  },

  /**
   * Refetch behavior
   */
  REFETCH: {
    // Don't refetch on window focus (prevents excessive requests)
    ON_WINDOW_FOCUS: false,
    
    // Use cache if fresh, refetch if stale (smart behavior)
    ON_MOUNT: true,
    
    // Don't refetch on reconnect (prevents request storms)
    ON_RECONNECT: false,
  },
} as const;

/**
 * Default query options for measurements
 */
export const MEASUREMENTS_QUERY_OPTIONS = {
  staleTime: QUERY_CONFIG.STALE_TIME.MEDIUM,
  gcTime: QUERY_CONFIG.GC_TIME.MEDIUM,
  refetchOnWindowFocus: QUERY_CONFIG.REFETCH.ON_WINDOW_FOCUS,
  refetchOnMount: QUERY_CONFIG.REFETCH.ON_MOUNT,
  refetchOnReconnect: QUERY_CONFIG.REFETCH.ON_RECONNECT,
  retry: QUERY_CONFIG.RETRY.TWICE,
};

/**
 * Query options for frequently updated data
 */
export const REALTIME_QUERY_OPTIONS = {
  staleTime: QUERY_CONFIG.STALE_TIME.SHORT,
  gcTime: QUERY_CONFIG.GC_TIME.SHORT,
  refetchOnWindowFocus: true, // Refetch on focus for realtime data
  refetchOnMount: true,
  retry: QUERY_CONFIG.RETRY.TWICE,
};

/**
 * Query options for static/rarely changing data
 */
export const STATIC_QUERY_OPTIONS = {
  staleTime: QUERY_CONFIG.STALE_TIME.VERY_LONG,
  gcTime: QUERY_CONFIG.GC_TIME.LONG,
  refetchOnWindowFocus: false,
  refetchOnMount: false, // Don't refetch static data
  retry: QUERY_CONFIG.RETRY.ONCE,
};
