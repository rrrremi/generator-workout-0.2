import { useQuery } from '@tanstack/react-query';
import { MEASUREMENTS_QUERY_OPTIONS } from '@/lib/react-query-config';
import type { MetricDetailResponse } from '@/types/measurements';

/**
 * Fetches detailed measurement data for a specific metric
 * 
 * @param metric - The metric key (e.g., 'weight', 'blood_pressure')
 * @returns Query result with measurements data and loading/error states
 */
export function useMeasurementDetail(metric: string) {
  return useQuery<MetricDetailResponse>({
    queryKey: ['measurements', 'detail', metric],
    queryFn: async () => {
      const response = await fetch(`/api/measurements/metric/${metric}`);
      if (!response.ok) {
        throw new Error('Failed to fetch metric detail');
      }
      return response.json();
    },
    ...MEASUREMENTS_QUERY_OPTIONS,
  });
}
