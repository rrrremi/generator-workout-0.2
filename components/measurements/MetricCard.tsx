import Link from 'next/link';
import { Sparkline } from './Sparkline';
import type { MetricSummary } from '@/types/measurements';
import { InlineErrorBoundary } from '@/components/ErrorBoundary';

interface MetricCardProps {
  metric: MetricSummary;
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <InlineErrorBoundary>
      <Link href={`/protected/measurements/${metric.metric}`}>
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-2xl hover:bg-white/10 transition-colors cursor-pointer">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Metric Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium truncate">
                  {metric.display_name}
                </p>
                {metric.source === 'ocr' && metric.confidence !== null && (
                  <span className="text-[9px] text-emerald-400/70">
                    📸 {Math.round(metric.confidence * 100)}%
                  </span>
                )}
                {metric.source === 'manual' && (
                  <span className="text-[9px] text-blue-400/70">
                    ✍️
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-white mt-0.5">
                {metric.latest_value.toFixed(1)} <span className="text-base text-white/60 font-normal">{metric.unit}</span>
              </p>
            </div>

            {/* Right: Sparkline */}
            {metric.sparkline_points.length > 0 && (
              <div className="w-36 h-14 flex-shrink-0">
                <Sparkline 
                  data={metric.sparkline_points} 
                  color="#fff" 
                  unit={metric.unit}
                />
              </div>
            )}
          </div>
        </div>
      </Link>
    </InlineErrorBoundary>
  );
}
