-- Add status column to workouts for tracking lifecycle
ALTER TABLE public.workouts
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('new', 'target', 'missed', 'completed')) DEFAULT 'new';

-- Seed existing records with an appropriate status
UPDATE public.workouts
SET status = CASE
  WHEN status = 'completed' THEN 'completed'
  WHEN target_date IS NULL THEN 'new'
  WHEN target_date >= CURRENT_DATE THEN 'target'
  ELSE 'missed'
END;

-- Index to speed up filtering by status
CREATE INDEX IF NOT EXISTS workouts_status_idx ON public.workouts(status);
