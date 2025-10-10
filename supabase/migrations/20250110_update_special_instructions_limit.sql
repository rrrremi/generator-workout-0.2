-- Update special_instructions constraint to allow 300 characters
-- Drop existing constraint if it exists
ALTER TABLE public.workouts DROP CONSTRAINT IF EXISTS workouts_special_instructions_check;

-- Add new constraint with 300 character limit
ALTER TABLE public.workouts ADD CONSTRAINT workouts_special_instructions_check 
  CHECK (length(special_instructions) <= 300);
