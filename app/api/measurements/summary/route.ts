import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cacheHelper, cacheKeys, cacheTTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';

interface SparklinePoint {
  value: number;
  date: string;
}

interface MetricSummary {
  metric: string;
  display_name: string;
  latest_value: number;
  unit: string;
  latest_date: string;
  source: string;
  confidence: number | null;
  sparkline_points: SparklinePoint[];
  point_count: number;
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get from cache first
    const cacheKey = cacheKeys.measurementsSummary(user.id);
    const cachedData = await cacheHelper.getOrSet(
      cacheKey,
      async () => {
        // Single optimized query with catalog JOIN (no N+1!)
        const { data, error } = await supabase.rpc('get_measurements_summary', {
          p_user_id: user.id
        });

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        // Transform data - display_name now comes from RPC function
        const metrics: MetricSummary[] = (data || []).map((row: any) => ({
          metric: row.metric,
          display_name: row.display_name || row.metric.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          latest_value: row.latest_value,
          unit: row.unit,
          latest_date: row.latest_date,
          source: row.source,
          confidence: row.confidence,
          sparkline_points: row.sparkline_points || [],
          point_count: row.point_count || 0
        }));

        return metrics;
      },
      cacheTTL.MEDIUM // 5 minutes cache
    );

    const queryTime = Date.now() - startTime;
    console.log(`Measurements summary query: ${queryTime}ms, ${cachedData.length} metrics`);

    return NextResponse.json({
      metrics: cachedData,
      // Only include query time in development
      ...(process.env.NODE_ENV === 'development' && { query_time_ms: queryTime })
    });

  } catch (error: any) {
    console.error('Error fetching measurements summary:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
