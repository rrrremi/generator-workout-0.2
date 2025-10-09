import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateWorkoutSummary } from '@/lib/exercises/operations';

export async function POST(request: NextRequest) {
  try {
    const { workoutId, workoutExerciseId, exerciseIndex } = await request.json();

    if (!workoutId || !workoutExerciseId || typeof exerciseIndex !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Get the order_index of the exercise being deleted
    const { data: exerciseToDelete, error: fetchError } = await supabase
      .from('workout_exercises')
      .select('order_index')
      .eq('id', workoutExerciseId)
      .eq('workout_id', workoutId)
      .single();

    if (fetchError || !exerciseToDelete) {
      return NextResponse.json(
        { error: 'Exercise not found in workout' },
        { status: 404 }
      );
    }

    const deletedOrderIndex = exerciseToDelete.order_index;

    // Delete the workout_exercise record
    const { error: deleteError } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', workoutExerciseId)
      .eq('workout_id', workoutId);

    if (deleteError) {
      console.error('Error deleting workout exercise:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete exercise from workout' },
        { status: 500 }
      );
    }

    // Reindex remaining exercises (shift down indices after deleted position)
    const { error: reindexError } = await supabase
      .from('workout_exercises')
      .update({ order_index: supabase.rpc('decrement_order_index') })
      .eq('workout_id', workoutId)
      .gt('order_index', deletedOrderIndex);

    // If RPC doesn't exist, use manual update
    if (reindexError) {
      // Get all exercises with order_index > deletedOrderIndex
      const { data: exercisesToReindex } = await supabase
        .from('workout_exercises')
        .select('id, order_index')
        .eq('workout_id', workoutId)
        .gt('order_index', deletedOrderIndex);

      if (exercisesToReindex && exercisesToReindex.length > 0) {
        // Update each one individually
        for (const ex of exercisesToReindex) {
          await supabase
            .from('workout_exercises')
            .update({ order_index: ex.order_index - 1 })
            .eq('id', ex.id);
        }
      }
    }

    // Get updated workout data
    const { data: updatedWorkout, error: workoutFetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();

    if (workoutFetchError || !updatedWorkout) {
      return NextResponse.json(
        { error: 'Failed to fetch updated workout' },
        { status: 500 }
      );
    }

    // Update workout_data JSONB to remove the exercise
    if (updatedWorkout.workout_data && updatedWorkout.workout_data.exercises) {
      const updatedExercises = updatedWorkout.workout_data.exercises.filter(
        (_: any, idx: number) => idx !== exerciseIndex
      );

      const { error: jsonbUpdateError } = await supabase
        .from('workouts')
        .update({
          workout_data: {
            ...updatedWorkout.workout_data,
            exercises: updatedExercises
          }
        })
        .eq('id', workoutId);

      if (jsonbUpdateError) {
        console.error('Error updating workout_data JSONB:', jsonbUpdateError);
      }
    }

    // Recalculate workout summary
    await calculateWorkoutSummary(workoutId);

    // Fetch final updated workout
    const { data: finalWorkout, error: finalFetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();

    if (finalFetchError || !finalWorkout) {
      return NextResponse.json(
        { error: 'Failed to fetch final workout state' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      workout: finalWorkout,
      message: 'Exercise deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete exercise API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
