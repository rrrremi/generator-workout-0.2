import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { MetricDetailResponse } from '@/types/measurements';

/**
 * Manages measurement mutations (update, delete) with optimistic updates
 * 
 * @param metric - The metric key for cache invalidation
 * @returns Mutation functions and loading states
 */
export function useMeasurementMutations(metric: string) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  
  /**
   * Updates a measurement value with optimistic UI update
   */
  const updateMeasurement = async (id: string, newValue: number) => {
    const previousDetailData = queryClient.getQueryData<MetricDetailResponse>([
      'measurements',
      'detail',
      metric,
    ]);
    const previousSummaryData = queryClient.getQueryData(['measurements', 'summary']);
    
    const measurement = previousDetailData?.measurements.find((m) => m.id === id);
    if (!measurement) return;
    
    try {
      // Optimistic update - update UI immediately
      queryClient.setQueryData<MetricDetailResponse>(
        ['measurements', 'detail', metric],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            measurements: old.measurements.map((m) =>
              m.id === id ? { ...m, value: newValue } : m
            ),
          };
        }
      );
      
      // Update summary cache if this is the latest measurement
      queryClient.setQueryData(['measurements', 'summary'], (old: any) => {
        if (!old?.metrics) return old;
        return {
          ...old,
          metrics: old.metrics.map((m: any) =>
            m.metric === metric && m.latest_date === measurement.measured_at
              ? { ...m, latest_value: newValue }
              : m
          ),
        };
      });
      
      // Make API call in background
      const payload = {
        value: newValue,
        unit: measurement.unit,
      };
      console.log('Updating measurement:', { id, payload });
      
      const response = await fetch(`/api/measurements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update');
      }
      
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['measurements', 'detail', metric] });
      queryClient.invalidateQueries({ queryKey: ['measurements', 'summary'] });
    } catch (error) {
      console.error('Update error:', error);
      
      // Rollback optimistic update on error
      if (previousDetailData) {
        queryClient.setQueryData(['measurements', 'detail', metric], previousDetailData);
      }
      if (previousSummaryData) {
        queryClient.setQueryData(['measurements', 'summary'], previousSummaryData);
      }
      
      toast.error('Failed to update measurement. Changes have been reverted.');
    }
  };
  
  /**
   * Deletes a measurement with optimistic UI update
   */
  const deleteMeasurement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this measurement?')) return;
    
    const previousDetailData = queryClient.getQueryData<MetricDetailResponse>([
      'measurements',
      'detail',
      metric,
    ]);
    const previousSummaryData = queryClient.getQueryData(['measurements', 'summary']);
    
    try {
      setDeleting(id);
      
      // Optimistic update - remove from UI immediately
      queryClient.setQueryData<MetricDetailResponse>(
        ['measurements', 'detail', metric],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            measurements: old.measurements.filter((m) => m.id !== id),
          };
        }
      );
      
      // Update summary if needed (recalculate latest)
      queryClient.setQueryData(['measurements', 'summary'], (old: any) => {
        if (!old?.metrics) return old;
        
        const remainingMeasurements =
          previousDetailData?.measurements.filter((m) => m.id !== id) || [];
        
        if (remainingMeasurements.length === 0) {
          // Remove metric from summary if no measurements left
          return {
            ...old,
            metrics: old.metrics.filter((m: any) => m.metric !== metric),
          };
        }
        
        // Update with new latest value
        const latestMeasurement = remainingMeasurements.sort(
          (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
        )[0];
        
        return {
          ...old,
          metrics: old.metrics.map((m: any) =>
            m.metric === metric
              ? {
                  ...m,
                  latest_value: latestMeasurement.value,
                  latest_date: latestMeasurement.measured_at,
                  point_count: remainingMeasurements.length,
                }
              : m
          ),
        };
      });
      
      // Make API call in background
      const response = await fetch(`/api/measurements/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['measurements', 'detail', metric] });
      queryClient.invalidateQueries({ queryKey: ['measurements', 'summary'] });
    } catch (error) {
      console.error('Delete error:', error);
      
      // Rollback optimistic update on error
      if (previousDetailData) {
        queryClient.setQueryData(['measurements', 'detail', metric], previousDetailData);
      }
      if (previousSummaryData) {
        queryClient.setQueryData(['measurements', 'summary'], previousSummaryData);
      }
      
      toast.error('Failed to delete measurement. Changes have been reverted.');
    } finally {
      setDeleting(null);
    }
  };
  
  return {
    updateMeasurement,
    deleteMeasurement,
    deleting,
  };
}
