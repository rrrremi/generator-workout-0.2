import { useState, useMemo } from 'react';
import type { MeasurementPublic, SortField, SortDirection } from '@/types/measurements';

/**
 * Manages sorting state and logic for measurements
 * 
 * @param measurements - Array of measurements to sort
 * @returns Sorted measurements and sort controls
 */
export function useMeasurementSort(measurements: MeasurementPublic[] | undefined) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const sortedMeasurements = useMemo(() => {
    if (!measurements) return [];
    
    const sorted = [...measurements];
    sorted.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'date') {
        comparison = new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime();
      } else if (sortField === 'value') {
        comparison = a.value - b.value;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [measurements, sortField, sortDirection]);
  
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  return {
    sortedMeasurements,
    sortField,
    sortDirection,
    toggleSort,
  };
}
