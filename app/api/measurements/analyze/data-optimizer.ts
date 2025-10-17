// Data optimization strategies for token reduction

interface Measurement {
  metric: string
  value: number
  unit: string
  measured_at: string
  source: string
}

interface OptimizationConfig {
  maxPointsPerMetric: number
  includeSource: boolean
  dateFormat: 'full' | 'date-only' | 'relative'
  precision: number // decimal places
}

// STRATEGY 1: Reduce points per metric
export const OPTIMIZATION_LEVELS = {
  // Full data: 10 points per metric
  full: {
    maxPointsPerMetric: 10,
    includeSource: true,
    dateFormat: 'full' as const,
    precision: 2,
    estimatedTokens: 4000
  },
  // Standard: 5 points per metric (50% reduction)
  standard: {
    maxPointsPerMetric: 5,
    includeSource: false,
    dateFormat: 'date-only' as const,
    precision: 1,
    estimatedTokens: 2000
  },
  // Minimal: 3 points per metric (70% reduction)
  minimal: {
    maxPointsPerMetric: 3,
    includeSource: false,
    dateFormat: 'relative' as const,
    precision: 1,
    estimatedTokens: 1200
  }
}

// STRATEGY 2: Smart sampling - keep most recent + oldest + middle
export function smartSample(measurements: Measurement[], maxPoints: number): Measurement[] {
  if (measurements.length <= maxPoints) return measurements
  
  const sorted = [...measurements].sort((a, b) => 
    new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
  )
  
  if (maxPoints === 1) return [sorted[0]]
  if (maxPoints === 2) return [sorted[0], sorted[sorted.length - 1]]
  
  // Keep: newest, oldest, and evenly distributed middle points
  const result = [sorted[0]] // newest
  const middleCount = maxPoints - 2
  const step = Math.floor((sorted.length - 2) / middleCount)
  
  for (let i = 1; i <= middleCount; i++) {
    const index = i * step
    if (index < sorted.length - 1) {
      result.push(sorted[index])
    }
  }
  
  result.push(sorted[sorted.length - 1]) // oldest
  
  return result.sort((a, b) => 
    new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
  )
}

// STRATEGY 3: Format optimization
export function formatOptimized(
  measurements: Measurement[],
  config: OptimizationConfig
): string {
  const rows = measurements.map(m => {
    const value = m.value.toFixed(config.precision)
    
    let date: string
    if (config.dateFormat === 'date-only') {
      date = new Date(m.measured_at).toISOString().split('T')[0]
    } else if (config.dateFormat === 'relative') {
      const days = Math.floor(
        (Date.now() - new Date(m.measured_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      date = days === 0 ? 'today' : `${days}d`
    } else {
      date = m.measured_at
    }
    
    const parts = [m.metric, value, m.unit, date]
    if (config.includeSource) parts.push(m.source)
    
    return parts.join(',')
  })
  
  const header = config.includeSource 
    ? 'metric,value,unit,date,source'
    : 'metric,value,unit,date'
  
  return [header, ...rows].join('\n')
}

// STRATEGY 4: Group by metric and optimize
export function optimizeDataset(
  measurements: Measurement[],
  level: keyof typeof OPTIMIZATION_LEVELS = 'standard'
): { csv: string; stats: { original: number; optimized: number; reduction: number } } {
  const config = OPTIMIZATION_LEVELS[level]
  
  // Group by metric
  const byMetric = measurements.reduce((acc, m) => {
    if (!acc[m.metric]) acc[m.metric] = []
    acc[m.metric].push(m)
    return acc
  }, {} as Record<string, Measurement[]>)
  
  // Sample each metric
  const optimized: Measurement[] = []
  for (const [metric, values] of Object.entries(byMetric)) {
    const sampled = smartSample(values, config.maxPointsPerMetric)
    optimized.push(...sampled)
  }
  
  // Format
  const csv = formatOptimized(optimized, config)
  
  return {
    csv,
    stats: {
      original: measurements.length,
      optimized: optimized.length,
      reduction: Math.round((1 - optimized.length / measurements.length) * 100)
    }
  }
}

// STRATEGY 5: Estimate token count
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}

// STRATEGY 6: Cost calculator
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o'
): number {
  const prices = {
    'gpt-4o': { input: 0.0025, output: 0.01 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
  }
  
  const price = prices[model]
  return (promptTokens / 1000) * price.input + (completionTokens / 1000) * price.output
}

// Example usage and savings
export const EXAMPLE_SAVINGS = {
  scenario: '1000 analyses/month, 30 metrics, 10 points each',
  full: {
    tokens_per_analysis: 8500,
    cost_per_analysis: 0.055,
    monthly_cost: 55
  },
  standard: {
    tokens_per_analysis: 5000,
    cost_per_analysis: 0.032,
    monthly_cost: 32,
    savings: 23 // dollars
  },
  minimal: {
    tokens_per_analysis: 3500,
    cost_per_analysis: 0.022,
    monthly_cost: 22,
    savings: 33 // dollars
  },
  with_mini: {
    tokens_per_analysis: 5000,
    cost_per_analysis: 0.003,
    monthly_cost: 3,
    savings: 52 // dollars
  }
}
