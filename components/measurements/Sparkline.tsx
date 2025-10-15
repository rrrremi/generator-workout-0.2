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
      day: 'numeric'
    });
    
    return (
      <div className="rounded border border-white/10 bg-gray-900/80 px-1.5 py-0.5 text-[10px] backdrop-blur-sm">
        <span className="font-medium text-white">{data.value.toFixed(1)} {unit}</span>
        <span className="text-white/50 ml-1.5">· {date}</span>
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
