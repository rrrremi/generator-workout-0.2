-- Update workouts table to add summary fields for exercise database integration
ALTER TABLE public.workouts 
ADD COLUMN IF NOT EXISTS total_sets INTEGER,
ADD COLUMN IF NOT EXISTS total_exercises INTEGER,
ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS primary_muscles_targeted TEXT[],
ADD COLUMN IF NOT EXISTS equipment_needed_array TEXT[];
