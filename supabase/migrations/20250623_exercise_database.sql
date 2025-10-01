-- Create the exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  search_key TEXT UNIQUE NOT NULL,
  primary_muscles TEXT[] NOT NULL,
  secondary_muscles TEXT[],
  equipment TEXT,
  movement_type TEXT CHECK (movement_type IN ('compound', 'isolation', NULL)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS exercises_search_key_idx ON public.exercises(search_key);
CREATE INDEX IF NOT EXISTS exercises_equipment_idx ON public.exercises(equipment);
CREATE INDEX IF NOT EXISTS exercises_primary_muscles_idx ON public.exercises USING GIN(primary_muscles);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read exercises
CREATE POLICY "Exercises are viewable by everyone" 
  ON public.exercises FOR SELECT 
  USING (true);

-- Policy: Only authenticated users can insert
CREATE POLICY "Authenticated users can insert exercises" 
  ON public.exercises FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create workout_exercises junction table
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  order_index INTEGER NOT NULL,
  
  -- Exercise parameters for this specific workout
  sets INTEGER NOT NULL CHECK (sets > 0 AND sets <= 10),
  reps INTEGER NOT NULL CHECK (reps > 0 AND reps <= 100),
  rest_seconds INTEGER NOT NULL CHECK (rest_seconds >= 0 AND rest_seconds <= 600),
  
  -- Weight recommendation from AI
  weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
  weight_recommendation_type TEXT CHECK (weight_recommendation_type IN ('absolute', 'bodyweight_percentage', NULL)),
  weight_recommendation_value DECIMAL CHECK (weight_recommendation_value >= 0),
  
  -- AI rationale for including this exercise
  rationale TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique exercise order within a workout
  UNIQUE(workout_id, order_index)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS workout_exercises_workout_id_idx ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS workout_exercises_exercise_id_idx ON public.workout_exercises(exercise_id);

-- Enable RLS
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own workout exercises
CREATE POLICY "Users can view their own workout exercises" 
  ON public.workout_exercises FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts 
      WHERE workouts.id = workout_exercises.workout_id 
      AND workouts.user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own workout exercises
CREATE POLICY "Users can insert their own workout exercises" 
  ON public.workout_exercises FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts 
      WHERE workouts.id = workout_exercises.workout_id 
      AND workouts.user_id = auth.uid()
    )
  );

-- Add summary fields to the workouts table
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS
  total_sets INTEGER,
  total_exercises INTEGER,
  estimated_duration_minutes INTEGER,
  primary_muscles_targeted TEXT[],
  equipment_needed TEXT[];

-- Add check constraints
ALTER TABLE public.workouts 
  ADD CONSTRAINT check_total_sets CHECK (total_sets IS NULL OR total_sets > 0),
  ADD CONSTRAINT check_total_exercises CHECK (total_exercises IS NULL OR total_exercises > 0),
  ADD CONSTRAINT check_duration CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0);
