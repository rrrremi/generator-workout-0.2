/**
 * Measurements Module - Constants
 * Centralized configuration to eliminate magic numbers
 */

/**
 * Measurements module configuration
 */
export const MEASUREMENTS_CONFIG = {
  // Cache durations (milliseconds)
  CACHE: {
    STALE_TIME: 5 * 60 * 1000,      // 5 minutes
    GC_TIME: 10 * 60 * 1000,        // 10 minutes
  },
  
  // File upload limits
  UPLOAD: {
    MAX_SIZE_MB: 10,
    MAX_SIZE_BYTES: 10 * 1024 * 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'] as const,
    MAX_FILENAME_LENGTH: 100,
  },
  
  // Rate limiting
  RATE_LIMITS: {
    UPDATES_PER_MINUTE: 20,
    DELETES_PER_MINUTE: 20,
    UPLOADS_PER_HOUR: 5,
    WINDOW_MS: 60 * 1000,
  },
  
  // Sparkline
  SPARKLINE: {
    MAX_POINTS: 30,
  },
  
  // Validation
  VALIDATION: {
    MIN_VALUE: 0,
    MAX_VALUE: 10000,
    MAX_UNIT_LENGTH: 20,
    MAX_NOTES_LENGTH: 500,
  },
} as const;
