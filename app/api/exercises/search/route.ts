import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const muscle = searchParams.get('muscle') || '';
    const movement = searchParams.get('movement') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build query
    let dbQuery = supabase
      .from('exercises')
      .select('*');

    // Search by name (case-insensitive)
    if (query) {
      dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    // Filter by movement type (search in name)
    if (movement && movement !== 'all') {
      dbQuery = dbQuery.ilike('name', `%${movement}%`);
    }

    // Filter by muscle group (primary OR secondary)
    if (muscle && muscle !== 'all') {
      // Check if primary_muscles array contains the muscle OR secondary_muscles array contains it
      dbQuery = dbQuery.or(`primary_muscles.cs.{${muscle}},secondary_muscles.cs.{${muscle}}`);
    }

    // Order by name, apply offset and limit
    dbQuery = dbQuery
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: exercises, error } = await dbQuery;

    if (error) {
      console.error('Error searching exercises:', error);
      return NextResponse.json(
        { error: 'Failed to search exercises' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      exercises: exercises || []
    });

  } catch (error) {
    console.error('Error in exercise search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
