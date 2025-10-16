import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

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

  // Calculate dynamic Y-axis domain with smart scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
  
  // Calculate percentage variation relative to average
  const percentVariation = avgValue > 0 ? (range / avgValue) * 100 : 0;
  
  // Smart padding based on variation magnitude:
  // - Large variations (>20%): Less padding needed (20%) - trend is already clear
  // - Medium variations (5-20%): Moderate padding (35%) - balanced view
  // - Small variations (<5%): More padding (50%) - zoom in to show subtle changes
  let paddingPercent: number;
  if (percentVariation > 20) {
    paddingPercent = 0.2;  // Large swings - minimal padding
  } else if (percentVariation > 5) {
    paddingPercent = 0.35; // Medium changes - moderate padding
  } else {
    paddingPercent = 0.5;  // Small changes - more zoom
  }
  
  const padding = range * paddingPercent;
  const yMin = minValue - padding;
  const yMax = maxValue + padding;

  // Single data point - show horizontal line with dot
  if (data.length === 1) {
    return (
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={[data[0], data[0]]}>
          <YAxis domain={[yMin, yMax]} hide />
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

  // Multiple data points - show sparkline with dynamic domain
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <YAxis domain={[yMin, yMax]} hide />
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
