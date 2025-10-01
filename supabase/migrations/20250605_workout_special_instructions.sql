-- Add special_instructions column to workouts table
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS
  special_instructions TEXT;
