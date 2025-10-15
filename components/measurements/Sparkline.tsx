import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface SparklineProps {
  data: Array<{ value: number; date: string }>;
  color?: string;
  unit?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string; value: number } }>;
  unit?: string;
}

function CustomTooltip({ active, payload, unit }: TooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    return (
      <div className="rounded-lg border border-white/20 bg-gray-900/95 px-2 py-1 text-xs backdrop-blur-sm">
        <p className="font-semibold text-white">
          {data.value.toFixed(1)} {unit}
        </p>
        <p className="text-white/60">{date}</p>
      </div>
    );
  }
  return null;
}

export function Sparkline({ data, color = 'currentColor', unit = '' }: SparklineProps) {
  // No data - don't render
  if (!data || data.length === 0) {
    return null;
  }

  // Single data point - show horizontal line with dot
  if (data.length === 1) {
    return (
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={[data[0], data[0]]}>
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Line 
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Multiple data points - show sparkline
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Line 
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
