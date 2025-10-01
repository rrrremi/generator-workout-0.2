-- Create workouts table
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Parsed workout data
  total_duration_minutes INTEGER NOT NULL,
  muscle_groups_targeted TEXT NOT NULL,
  joint_groups_affected TEXT NOT NULL,
  equipment_needed TEXT NOT NULL,
  
  -- Full workout JSON
  workout_data JSONB NOT NULL,
  
  -- AI metadata
  raw_ai_response TEXT NOT NULL, -- Store original response for debugging
  ai_model TEXT DEFAULT 'gpt-3.5-turbo',
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  
  -- Generation metadata
  generation_time_ms INTEGER, -- How long the API call took
  parse_attempts INTEGER DEFAULT 1, -- How many times we tried to parse
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS workouts_created_at_idx ON public.workouts(created_at DESC);

-- Add RLS policies
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Users can view their own workouts
CREATE POLICY "Users can view their own workouts"
  ON public.workouts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own workouts
CREATE POLICY "Users can insert their own workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all workouts
CREATE POLICY "Admins can view all workouts"
  ON public.workouts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));
