-- Add new columns to workouts table for user inputs
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS
  muscle_focus TEXT[] NOT NULL DEFAULT '{}',
  workout_focus TEXT NOT NULL DEFAULT 'hypertrophy',
  exercise_count INTEGER NOT NULL DEFAULT 4 CHECK (exercise_count >= 1 AND exercise_count <= 10);
