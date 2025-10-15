/**
 * In-Memory Cache Implementation
 * 
 * Provides request-level caching to reduce database queries.
 * Can be easily replaced with Redis for production.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with TTL (time to live) in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all keys matching pattern
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const entries = Array.from(this.cache.entries());
      for (const [key, entry] of entries) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
const cache = new MemoryCache();

/**
 * Cache helper with automatic key generation
 */
export const cacheHelper = {
  /**
   * Get or set cache value
   * If value exists in cache, return it. Otherwise, fetch and cache it.
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Try to get from cache
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache
    cache.set(key, data, ttlSeconds);

    return data;
  },

  /**
   * Invalidate cache by key or pattern
   */
  invalidate(keyOrPattern: string): void {
    if (keyOrPattern.includes('*')) {
      cache.deletePattern(keyOrPattern);
    } else {
      cache.delete(keyOrPattern);
    }
  },

  /**
   * Get cache statistics
   */
  stats() {
    return {
      size: cache.size(),
      type: 'memory',
    };
  },

  /**
   * Clear all cache
   */
  clear(): void {
    cache.clear();
  },
};

/**
 * Cache key generators for consistency
 */
export const cacheKeys = {
  measurementsSummary: (userId: string) => `measurements:summary:${userId}`,
  measurementsDetail: (userId: string, metric: string) => `measurements:detail:${userId}:${metric}`,
  metricsCatalog: () => `metrics:catalog`,
  userMeasurements: (userId: string) => `measurements:user:${userId}:*`,
};

/**
 * Cache TTL (Time To Live) constants in seconds
 */
export const cacheTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 900,           // 15 minutes
  VERY_LONG: 3600,     // 1 hour
};

export default cache;
