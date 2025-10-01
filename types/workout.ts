export interface Exercise {
  name: string;
  sets: number;
  reps: number | string; // Allow string for time-based exercises (e.g., "30 seconds") or special instructions (e.g., "to failure")
  rest_time_seconds: number;
  rationale: string;
  // New fields for exercise database integration
  primary_muscles?: string[];
  secondary_muscles?: string[];
  equipment?: string;
  movement_type?: 'compound' | 'isolation';
  order_index?: number;
  // Additional fields
  weight?: string;
  duration_seconds?: number;
  notes?: string;
}

export interface WorkoutData {
  exercises: Exercise[];
  total_duration_minutes: number;
  muscle_groups_targeted: string;
  joint_groups_affected: string;
  equipment_needed: string;
  // Additional fields
  name: string;
  description: string;
  equipment_required?: string[];
}

export interface Workout {
  id: string;
  user_id: string;
  name?: string; // Custom workout name
  total_duration_minutes: number;
  muscle_groups_targeted: string;
  joint_groups_affected: string;
  equipment_needed: string;
  workout_data: WorkoutData;
  raw_ai_response: string;
  ai_model: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  generation_time_ms?: number;
  parse_attempts: number;
  created_at: string;
  // Customization fields
  muscle_focus: string[];
  workout_focus: string[];
  exercise_count: number;
  special_instructions?: string;
  // New summary fields
  total_sets?: number;
  total_exercises?: number;
  estimated_duration_minutes?: number;
  primary_muscles_targeted?: string[];
  equipment_needed_array?: string[];
  target_date?: string | null;
  status?: 'new' | 'target' | 'missed' | 'completed' | null;
}

export interface WorkoutGenerationRequest {
  muscleFocus: string[];
  workoutFocus: string[];
  exerciseCount: number;
  specialInstructions?: string;
  difficulty?: string;
}

export interface WorkoutGenerationResponse {
  success: boolean;
  workoutId?: string;
  error?: string;
}
