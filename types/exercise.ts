/**
 * Exercise data types for the exercise database feature
 */

/**
 * Base exercise data structure used when creating exercises
 */
export interface ExerciseData {
  name: string;
  primary_muscles: string[];
  secondary_muscles?: string[];
  equipment?: string;
  movement_type?: 'compound' | 'isolation';
}

/**
 * Database record for an exercise
 */
export interface ExerciseRecord extends ExerciseData {
  id: string;
  search_key: string;
  created_at: string;
  updated_at: string;
}

/**
 * Exercise parameters specific to a workout
 */
export interface WorkoutExerciseParams {
  sets: number;
  reps: number;
  rest_seconds: number;
  weight_unit?: string;
  weight_recommendation_type?: 'absolute' | 'bodyweight_percentage';
  weight_recommendation_value?: number;
  rationale?: string;
}

/**
 * Complete workout exercise with exercise data and workout-specific parameters
 */
export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: number;
  rest_seconds: number;
  weight_unit: string;
  weight_recommendation_type?: 'absolute' | 'bodyweight_percentage';
  weight_recommendation_value?: number;
  rationale?: string;
  created_at: string;
  
  // Joined exercise data
  exercise?: ExerciseRecord;
}

/**
 * Enhanced workout data with detailed exercise information
 */
export interface EnhancedWorkoutData {
  exercises: Array<ExerciseData & WorkoutExerciseParams & { order_index: number }>;
  total_duration_minutes: number;
  muscle_groups_targeted: string;
  joint_groups_affected: string;
  equipment_needed: string;
}
