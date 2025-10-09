-- Fix RLS policies for exercises table
-- Run this in Supabase Studio SQL Editor

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow authenticated users to insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow admins to manage exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow admins to update exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow admins to delete exercises" ON public.exercises;

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read exercises
CREATE POLICY "Allow authenticated users to read exercises"
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
