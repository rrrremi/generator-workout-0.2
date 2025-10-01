-- Create exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  search_key TEXT NOT NULL UNIQUE,
  primary_muscles TEXT[] NOT NULL,
  secondary_muscles TEXT[] DEFAULT '{}',
  equipment TEXT DEFAULT 'bodyweight',
  movement_type TEXT CHECK (movement_type IN ('compound', 'isolation')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select exercises
CREATE POLICY "Allow authenticated users to select exercises" 
  ON public.exercises 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to insert exercises
CREATE POLICY "Allow authenticated users to insert exercises" 
  ON public.exercises 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Create index on search_key for faster lookups
CREATE INDEX IF NOT EXISTS exercises_search_key_idx ON public.exercises (search_key);
