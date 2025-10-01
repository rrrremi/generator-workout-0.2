-- Add target_date column to workouts for scheduling
ALTER TABLE public.workouts
ADD COLUMN IF NOT EXISTS target_date DATE;

-- Optional index to support filtering by planned workout day
CREATE INDEX IF NOT EXISTS workouts_target_date_idx ON public.workouts(target_date);
