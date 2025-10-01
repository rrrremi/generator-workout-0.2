import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    
    // Build query
    let query = supabase.from('exercises').select('*');
    
    // Apply filters if provided
    if (name) {
      query = query.ilike('name', `%${name}%`);
    }
    
    // Execute query
    const { data, error, count } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching exercises:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Get total count
    const { count: totalCount } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({ 
      exercises: data,
      count: data?.length || 0,
      totalCount
    });
  } catch (error) {
    console.error('Error in debug exercises endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
