-- Add rationale column to exercises table if it doesn't exist
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS rationale TEXT;

-- Populate rationale from workout_exercises table
-- For each exercise, take the first non-null rationale found in workout_exercises
UPDATE public.exercises e
SET rationale = (
  SELECT we.rationale
  FROM public.workout_exercises we
  WHERE we.exercise_id = e.id
    AND we.rationale IS NOT NULL
    AND we.rationale != ''
  LIMIT 1
)
WHERE e.rationale IS NULL OR e.rationale = '';

-- Create a trigger function to auto-populate rationale when new exercises are added
-- This will copy the rationale from workout_exercises when an exercise is first used
CREATE OR REPLACE FUNCTION auto_populate_exercise_rationale()
RETURNS TRIGGER AS $$
BEGIN
  -- If the exercise doesn't have a rationale yet, try to get one from workout_exercises
  IF NEW.rationale IS NULL OR NEW.rationale = '' THEN
    SELECT we.rationale INTO NEW.rationale
    FROM public.workout_exercises we
    WHERE we.exercise_id = NEW.id
      AND we.rationale IS NOT NULL
      AND we.rationale != ''
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only if it doesn't exist)
DROP TRIGGER IF EXISTS trigger_auto_populate_exercise_rationale ON public.exercises;
CREATE TRIGGER trigger_auto_populate_exercise_rationale
  BEFORE INSERT OR UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_exercise_rationale();
