-- Create workout_exercises table
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  rest_seconds INTEGER NOT NULL,
  weight_unit TEXT DEFAULT 'lbs',
  weight_recommendation_type TEXT,
  weight_recommendation_value NUMERIC,
  rationale TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (workout_id, exercise_id)
);

-- Add RLS policies
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own workout exercises
CREATE POLICY "Allow users to select their own workout exercises" 
  ON public.workout_exercises 
  FOR SELECT 
  TO authenticated 
  USING (
    workout_id IN (
      SELECT id FROM public.workouts WHERE user_id = auth.uid()
    )
  );

-- Allow users to insert their own workout exercises
CREATE POLICY "Allow users to insert their own workout exercises" 
  ON public.workout_exercises 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    workout_id IN (
      SELECT id FROM public.workouts WHERE user_id = auth.uid()
    )
  );

-- Allow users to update their own workout exercises
CREATE POLICY "Allow users to update their own workout exercises" 
  ON public.workout_exercises 
  FOR UPDATE 
  TO authenticated 
  USING (
    workout_id IN (
      SELECT id FROM public.workouts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workout_id IN (
      SELECT id FROM public.workouts WHERE user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS workout_exercises_workout_id_idx ON public.workout_exercises (workout_id);
CREATE INDEX IF NOT EXISTS workout_exercises_exercise_id_idx ON public.workout_exercises (exercise_id);
CREATE INDEX IF NOT EXISTS workout_exercises_completed_idx ON public.workout_exercises (workout_id, completed);
