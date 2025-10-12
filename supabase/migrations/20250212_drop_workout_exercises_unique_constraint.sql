-- Drop the unique constraint that prevents the same exercise from appearing multiple times in a workout
-- This allows users to add the same exercise with different sets/reps (e.g., Bench Press 3x10 and Bench Press 5x5)

ALTER TABLE workout_exercises 
DROP CONSTRAINT IF EXISTS workout_exercises_workout_id_exercise_id_key;

-- Note: The primary key on 'id' column still prevents true duplicates at the row level
-- The order_index ensures proper ordering of exercises within a workout
