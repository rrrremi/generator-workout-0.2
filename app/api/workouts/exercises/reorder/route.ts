import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const { workoutId, exerciseIds } = await request.json();
    
    if (!workoutId || !exerciseIds || !Array.isArray(exerciseIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    // Verify user owns the workout
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('id')
      .eq('id', workoutId)
      .eq('user_id', user.id)
      .single();
    
    if (workoutError || !workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }
    
    // Update order_index for each exercise
    const updates = exerciseIds.map((exerciseId, index) => 
      supabase
        .from('workout_exercises')
        .update({ order_index: index })
        .eq('id', exerciseId)
        .eq('workout_id', workoutId)
    );
    
    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Error updating exercise order:', errors);
      return NextResponse.json({ error: 'Failed to update exercise order' }, { status: 500 });
    }
    
    // Fetch updated workout data
    const { data: updatedWorkout, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching updated workout:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch updated workout' }, { status: 500 });
    }
    
    return NextResponse.json({ workout: updatedWorkout });
    
  } catch (error) {
    console.error('Error reordering exercises:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reorder exercises' },
      { status: 500 }
    );
  }
}
