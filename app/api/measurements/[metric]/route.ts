import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface MeasurementDetail {
  id: string;
  value: number;
  unit: string;
  measured_at: string;
  source: string;
  confidence: number | null;
  notes: string | null;
  created_at: string;
}

export async function GET(
  request: Request,
  { params }: { params: { metric: string } }
) {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metric = params.metric;

    // Get all measurements for this metric
    const { data, error } = await supabase
      .from('measurements')
      .select('id, value, unit, measured_at, source, confidence, notes, created_at')
      .eq('user_id', user.id)
      .eq('metric', metric)
      .order('measured_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get metric display name from catalog
    const { data: catalogData } = await supabase
      .from('metrics_catalog')
      .select('display_name')
      .eq('key', metric)
      .single();

    const displayName = catalogData?.display_name || 
      metric.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    const queryTime = Date.now() - startTime;
    console.log(`Metric detail query: ${queryTime}ms, ${data?.length || 0} measurements`);

    return NextResponse.json({
      metric,
      display_name: displayName,
      measurements: data || [],
      query_time_ms: queryTime
    });

  } catch (error: any) {
    console.error('Error fetching metric detail:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
