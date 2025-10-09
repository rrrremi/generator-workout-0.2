-- Add DELETE RLS policy for workout_exercises table
-- This allows users to delete exercises from their own workouts

CREATE POLICY "Allow users to delete their own workout exercises" 
  ON public.workout_exercises 
  FOR DELETE 
  TO authenticated 
  USING (
    workout_id IN (
      SELECT id FROM public.workouts WHERE user_id = auth.uid()
    )
  );
