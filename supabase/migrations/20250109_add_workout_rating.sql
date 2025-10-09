-- Add rating column to workouts table
-- Rating is 1-6 scale (nullable, user can choose not to rate)

ALTER TABLE public.workouts 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 6);

-- Add index for filtering by rating
CREATE INDEX IF NOT EXISTS workouts_rating_idx ON public.workouts (rating);
