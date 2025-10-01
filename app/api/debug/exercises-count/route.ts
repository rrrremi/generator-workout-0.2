import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if exercises table exists and get count
    const { count: exercisesCount, error: exercisesError } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true });
      
    // Check if workout_exercises table exists and get count
    const { count: workoutExercisesCount, error: workoutExercisesError } = await supabase
      .from('workout_exercises')
      .select('*', { count: 'exact', head: true });
      
    // Check if workouts table exists and get count
    const { count: workoutsCount, error: workoutsError } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true });
    
    // Check for table structure
    const { data: exercisesColumns, error: columnsError } = await supabase
      .rpc('get_table_info', { table_name: 'exercises' });
      
    // Check for constraints
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_table_constraints', { table_name: 'exercises' });
    
    return NextResponse.json({
      tables: {
        exercises: {
          exists: !exercisesError,
          count: exercisesCount || 0,
          error: exercisesError ? exercisesError.message : null
        },
        workout_exercises: {
          exists: !workoutExercisesError,
          count: workoutExercisesCount || 0,
          error: workoutExercisesError ? workoutExercisesError.message : null
        },
        workouts: {
          exists: !workoutsError,
          count: workoutsCount || 0,
          error: workoutsError ? workoutsError.message : null
        }
      },
      schema: {
        columns: exercisesColumns || [],
        columnsError: columnsError ? columnsError.message : null,
        constraints: constraints || [],
        constraintsError: constraintsError ? constraintsError.message : null
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
