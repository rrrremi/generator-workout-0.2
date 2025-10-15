import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: Array<{ value: number; date: string }>;
  color?: string;
}

export function Sparkline({ data, color = 'currentColor' }: SparklineProps) {
  // No data - don't render
  if (!data || data.length === 0) {
    return null;
  }

  // Single data point - show horizontal line with dot
  if (data.length === 1) {
    return (
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={[data[0], data[0]]}>
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
