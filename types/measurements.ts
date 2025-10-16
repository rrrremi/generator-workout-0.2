/**
 * Measurements Module - Type Definitions
 * Centralized types to eliminate duplication across files
 */

/**
 * Single point in a sparkline chart
 */
export interface SparklinePoint {
  value: number;
  date: string;
}

/**
 * Core measurement data structure
 */
export interface Measurement {
  id: string;
  user_id: string;
  metric: string;
  value: number;
  unit: string;
  measured_at: string;
  source: 'ocr' | 'manual';
  confidence: number | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Measurement without sensitive fields (for API responses)
 */
export type MeasurementPublic = Omit<Measurement, 'user_id'>;

/**
 * Summary data for a metric (used in list view)
 */
export interface MetricSummary {
  metric: string;
  display_name: string;
  category: string;
  latest_value: number;
  unit: string;
  latest_date: string;
  source: string;
  confidence: number | null;
  sparkline_points: SparklinePoint[];
  point_count: number;
}

/**
 * Response from measurements summary API
 */
export interface MeasurementsSummaryResponse {
  metrics: MetricSummary[];
  query_time_ms?: number; // Only in development
}

/**
 * Response from metric detail API
 */
export interface MetricDetailResponse {
  metric: string;
  display_name: string;
  measurements: MeasurementPublic[];
  query_time_ms?: number; // Only in development
}

/**
 * Sort configuration
 */
export type SortField = 'date' | 'value';
export type SortDirection = 'asc' | 'desc';
