import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// UPDATE measurement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { value, unit, measured_at, notes } = body;

    // Validate required fields
    if (value === undefined || !unit) {
      return NextResponse.json(
        { error: 'Value and unit are required' },
        { status: 400 }
      );
    }

    // Update measurement (RLS ensures user can only update their own)
    const { data, error } = await supabase
      .from('measurements')
      .update({
        value: parseFloat(value),
        unit,
        measured_at: measured_at || new Date().toISOString(),
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id) // Extra safety check
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Measurement not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('PATCH /api/measurements/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE measurement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete measurement (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('measurements')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id); // Extra safety check

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/measurements/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
