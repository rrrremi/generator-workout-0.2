import { useQuery } from '@tanstack/react-query';
import { MEASUREMENTS_QUERY_OPTIONS } from '@/lib/react-query-config';

export interface SparklinePoint {
  value: number;
  date: string;
}

export interface MetricSummary {
  metric: string;
  display_name: string;
  latest_value: number;
  unit: string;
  latest_date: string;
  source: string;
  confidence: number | null;
  sparkline_points: SparklinePoint[];
  point_count: number;
}

interface MeasurementsSummaryResponse {
  metrics: MetricSummary[];
  query_time_ms: number;
}

export function useMeasurementsSummary() {
  return useQuery<MeasurementsSummaryResponse>({
    queryKey: ['measurements', 'summary'],
    queryFn: async () => {
      const response = await fetch('/api/measurements/summary');
      
      if (!response.ok) {
        throw new Error('Failed to fetch measurements summary');
      }
      
      return response.json();
    },
    ...MEASUREMENTS_QUERY_OPTIONS,
  });
}
