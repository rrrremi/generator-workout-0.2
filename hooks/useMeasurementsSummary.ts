import { useQuery } from '@tanstack/react-query';
import { MEASUREMENTS_QUERY_OPTIONS } from '@/lib/react-query-config';
import type { MeasurementsSummaryResponse, MetricSummary, SparklinePoint } from '@/types/measurements';

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
