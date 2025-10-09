import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateWorkoutSummary } from '@/lib/exercises/operations';

export async function POST(request: NextRequest) {
  try {
    const { workoutId, exerciseId } = await request.json();

    if (!workoutId || !exerciseId) {
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
      .select('id, user_id, workout_data')
      .eq('id', workoutId)
      .single();

    if (workoutError || !workout || workout.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Workout not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get the exercise details
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (exerciseError || !exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Check if exercise already exists in workout
    const { data: existingExercise } = await supabase
      .from('workout_exercises')
      .select('id')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .single();

    if (existingExercise) {
      return NextResponse.json(
        { error: 'Exercise already in workout' },
        { status: 400 }
      );
    }

    // Get the current max order_index
    const { data: maxOrderData } = await supabase
      .from('workout_exercises')
      .select('order_index')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrderIndex = (maxOrderData?.order_index ?? -1) + 1;

    // Add exercise to workout_exercises table
    const { error: insertError } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: workoutId,
        exercise_id: exerciseId,
        order_index: nextOrderIndex,
        completed: false,
        sets: exercise.sets || 3,
        reps: exercise.reps || '10-12',
        rest_seconds: exercise.rest_seconds || 60
      });

    if (insertError) {
      console.error('Error adding exercise to workout:', insertError);
      return NextResponse.json(
        { error: 'Failed to add exercise to workout' },
        { status: 500 }
      );
    }

    // Update workout_data JSONB to add the exercise
    const currentExercises = workout.workout_data?.exercises || [];
    const newExercise = {
      id: exercise.id,
      name: exercise.name,
      sets: exercise.sets || 3,
      reps: exercise.reps || '10-12',
      rest_time_seconds: exercise.rest_seconds || 60,
      primary_muscle: exercise.primary_muscles || exercise.primary_muscle,
      secondary_muscles: exercise.secondary_muscles || [],
      equipment: exercise.equipment || 'None',
      difficulty: exercise.difficulty || 'intermediate',
      instructions: exercise.instructions || '',
      rationale: exercise.rationale || exercise.instructions || ''
    };

    const updatedExercises = [...currentExercises, newExercise];

    const { error: jsonbUpdateError } = await supabase
      .from('workouts')
      .update({
        workout_data: {
          ...workout.workout_data,
          exercises: updatedExercises
        }
      })
      .eq('id', workoutId);

    if (jsonbUpdateError) {
      console.error('Error updating workout_data JSONB:', jsonbUpdateError);
    }

    // Recalculate workout summary
    await calculateWorkoutSummary(workoutId);

    // Fetch updated workout
    const { data: updatedWorkout, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();

    if (fetchError || !updatedWorkout) {
      return NextResponse.json(
        { error: 'Failed to fetch updated workout' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      workout: updatedWorkout,
      message: 'Exercise added successfully'
    });

  } catch (error) {
    console.error('Error in add exercise API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
