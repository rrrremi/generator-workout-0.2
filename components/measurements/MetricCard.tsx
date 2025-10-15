import { Sparkline } from './Sparkline';
import type { MetricSummary } from '@/hooks/useMeasurementsSummary';

interface MetricCardProps {
  metric: MetricSummary;
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-2xl hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Metric Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/60 uppercase tracking-wide truncate">
            {metric.display_name}
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {metric.latest_value.toFixed(1)} <span className="text-lg text-white/70">{metric.unit}</span>
          </p>
          {metric.source === 'ocr' && metric.confidence !== null && (
            <p className="text-xs text-white/50 mt-1">
              {Math.round(metric.confidence * 100)}% confidence
            </p>
          )}
          {metric.source === 'manual' && (
            <p className="text-xs text-white/50 mt-1">
              Manual entry
            </p>
          )}
        </div>

        {/* Right: Sparkline */}
        {metric.sparkline_points.length > 0 && (
          <div className="w-32 h-16 flex-shrink-0">
            <Sparkline 
              data={metric.sparkline_points} 
              color="#fff" 
              unit={metric.unit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
