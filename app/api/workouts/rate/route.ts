import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { workoutId, rating } = await request.json();

    // Validate input
    if (!workoutId || typeof rating !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 6) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 6' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns the workout
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('id, user_id')
      .eq('id', workoutId)
      .single();

    if (workoutError || !workout || workout.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Workout not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the workout rating
    const { data: updatedWorkout, error: updateError } = await supabase
      .from('workouts')
      .update({ rating })
      .eq('id', workoutId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating workout rating:', updateError);
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      workout: updatedWorkout,
      message: 'Rating saved successfully'
    });

  } catch (error) {
    console.error('Error in rate workout API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
