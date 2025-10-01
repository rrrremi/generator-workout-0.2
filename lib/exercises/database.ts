import { createClient } from '@/lib/supabase/server';
import { createSearchKey, extractEquipment } from './matcher';

// Define types locally to avoid circular dependencies
interface ExerciseData {
  name: string;
  primary_muscles: string[];
  secondary_muscles?: string[];
  equipment?: string;
}

interface ExerciseRecord extends ExerciseData {
  id: string;
  search_key: string;
  created_at: string;
  updated_at: string;
}

/**
 * Find an existing exercise or create a new one
 * This function ensures only unique exercises are saved to the database
 * 
 * @param exerciseData The exercise data to find or create
 * @returns The exercise record and whether it was newly created
 */
export async function findOrCreateExercise(exerciseData: ExerciseData): Promise<{
  exercise: ExerciseRecord;
  created: boolean;
}> {
  const supabase = createClient();
  
  try {
    // Clean up the exercise name
    const exerciseName = exerciseData.name.trim();
    
    // Create a search key based on the exercise name
    const searchKey = createSearchKey(exerciseName);
    console.log(`Processing exercise: "${exerciseName}" with search key: "${searchKey}"`);
    
    // Try to find an existing exercise with the same search key
    const { data: existingExercise, error: findError } = await supabase
      .from('exercises')
      .select('*')
      .eq('search_key', searchKey)
      .maybeSingle();
    
    // If found, return it
    if (existingExercise) {
      console.log(`Found existing exercise: "${existingExercise.name}" (ID: ${existingExercise.id})`);
      return { exercise: existingExercise as ExerciseRecord, created: false };
    }
    
    // If not found, create a new exercise
    console.log(`No existing exercise found with search key: "${searchKey}", creating new one`);
    
    // Determine equipment if not provided
    const equipment = exerciseData.equipment || extractEquipment(exerciseName);
    
    // Create the exercise data object
    const insertData = {
      name: exerciseName,
      search_key: searchKey,
      primary_muscles: exerciseData.primary_muscles,
      secondary_muscles: exerciseData.secondary_muscles || [],
      equipment: equipment.toLowerCase()
    };
    
    console.log('Inserting exercise with data:', insertData);
    
    // Create the exercise in the database
    const { data: newExercise, error: createError } = await supabase
      .from('exercises')
      .insert(insertData)
      .select()
      .single();
    
    // Handle error - if it's a unique constraint violation, try to find the exercise again
    if (createError) {
      console.error('Error creating exercise:', createError);
      
      if (createError.code === '23505') { // PostgreSQL unique constraint violation
        console.log('Unique constraint violation - another process may have created this exercise');
        
        // Try to find the exercise again
        const { data: retryExercise, error: retryError } = await supabase
          .from('exercises')
          .select('*')
          .eq('search_key', searchKey)
          .single();
          
        if (retryExercise) {
          console.log(`Found exercise on retry: "${retryExercise.name}" (ID: ${retryExercise.id})`);
          return { exercise: retryExercise as ExerciseRecord, created: false };
        }

        if (retryError) {
          console.error('Retry lookup after unique violation failed:', retryError);
        }
      }
      
      throw new Error(`Failed to create exercise "${exerciseName}": ${createError.message || createError.code || 'Unknown error'}`);
    }
    
    console.log(`Successfully created exercise: "${newExercise.name}" (ID: ${newExercise.id})`);
    return { exercise: newExercise as ExerciseRecord, created: true };
  } catch (error) {
    console.error('Exception in findOrCreateExercise:', error);
    throw error instanceof Error
      ? error
      : new Error(`findOrCreateExercise failed for "${exerciseData.name}"`);
  }
}

/**
 * Link an exercise to a workout with specific parameters
 * 
 * @param workoutId The workout ID
 * @param exerciseId The exercise ID
 * @param params The exercise parameters for this workout
 * @returns The created workout_exercise record
 */
export async function linkExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  params: {
    order_index: number;
    sets: number;
    reps: number | string; // Allow both numeric and text-based rep values
    rest_seconds: number;
    weight_unit?: string;
    weight_recommendation_type?: string;
    weight_recommendation_value?: number;
    rationale?: string;
  }
) {
  const supabase = createClient();
  
  try {
    console.log(`Linking exercise ${exerciseId} to workout ${workoutId}`);
    
    // Create the insert object with all fields
    const insertObject = {
      workout_id: workoutId,
      exercise_id: exerciseId,
      order_index: params.order_index,
      sets: params.sets,
      reps: params.reps,
      rest_seconds: params.rest_seconds,
      weight_unit: params.weight_unit || 'lbs',
      weight_recommendation_type: params.weight_recommendation_type,
      weight_recommendation_value: params.weight_recommendation_value,
      rationale: params.rationale
    };
    
    // Insert the relationship into the database
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert(insertObject)
      .select()
      .single();
    
    if (error) {
      console.error(`Error linking exercise to workout: ${error.message}`);
      throw new Error(`Failed to link exercise ${exerciseId} to workout ${workoutId}: ${error.message}`);
    }
    
    console.log(`Successfully linked exercise ${exerciseId} to workout ${workoutId}`);
    return data;
  } catch (error) {
    console.error('Exception in linkExerciseToWorkout:', error);
    throw error instanceof Error
      ? error
      : new Error(`linkExerciseToWorkout failed for workout ${workoutId}`);
  }
}

/**
 * Calculate workout summary fields based on exercises
 * 
 * @param exercises Array of exercises with their parameters
 * @returns Summary fields for the workout
 */
export function calculateWorkoutSummary(exercises: Array<{
  primary_muscles: string[];
  equipment?: string;
  sets: number;
  rest_seconds: number;
}>) {
  // Calculate total sets
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  
  // Count total exercises
  const totalExercises = exercises.length;
  
  // Collect all primary muscles (with duplicates)
  const allMuscles = exercises.flatMap(ex => ex.primary_muscles);
  
  // Remove duplicates to get unique targeted muscles
  const primaryMusclesTargeted = Array.from(new Set(allMuscles));
  
  // Collect unique equipment needed
  const equipmentNeeded = Array.from(new Set(
    exercises
      .map(ex => ex.equipment)
      .filter((eq): eq is string => eq !== undefined)
  ));
  
  // Estimate duration: sets * (avg exercise time + rest time)
  // Assume average of 30 seconds per set execution
  const avgSetTimeSeconds = 30;
  const totalRestSeconds = exercises.reduce((sum, ex) => sum + (ex.sets * ex.rest_seconds), 0);
  const estimatedDurationMinutes = Math.ceil(
    (totalSets * avgSetTimeSeconds + totalRestSeconds) / 60
  );
  
  return {
    total_sets: totalSets,
    total_exercises: totalExercises,
    primary_muscles_targeted: primaryMusclesTargeted,
    equipment_needed: equipmentNeeded,
    estimated_duration_minutes: estimatedDurationMinutes
  };
}
